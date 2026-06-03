import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const materialCategory = searchParams.get("materialCategory") ?? "";
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "50");

  const where: Record<string, unknown> = {};
  if (q) {
    const terms = q.trim().split(/\s+/).filter((t) => t.length > 0);
    if (terms.length > 0) {
      where.AND = terms.map((term) => ({
        OR: [
          { bomCode: { contains: term } },
          { sbomCode: { contains: term } },
          { name: { contains: term } },
          { model: { contains: term } },
          { manufacturer: { contains: term } },
          { manufacturerModel: { contains: term } },
          { materialCategory: { contains: term } },
          { materialSubcategory: { contains: term } },
          { category: { contains: term } },
          { supplier: { contains: term } },
          { detailDescription: { contains: term } },
        ],
      }));
    }
  }
  if (materialCategory) where.materialCategory = materialCategory;

  const sort = searchParams.get("sort") ?? "bomCode";
  const dir = (searchParams.get("dir") ?? "asc") === "desc" ? "desc" : "asc";
  const sortMap: Record<string, Record<string, string>> = {
    bomCode: { bomCode: dir },
    name: { name: dir },
    model: { model: dir },
    materialCategory: { materialCategory: dir },
    manufacturer: { manufacturer: dir },
    unit: { unit: dir },
    status: { status: dir },
  };

  const [boms, total] = await Promise.all([
    prisma.bom.findMany({
      where,
      include: { _count: { select: { parts: true, items: true } } },
      orderBy: sortMap[sort] ?? { bomCode: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.bom.count({ where }),
  ]);

  return NextResponse.json({ boms, total, page, limit });
}

export async function POST(request: Request) {
  const data = await request.json();

  if (!data.bomCode) {
    return NextResponse.json({ error: "BBOM编码不能为空" }, { status: 400 });
  }

  try {
    const bom = await prisma.bom.create({
      data: {
        bomCode: data.bomCode,
        sbomCode: data.sbomCode,
        name: data.name,
        model: data.model,
        subModel: data.subModel,
        manufacturer: data.manufacturer,
        manufacturerModel: data.manufacturerModel,
        materialCategory: data.materialCategory,
        materialSubcategory: data.materialSubcategory,
        category: data.category,
        unit: data.unit,
        quantity: data.quantity ?? 1,
        nandType: data.nandType,
        firmwareVersion: data.firmwareVersion,
        lifecycle: data.lifecycle,
        effectiveDate: data.effectiveDate ? new Date(data.effectiveDate) : null,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        supplier: data.supplier,
        detailDescription: data.detailDescription,
        processCode: data.processCode,
        status: data.status,
        isSpare: data.isSpare ?? false,
        remark: data.remark,
      },
    });
    return NextResponse.json(bom, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "创建失败";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
