import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const bom = await prisma.bom.findUnique({
    where: { id },
    include: {
      _count: { select: { parts: true, items: true } },
      parts: {
        take: 50,
        orderBy: { partSn: "asc" },
        include: { project: { select: { name: true } } },
      },
    },
  });
  if (!bom) {
    return NextResponse.json({ error: "BOM不存在" }, { status: 404 });
  }
  return NextResponse.json(bom);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = await request.json();

  if (!data.bomCode) {
    return NextResponse.json({ error: "BBOM编码不能为空" }, { status: 400 });
  }

  try {
    const bom = await prisma.bom.update({
      where: { id },
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
        quantity: data.quantity,
        nandType: data.nandType,
        firmwareVersion: data.firmwareVersion,
        lifecycle: data.lifecycle,
        effectiveDate: data.effectiveDate ? new Date(data.effectiveDate) : null,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        supplier: data.supplier,
        detailDescription: data.detailDescription,
        processCode: data.processCode,
        status: data.status,
        isSpare: data.isSpare,
        remark: data.remark,
      },
    });
    return NextResponse.json(bom);
  } catch {
    return NextResponse.json({ error: "BOM不存在或更新失败" }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const bom = await prisma.bom.findUnique({ where: { id }, select: { bomCode: true } });
  if (!bom) return NextResponse.json({ error: "BOM不存在" }, { status: 404 });

  const partsCount = await prisma.part.count({ where: { bomCode: bom.bomCode } });
  const itemsCount = await prisma.item.count({ where: { bomCode: bom.bomCode } });
  if (partsCount > 0 || itemsCount > 0) {
    return NextResponse.json({ error: "该BOM下有部件或物料关联，不能删除" }, { status: 400 });
  }
  try {
    await prisma.bom.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "BOM不存在" }, { status: 404 });
  }
}
