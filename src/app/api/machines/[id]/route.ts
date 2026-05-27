import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const machine = await prisma.machine.findUnique({
    where: { id },
    include: {
      project: { select: { id: true, name: true, city: true, contractNumber: true } },
      parts: {
        take: 100,
        orderBy: { partSn: "asc" },
        include: { bom: { select: { bomCode: true, name: true } } },
      },
      _count: { select: { parts: true } },
    },
  });
  if (!machine) {
    return NextResponse.json({ error: "机器不存在" }, { status: 404 });
  }
  return NextResponse.json(machine);
}
