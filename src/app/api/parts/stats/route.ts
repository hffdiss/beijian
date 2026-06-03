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
        OR: [
          { partSn: { contains: term } },
          { description: { contains: term } },
          { model: { contains: term } },
          { bomCode: { contains: term } },
          { project: { name: { contains: term } } },
          { machine: { machineSn: { contains: term } } },
        ],
      }));
    }
  }
  if (spareStatus) where.spareStatus = spareStatus;
  if (spareWarehouse) where.spareWarehouse = spareWarehouse;
  if (isSpare) where.isSpare = isSpare === "true";
  if (equipmentCategory) where.equipmentCategory = equipmentCategory;

  const [byCategory, byStatus, byWarehouse, bySpare] = await Promise.all([
    prisma.part.groupBy({ by: ["equipmentCategory"], where, _count: true, orderBy: { _count: { id: "desc" } } }),
    prisma.part.groupBy({ by: ["spareStatus"], where, _count: true, orderBy: { _count: { id: "desc" } } }),
    prisma.part.groupBy({ by: ["spareWarehouse"], where, _count: true, orderBy: { _count: { id: "desc" } } }),
    prisma.part.groupBy({ by: ["isSpare"], where, _count: true }),
  ]);

  const total = await prisma.part.count({ where });

  return NextResponse.json({ total, byCategory, byStatus, byWarehouse, bySpare });
}
