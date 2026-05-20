import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const items = await prisma.item.findMany({
    include: { category: true },
    orderBy: { code: "asc" },
  });

  const headers = [
    "编号", "名称", "描述", "SN号", "型号", "厂商", "分类", "单位",
    "库存数量", "安全库存", "存放位置", "供应商", "参考单价",
    "维保起始", "维保截止", "SSD颗粒", "适用产品",
  ];

  const rows = items.map((i) => [
    i.code, i.name, i.description ?? "", i.sn ?? "", i.model ?? "",
    i.manufacturer ?? "", i.category.name, i.unit,
    String(i.quantity), String(i.safetyStock), i.position ?? "",
    i.supplier ?? "", i.price != null ? String(i.price) : "",
    i.warrantyStart?.toISOString().split("T")[0] ?? "",
    i.warrantyEnd?.toISOString().split("T")[0] ?? "",
    i.nandType ?? "", i.compatibleProducts ?? "",
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  // Add BOM for Excel Chinese support
  const bom = "﻿";

  return new NextResponse(bom + csvContent, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="items-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
