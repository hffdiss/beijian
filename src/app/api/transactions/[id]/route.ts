import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// DELETE 撤销单条记录，反向操作恢复库存
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await prisma.$transaction(async (tx) => {
      const txn = await tx.transaction.findUnique({ where: { id } });
      if (!txn) {
        throw new Error("记录不存在");
      }

      // 反向操作恢复库存
      const qtyChange = txn.type === "IN" ? -txn.quantity : txn.quantity;

      await tx.item.update({
        where: { id: txn.itemId },
        data: { quantity: { increment: qtyChange } },
      });
      await tx.transaction.delete({ where: { id } });
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "撤销失败";
    const status = message === "记录不存在" ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
