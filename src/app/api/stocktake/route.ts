import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const batchId = searchParams.get("batchId") ?? "";

  if (batchId) {
    const items = await prisma.stockTake.findMany({
      where: { batchId },
      include: {
        item: { select: { id: true, code: true, name: true, unit: true, position: true } },
      },
      orderBy: { item: { name: "asc" } },
    });
    return NextResponse.json(items);
  }

  const batches = await prisma.stockTake.groupBy({
    by: ["batchId"],
    _count: { id: true },
    _min: { createdAt: true },
    orderBy: { _min: { createdAt: "desc" } },
  });
  return NextResponse.json(batches);
}

export async function POST(request: Request) {
  const data = await request.json();
  const batchId = Date.now().toString(36);
  const categoryId = data.categoryId;

  const where: Record<string, unknown> = {};
  if (categoryId) where.categoryId = categoryId;

  const items = await prisma.item.findMany({ where });

  if (items.length === 0) {
    return NextResponse.json(
      { error: "没有找到符合条件的物料" },
      { status: 400 }
    );
  }

  const records = await Promise.all(
    items.map((item) =>
      prisma.stockTake.create({
        data: {
          itemId: item.id,
          expectedQuantity: item.quantity,
          actualQuantity: item.quantity,
          difference: 0,
          batchId,
          note: "",
        },
      })
    )
  );

  return NextResponse.json({ batchId, count: records.length }, { status: 201 });
}
