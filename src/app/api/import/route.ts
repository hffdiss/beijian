import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { importFromXlsx } from "@/lib/excel";
import { writeFileSync, unlinkSync, mkdirSync } from "fs";
import path from "path";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
  try {
    let filePath = path.join(process.cwd(), "beijian.xlsx");
    let isTemp = false;

    // Check if this is a file upload
    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file");
      if (file && file instanceof File) {
        const tmpDir = path.join(process.cwd(), ".tmp");
        mkdirSync(tmpDir, { recursive: true });
        filePath = path.join(tmpDir, `${randomUUID()}.xlsx`);
        const buf = Buffer.from(await file.arrayBuffer());
        writeFileSync(filePath, buf);
        isTemp = true;
      }
    }

    const result = await importFromXlsx(filePath, prisma);

    // Clean up temp file
    if (isTemp) {
      try { unlinkSync(filePath); } catch { /* ignore */ }
    }

    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "导入失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
