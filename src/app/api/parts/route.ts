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
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") ?? "20"), 10), 50);

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

export async function POST(request: Request) {
  const data = await request.json();

  if (!data.partSn) {
    return NextResponse.json({ error: "部件SN不能为空" }, { status: 400 });
  }

  try {
    const part = await prisma.part.create({
      data: {
        partSn: data.partSn,
        description: data.description,
        model: data.model,
        equipmentCategory: data.equipmentCategory,
        projectId: data.projectId || null,
        machineId: data.machineId || null,
        bomCode: data.bomCode || null,
        spareStatus: data.spareStatus || null,
        spareWarehouse: data.spareWarehouse || null,
        spareQuantity: data.spareQuantity ?? 0,
        isSpare: data.isSpare ?? false,
      },
      include: { project: { select: { name: true } }, machine: { select: { machineSn: true } }, bom: { select: { name: true } } },
    });
    return NextResponse.json(part, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "创建失败";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
