import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const item = await prisma.item.findUnique({
      where: { id },
      include: {
        category: true,
        transactions: { orderBy: { createdAt: "desc" }, take: 50 },
      },
    });
    if (!item) {
      return NextResponse.json({ error: "物料不存在" }, { status: 404 });
    }
    return NextResponse.json(item);
  } catch {
    return NextResponse.json({ error: "获取物料失败" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = await request.json();

  try {
    const item = await prisma.item.update({
      where: { id },
      data: {
        code: data.code,
        name: data.name,
        description: data.description,
        sn: data.sn,
        model: data.model,
        manufacturer: data.manufacturer,
        categoryId: data.categoryId,
        unit: data.unit,
        quantity: data.quantity,
        safetyStock: data.safetyStock,
        position: data.position,
        supplier: data.supplier,
        price: data.price,
        warrantyStart: data.warrantyStart ? new Date(data.warrantyStart) : null,
        warrantyEnd: data.warrantyEnd ? new Date(data.warrantyEnd) : null,
        nandType: data.nandType,
        compatibleProducts: data.compatibleProducts,
      },
      include: { category: true },
    });
    return NextResponse.json(item);
  } catch {
    return NextResponse.json({ error: "物料不存在或更新失败" }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const txnCount = await prisma.transaction.count({
      where: { itemId: id },
    });
    if (txnCount > 0) {
      return NextResponse.json(
        { error: "该物料存在出入库记录，不能删除" },
        { status: 400 }
      );
    }
    await prisma.item.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "物料不存在" }, { status: 404 });
  }
}
