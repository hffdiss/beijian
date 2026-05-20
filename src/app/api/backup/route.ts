import { NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import path from "path";

export async function GET() {
  const dbPath = path.join(process.cwd(), "prisma", "dev.db");
  if (!existsSync(dbPath)) {
    return NextResponse.json({ error: "数据库文件不存在" }, { status: 404 });
  }

  const buffer = readFileSync(dbPath);
  const date = new Date().toISOString().split("T")[0];

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="backup-${date}.db"`,
    },
  });
}
