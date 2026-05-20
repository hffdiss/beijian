import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PUT 更新单条盘点记录
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = await request.json();

  try {
    const record = await prisma.stockTake.findUnique({ where: { id } });
    if (!record) {
      return NextResponse.json({ error: "记录不存在" }, { status: 404 });
    }

    const actualQuantity = data.actualQuantity;
    const difference = actualQuantity - record.expectedQuantity;

    const updated = await prisma.stockTake.update({
      where: { id },
      data: { actualQuantity, difference, note: data.note },
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "更新失败" }, { status: 400 });
  }
}

// POST 完成盘点 — 更新所有记录对应的 Item.quantity
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: batchId } = await params;

  try {
    const records = await prisma.stockTake.findMany({
      where: { batchId },
    });

    if (records.length === 0) {
      return NextResponse.json({ error: "批次不存在" }, { status: 404 });
    }

    await Promise.all(
      records.map((r) =>
        prisma.item.update({
          where: { id: r.itemId },
          data: { quantity: r.actualQuantity },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "完成盘点失败" }, { status: 400 });
  }
}
