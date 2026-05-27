import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId") ?? "";
  const q = searchParams.get("q") ?? "";

  const where: Record<string, unknown> = {};
  if (projectId) where.projectId = projectId;
  if (q) {
    where.OR = [
      { machineSn: { contains: q } },
      { product: { contains: q } },
    ];
  }

  const machines = await prisma.machine.findMany({
    where,
    include: {
      project: { select: { name: true } },
      _count: { select: { parts: true } },
    },
    orderBy: { machineSn: "asc" },
    take: 200,
  });

  return NextResponse.json(machines);
}
