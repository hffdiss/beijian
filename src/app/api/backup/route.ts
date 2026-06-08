import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync, unlinkSync } from "fs";
import { execSync } from "child_process";
import path from "path";

const BACKUP_DIR = path.join(process.cwd(), "backups");
const DB_URL = process.env.DATABASE_URL ?? "";
const isMySQL = DB_URL.startsWith("mysql://");

function getMySQLBackup(): Buffer {
  const url = new URL(DB_URL);
  const user = url.username;
  const password = url.password;
  const host = url.hostname;
  const port = url.port || "3306";
  const db = url.pathname.replace("/", "");
  const cmd = `mysqldump -u${user} -p${password} -h${host} -P${port} --single-transaction ${db}`;
  return execSync(cmd, { maxBuffer: 50 * 1024 * 1024 });
}

function restoreMySQL(sql: Buffer) {
  const url = new URL(DB_URL);
  const user = url.username;
  const password = url.password;
  const host = url.hostname;
  const port = url.port || "3306";
  const db = url.pathname.replace("/", "");
  const cmd = `mysql -u${user} -p${password} -h${host} -P${port} ${db}`;
  execSync(cmd, { input: sql, maxBuffer: 50 * 1024 * 1024 });
}

function getSQLiteBackup(): Buffer {
  const dbPath = path.join(process.cwd(), "prisma", "dev.db");
  if (!existsSync(dbPath)) throw new Error("数据库文件不存在");
  return readFileSync(dbPath);
}

function restoreSQLite(buf: Buffer) {
  const dbPath = path.join(process.cwd(), "prisma", "dev.db");
  writeFileSync(dbPath, buf);
}

// GET: download backup or list history
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action") ?? "download";
  const name = searchParams.get("name") ?? "";

  if (action === "download" && name) {
    const filePath = path.join(BACKUP_DIR, name);
    if (!existsSync(filePath)) return NextResponse.json({ error: "备份不存在" }, { status: 404 });
    const buffer = readFileSync(filePath);
    return new NextResponse(buffer, { headers: { "Content-Type": "application/octet-stream", "Content-Disposition": `attachment; filename="${name}"` } });
  }

  if (action === "list") {
    try {
      mkdirSync(BACKUP_DIR, { recursive: true });
      const files = readdirSync(BACKUP_DIR).filter((f) => f.endsWith(isMySQL ? ".sql" : ".db")).map((f) => {
        const s = statSync(path.join(BACKUP_DIR, f));
        return { name: f, size: s.size, createdAt: s.birthtime.toISOString() };
      }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return NextResponse.json(files);
    } catch { return NextResponse.json([]); }
  }

  // Download latest backup
  try {
    mkdirSync(BACKUP_DIR, { recursive: true });
    const ext = isMySQL ? ".sql" : ".db";
    const date = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const filename = `backup-${date}${ext}`;
    const buffer = isMySQL ? getMySQLBackup() : getSQLiteBackup();
    writeFileSync(path.join(BACKUP_DIR, filename), buffer);
    return new NextResponse(buffer, { headers: { "Content-Type": "application/octet-stream", "Content-Disposition": `attachment; filename="${filename}"` } });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

// POST: create backup without download
export async function POST() {
  try {
    mkdirSync(BACKUP_DIR, { recursive: true });
    const ext = isMySQL ? ".sql" : ".db";
    const date = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const filename = `backup-${date}${ext}`;
    const buffer = isMySQL ? getMySQLBackup() : getSQLiteBackup();
    writeFileSync(path.join(BACKUP_DIR, filename), buffer);
    return NextResponse.json({ success: true, filename, size: buffer.length });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

// PUT: restore backup
export async function PUT(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name") ?? "";

  if (name) {
    const backupPath = path.join(BACKUP_DIR, name);
    if (!existsSync(backupPath)) return NextResponse.json({ error: "备份不存在" }, { status: 404 });
    try {
      // Auto-backup before restore
      mkdirSync(BACKUP_DIR, { recursive: true });
      const ext = isMySQL ? ".sql" : ".db";
      const preDate = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
      const preBuf = isMySQL ? getMySQLBackup() : getSQLiteBackup();
      writeFileSync(path.join(BACKUP_DIR, `pre-restore-${preDate}${ext}`), preBuf);

      const buf = readFileSync(backupPath);
      isMySQL ? restoreMySQL(buf) : restoreSQLite(buf);
      return NextResponse.json({ success: true });
    } catch (e) { return NextResponse.json({ error: (e as Error).message }, { status: 500 }); }
  }

  // Upload restore
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("multipart/form-data")) {
    try {
      const formData = await request.formData();
      const file = formData.get("file");
      if (!file || !(file instanceof File)) return NextResponse.json({ error: "请选择备份文件" }, { status: 400 });
      // Auto-backup
      mkdirSync(BACKUP_DIR, { recursive: true });
      const ext = isMySQL ? ".sql" : ".db";
      const preDate = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
      const preBuf = isMySQL ? getMySQLBackup() : getSQLiteBackup();
      writeFileSync(path.join(BACKUP_DIR, `pre-restore-${preDate}${ext}`), preBuf);

      const buf = Buffer.from(await file.arrayBuffer());
      isMySQL ? restoreMySQL(buf) : restoreSQLite(buf);
      return NextResponse.json({ success: true });
    } catch (e) { return NextResponse.json({ error: (e as Error).message }, { status: 500 }); }
  }
  return NextResponse.json({ error: "缺少备份文件名或文件" }, { status: 400 });
}

// DELETE: remove backup
export async function DELETE(request: NextRequest) {
  const name = new URL(request.url).searchParams.get("name") ?? "";
  if (!name) return NextResponse.json({ error: "缺少文件名" }, { status: 400 });
  const filePath = path.join(BACKUP_DIR, name);
  if (!existsSync(filePath)) return NextResponse.json({ error: "备份不存在" }, { status: 404 });
  try { unlinkSync(filePath); return NextResponse.json({ success: true }); }
  catch { return NextResponse.json({ error: "删除失败" }, { status: 500 }); }
}
