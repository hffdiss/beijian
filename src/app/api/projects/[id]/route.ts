import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      _count: { select: { machines: true, parts: true } },
      machines: {
        include: { _count: { select: { parts: true } } },
        orderBy: { machineSn: "asc" },
      },
      parts: { take: 20, orderBy: { partSn: "asc" }, include: { bom: { select: { bomCode: true, name: true } } } },
    },
  });
  if (!project) {
    return NextResponse.json({ error: "项目不存在" }, { status: 404 });
  }
  return NextResponse.json(project);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = await request.json();

  if (!data.name) {
    return NextResponse.json({ error: "项目名称不能为空" }, { status: 400 });
  }

  try {
    const project = await prisma.project.update({
      where: { id },
      data: {
        name: data.name,
        city: data.city,
        contractNumber: data.contractNumber,
        oem: data.oem,
        implementationDate: data.implementationDate ? new Date(data.implementationDate) : null,
        warrantyStart: data.warrantyStart ? new Date(data.warrantyStart) : null,
        warrantyEnd: data.warrantyEnd ? new Date(data.warrantyEnd) : null,
        projectSla: data.projectSla,
        remark: data.remark,
      },
    });
    return NextResponse.json(project);
  } catch {
    return NextResponse.json({ error: "项目不存在或更新失败" }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const [machineCount, partCount] = await Promise.all([
    prisma.machine.count({ where: { projectId: id } }),
    prisma.part.count({ where: { projectId: id } }),
  ]);
  if (machineCount > 0 || partCount > 0) {
    return NextResponse.json({ error: "该项目下有机器或部件关联，不能删除" }, { status: 400 });
  }
  try {
    await prisma.project.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "项目不存在" }, { status: 404 });
  }
}
