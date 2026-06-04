import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync, unlinkSync } from "fs";
import path from "path";

const BACKUP_DIR = path.join(process.cwd(), "backups");
const DB_PATH = path.join(process.cwd(), "prisma", "dev.db");

// GET: download backup or list history
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action") ?? "download";
  const name = searchParams.get("name") ?? "";

  // Download specific backup
  if (action === "download" && name) {
    const filePath = path.join(BACKUP_DIR, name);
    if (!existsSync(filePath)) {
      return NextResponse.json({ error: "备份文件不存在" }, { status: 404 });
    }
    const buffer = readFileSync(filePath);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${name}"`,
      },
    });
  }

  // List backup history
  if (action === "list") {
    try {
      mkdirSync(BACKUP_DIR, { recursive: true });
      const files = readdirSync(BACKUP_DIR)
        .filter((f) => f.endsWith(".db") || f.endsWith(".sql"))
        .map((f) => {
          const s = statSync(path.join(BACKUP_DIR, f));
          return { name: f, size: s.size, createdAt: s.birthtime.toISOString() };
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return NextResponse.json(files);
    } catch {
      return NextResponse.json([]);
    }
  }

  // Download: create backup and return
  if (!existsSync(DB_PATH)) {
    return NextResponse.json({ error: "数据库文件不存在" }, { status: 404 });
  }
  const buffer = readFileSync(DB_PATH);
  const date = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const filename = `backup-${date}.db`;

  // Save to backups directory
  try {
    mkdirSync(BACKUP_DIR, { recursive: true });
    writeFileSync(path.join(BACKUP_DIR, filename), buffer);
  } catch { /* still return download even if save fails */ }

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

// POST: create a backup (without downloading)
export async function POST() {
  if (!existsSync(DB_PATH)) {
    return NextResponse.json({ error: "数据库文件不存在" }, { status: 404 });
  }
  try {
    mkdirSync(BACKUP_DIR, { recursive: true });
    const buffer = readFileSync(DB_PATH);
    const date = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const filename = `backup-${date}.db`;
    writeFileSync(path.join(BACKUP_DIR, filename), buffer);
    return NextResponse.json({ success: true, filename, size: buffer.length });
  } catch (e) {
    return NextResponse.json({ error: "备份失败" }, { status: 500 });
  }
}

// DELETE: delete a backup
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name") ?? "";
  if (!name) return NextResponse.json({ error: "缺少备份文件名" }, { status: 400 });
  const filePath = path.join(BACKUP_DIR, name);
  if (!existsSync(filePath)) return NextResponse.json({ error: "备份文件不存在" }, { status: 404 });
  try {
    unlinkSync(filePath);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
