import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const projectId = searchParams.get("projectId") ?? "";
  const bomCode = searchParams.get("bomCode") ?? "";
  const isSpare = searchParams.get("isSpare") ?? "";
  const spareStatus = searchParams.get("spareStatus") ?? "";
  const spareWarehouse = searchParams.get("spareWarehouse") ?? "";
  const equipmentCategory = searchParams.get("equipmentCategory") ?? "";
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "50");

  const where: Record<string, unknown> = {};

  // Fuzzy search: split by whitespace, each term must match at least one field
  if (q) {
    const terms = q.trim().split(/\s+/).filter((t) => t.length > 0);
    if (terms.length > 0) {
      where.AND = terms.map((term) => ({
        OR: [
          { partSn: { contains: term } },
          { description: { contains: term } },
          { model: { contains: term } },
          { subModel: { contains: term } },
          { bomCode: { contains: term } },
          { nandType: { contains: term } },
          { firmwareVersion: { contains: term } },
          { equipmentCategory: { contains: term } },
          { supplier: { contains: term } },
          { spareWarehouse: { contains: term } },
          { spareStrategy: { contains: term } },
          { spareResponsible: { contains: term } },
          { remark: { contains: term } },
          { project: { name: { contains: term } } },
          { machine: { machineSn: { contains: term } } },
          { machine: { product: { contains: term } } },
        ],
      }));
    }
  }

  if (projectId) where.projectId = projectId;
  if (bomCode) where.bomCode = bomCode;
  if (equipmentCategory) where.equipmentCategory = equipmentCategory;
  if (isSpare) where.isSpare = isSpare === "true";
  if (spareStatus) where.spareStatus = spareStatus;
  if (spareWarehouse) where.spareWarehouse = spareWarehouse;

  const [parts, total] = await Promise.all([
    prisma.part.findMany({
      where,
      include: {
        project: { select: { name: true } },
        machine: { select: { machineSn: true } },
        bom: { select: { name: true } },
      },
      orderBy: { partSn: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.part.count({ where }),
  ]);

  return NextResponse.json({ parts, total, page, limit });
}
