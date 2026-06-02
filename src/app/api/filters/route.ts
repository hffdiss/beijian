import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const [equipmentCategories, materialCategories, spareStatuses, spareWarehouses] = await Promise.all([
    prisma.part.findMany({ select: { equipmentCategory: true }, distinct: ["equipmentCategory"], orderBy: { equipmentCategory: "asc" } }).then((r) => r.map((i) => i.equipmentCategory).filter(Boolean)),
    prisma.bom.findMany({ select: { materialCategory: true }, distinct: ["materialCategory"], orderBy: { materialCategory: "asc" } }).then((r) => r.map((i) => i.materialCategory).filter(Boolean)),
    prisma.part.findMany({ select: { spareStatus: true }, distinct: ["spareStatus"], orderBy: { spareStatus: "asc" } }).then((r) => r.map((i) => i.spareStatus).filter(Boolean)),
    prisma.part.findMany({ select: { spareWarehouse: true }, distinct: ["spareWarehouse"], orderBy: { spareWarehouse: "asc" } }).then((r) => r.map((i) => i.spareWarehouse).filter(Boolean)),
  ]);

  return NextResponse.json({
    equipmentCategories,
    materialCategories,
    spareStatuses,
    spareWarehouses,
  });
}
