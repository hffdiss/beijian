import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { importFromXlsx } from "@/lib/excel";
import path from "path";

export async function POST() {
  try {
    const filePath = path.join(process.cwd(), "beijian.xlsx");
    const result = await importFromXlsx(filePath, prisma);

    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "导入失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
