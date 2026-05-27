import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";

  const where: Record<string, unknown> = {};
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { city: { contains: q } },
      { contractNumber: { contains: q } },
    ];
  }

  const projects = await prisma.project.findMany({
    where,
    include: {
      _count: { select: { machines: true, parts: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(projects);
}

export async function POST(request: Request) {
  const data = await request.json();

  if (!data.name) {
    return NextResponse.json({ error: "项目名称不能为空" }, { status: 400 });
  }

  try {
    const project = await prisma.project.create({
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
    return NextResponse.json(project, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "创建失败";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
