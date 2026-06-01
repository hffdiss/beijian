import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { getCurrentUser } from "@/lib/auth";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "admin") {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const { id } = await params;
  const data = await request.json();

  // Build update data
  const updateData: Record<string, unknown> = {};
  if (data.role && ["admin", "user"].includes(data.role)) {
    updateData.role = data.role;
  }
  if (data.password) {
    if (String(data.password).length < 4) {
      return NextResponse.json({ error: "密码至少4位" }, { status: 400 });
    }
    updateData.passwordHash = await hashPassword(data.password);
    updateData.passwordChanged = true;
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "无有效更新字段" }, { status: 400 });
  }

  try {
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, username: true, role: true, passwordChanged: true },
    });
    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "admin") {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const { id } = await params;

  // Prevent self-deletion
  if (id === currentUser.sub) {
    return NextResponse.json({ error: "不能删除自己" }, { status: 400 });
  }

  try {
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  }
}
