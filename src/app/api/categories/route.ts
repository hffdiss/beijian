import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: { _count: { select: { items: true } } },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(categories);
  } catch (error) {
    return NextResponse.json({ error: "获取分类列表失败" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const data = await request.json();

  if (!data.name || typeof data.name !== "string" || data.name.trim().length === 0) {
    return NextResponse.json({ error: "分类名称不能为空" }, { status: 400 });
  }

  const category = await prisma.category.create({
    data: {
      name: data.name.trim(),
      parentId: data.parentId || null,
      description: data.description || null,
    },
  });
  return NextResponse.json(category, { status: 201 });
}
