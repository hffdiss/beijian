import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId") ?? "";
  const q = searchParams.get("q") ?? "";
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");
  const sort = searchParams.get("sort") ?? "machineSn";
  const dir = (searchParams.get("dir") ?? "asc") === "desc" ? "desc" : "asc";

  const where: Record<string, unknown> = {};
  if (projectId) where.projectId = projectId;
  if (q) {
    where.OR = [
      { machineSn: { contains: q } },
      { product: { contains: q } },
    ];
  }

  const effectiveLimit = Math.min(Math.max(limit, 10), 50);
  const skip = (page - 1) * effectiveLimit;

  // Map sort field to Prisma orderBy
  const sortMap: Record<string, Record<string, string>> = {
    machineSn: { machineSn: dir },
    manufacturerSn: { manufacturerSn: dir },
    product: { product: dir },
    modelCode: { modelCode: dir },
    manufacturer: { manufacturer: dir },
    project: { project: { name: dir } },
  };

  const [machines, total] = await Promise.all([
    prisma.machine.findMany({
      where,
      include: {
        project: { select: { name: true } },
        _count: { select: { parts: true } },
      },
      orderBy: sortMap[sort] ?? { machineSn: "asc" },
      skip,
      take: effectiveLimit,
    }),
    prisma.machine.count({ where }),
  ]);

  return NextResponse.json({ machines, total, page, limit: effectiveLimit });
}
