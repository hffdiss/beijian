import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    // Group parts by equipmentCategory
    const rows = await prisma.part.groupBy({
      by: ["equipmentCategory"],
      _count: true,
      orderBy: { _count: { id: "desc" } },
      where: { equipmentCategory: { not: null } },
    });

    // Ensure default category exists
    let categoryId = "";
    const existingCat = await prisma.category.findFirst({ where: { name: "默认分类" } });
    if (existingCat) {
      categoryId = existingCat.id;
    } else {
      const newCat = await prisma.category.create({ data: { name: "默认分类" } });
      categoryId = newCat.id;
    }

    let created = 0;
    let skipped = 0;

    for (const row of rows) {
      const name = row.equipmentCategory!;
      const code = name.replace(/\s+/g, "-").toUpperCase().replace(/[^A-Z0-9-]/g, "");

      const existing = await prisma.item.findFirst({
        where: { OR: [{ code }, { name }] },
      });
      if (existing) { skipped++; continue; }

      const sample = await prisma.part.findFirst({
        where: { equipmentCategory: name },
        select: { model: true, nandType: true, supplier: true },
      });

      await prisma.item.create({
        data: {
          code,
          name,
          model: sample?.model ?? null,
          nandType: sample?.nandType ?? null,
          supplier: sample?.supplier ?? null,
          unit: "个",
          quantity: 0,
          safetyStock: Math.ceil(row._count * 0.1),
          categoryId,
        },
      });
      created++;
    }

    return NextResponse.json({ created, skipped });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "生成失败";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
