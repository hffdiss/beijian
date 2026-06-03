import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const spareStatus = searchParams.get("spareStatus") ?? "";
  const spareWarehouse = searchParams.get("spareWarehouse") ?? "";
  const isSpare = searchParams.get("isSpare") ?? "";
  const equipmentCategory = searchParams.get("equipmentCategory") ?? "";

  const where: Record<string, unknown> = {};
  if (q) {
    const terms = q.trim().split(/\s+/).filter((t) => t.length > 0);
    if (terms.length > 0) {
      where.AND = terms.map((term) => ({
        OR: [{ partSn: { contains: term } }, { description: { contains: term } }, { model: { contains: term } }, { bomCode: { contains: term } }],
      }));
    }
  }
  if (spareStatus) where.spareStatus = spareStatus;
  if (spareWarehouse) where.spareWarehouse = spareWarehouse;
  if (isSpare) where.isSpare = isSpare === "true";
  if (equipmentCategory) where.equipmentCategory = equipmentCategory;

  const parts = await prisma.part.findMany({
    where,
    include: { project: { select: { name: true } }, machine: { select: { machineSn: true } } },
    orderBy: { partSn: "asc" },
    take: 10000,
  });

  const headers = ["部件SN", "描述", "型号", "项目", "机器SN", "类别", "备件", "备件状态", "备件库房", "供应商"];
  const rows = parts.map((p) => [
    p.partSn, p.description ?? "", p.model ?? "",
    p.project?.name ?? "", p.machine?.machineSn ?? "",
    p.equipmentCategory ?? "", p.isSpare ? "是" : "否",
    p.spareStatus ?? "", p.spareWarehouse ?? "", p.supplier ?? "",
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  return new NextResponse("﻿" + csvContent, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="parts-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
