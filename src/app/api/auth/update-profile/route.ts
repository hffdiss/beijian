import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, createToken, setAuthCookie } from "@/lib/auth";

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { username, role } = await request.json();

  if (username !== undefined) {
    if (!username.trim()) {
      return NextResponse.json({ error: "用户名不能为空" }, { status: 400 });
    }
    const existing = await prisma.user.findUnique({ where: { username: username.trim() } });
    if (existing && existing.id !== currentUser.sub) {
      return NextResponse.json({ error: "用户名已存在" }, { status: 409 });
    }
  }

  // Only admin can change roles
  let newRole = undefined;
  if (role !== undefined) {
    if (currentUser.role !== "admin") {
      return NextResponse.json({ error: "只有管理员可以修改角色" }, { status: 403 });
    }
    newRole = role;
  }

  const data: Record<string, string> = {};
  if (username !== undefined) data.username = username.trim();
  if (newRole !== undefined) data.role = newRole;

  const user = await prisma.user.update({
    where: { id: currentUser.sub },
    data,
  });

  const token = await createToken({
    id: user.id,
    username: user.username,
    role: user.role,
    passwordChanged: user.passwordChanged,
  });
  await setAuthCookie(token);

  return NextResponse.json({ user: { id: user.id, username: user.username, role: user.role } });
}
