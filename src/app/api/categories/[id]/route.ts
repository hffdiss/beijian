import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = await request.json();

  if (!data.name || typeof data.name !== "string" || data.name.trim().length === 0) {
    return NextResponse.json({ error: "分类名称不能为空" }, { status: 400 });
  }

  try {
    const category = await prisma.category.update({
      where: { id },
      data: {
        name: data.name.trim(),
        parentId: data.parentId || null,
        description: data.description || null,
      },
    });
    return NextResponse.json(category);
  } catch (error) {
    return NextResponse.json({ error: "分类不存在" }, { status: 404 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Check for child categories
  const childCount = await prisma.category.count({ where: { parentId: id } });
  if (childCount > 0) {
    return NextResponse.json(
      { error: "该分类下存在子分类，不能删除" },
      { status: 400 }
    );
  }

  // Check for items in this category
  const itemCount = await prisma.item.count({ where: { categoryId: id } });
  if (itemCount > 0) {
    return NextResponse.json(
      { error: "该分类下存在物料，不能删除" },
      { status: 400 }
    );
  }

  try {
    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "分类不存在" }, { status: 404 });
  }
}
