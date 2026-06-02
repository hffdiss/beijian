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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = await request.json();

  try {
    const machine = await prisma.machine.update({
      where: { id },
      data: {
        machineSn: data.machineSn,
        manufacturerSn: data.manufacturerSn,
        product: data.product,
        modelCode: data.modelCode,
        manufacturer: data.manufacturer,
        projectId: data.projectId !== undefined ? data.projectId || null : undefined,
      },
      include: { project: { select: { name: true } } },
    });
    return NextResponse.json(machine);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "更新失败";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const partCount = await prisma.part.count({ where: { machineId: id } });
  if (partCount > 0) {
    return NextResponse.json({ error: `该机器下有 ${partCount} 个部件关联，不能删除` }, { status: 400 });
  }
  try {
    await prisma.machine.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "机器不存在" }, { status: 404 });
  }
}
