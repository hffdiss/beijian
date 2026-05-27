import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const part = await prisma.part.findUnique({
    where: { id },
    include: {
      project: { select: { id: true, name: true, city: true, contractNumber: true } },
      machine: { select: { id: true, machineSn: true, product: true } },
      bom: true,
    },
  });
  if (!part) {
    return NextResponse.json({ error: "部件不存在" }, { status: 404 });
  }
  return NextResponse.json(part);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = await request.json();

  try {
    const part = await prisma.part.update({
      where: { id },
      data: {
        spareStatus: data.spareStatus,
        spareWarehouse: data.spareWarehouse,
        spareQuantity: data.spareQuantity,
        spareStrategy: data.spareStrategy,
        spareResponsible: data.spareResponsible,
        remark: data.remark,
      },
    });
    return NextResponse.json(part);
  } catch {
    return NextResponse.json({ error: "部件不存在或更新失败" }, { status: 400 });
  }
}
