import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") ?? "";
  const itemId = searchParams.get("itemId") ?? "";
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "50");

  const where: Record<string, unknown> = {};
  if (type) where.type = type;
  if (itemId) where.itemId = itemId;

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: { item: { select: { id: true, code: true, name: true, unit: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.transaction.count({ where }),
  ]);

  return NextResponse.json({ transactions, total, page, limit });
}

export async function POST(request: Request) {
  const data = await request.json();

  if (!data.type || !["IN", "OUT"].includes(data.type)) {
    return NextResponse.json(
      { error: "类型必须为 IN 或 OUT" },
      { status: 400 }
    );
  }

  if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
    return NextResponse.json(
      { error: "至少需要一个物料" },
      { status: 400 }
    );
  }

  const batchId = Date.now().toString(36);
  const type = data.type;

  try {
    const results = [];
    for (const row of data.items) {
      if (!row.itemId || !row.quantity || row.quantity <= 0) {
        return NextResponse.json(
          { error: "每个物料必须指定 itemId 和有效数量" },
          { status: 400 }
        );
      }

      const result = await prisma.$transaction(async (tx) => {
        const item = await tx.item.findUnique({ where: { id: row.itemId } });
        if (!item) {
          throw new Error(`物料 ${row.itemId} 不存在`);
        }

        const qtyChange = type === "IN" ? row.quantity : -row.quantity;
        const newQuantity = item.quantity + qtyChange;

        if (type === "OUT" && newQuantity < 0) {
          throw new Error(`物料 ${item.name} 库存不足 (当前: ${item.quantity} ${item.unit})`);
        }

        const [txn] = await Promise.all([
          tx.transaction.create({
            data: {
              type,
              itemId: row.itemId,
              quantity: row.quantity,
              reason: row.reason,
              relatedPerson: row.relatedPerson,
              note: row.note,
              batchId,
            },
          }),
          tx.item.update({
            where: { id: row.itemId },
            data: { quantity: newQuantity },
          }),
        ]);
        return txn;
      });

      results.push(result);
    }

    return NextResponse.json({ batchId, transactions: results }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "操作失败";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
