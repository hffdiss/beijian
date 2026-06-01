import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, verifyPassword, hashPassword, createToken, setAuthCookie } from "@/lib/auth";

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { currentPassword, newPassword } = await request.json();

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "当前密码和新密码不能为空" }, { status: 400 });
  }

  if (newPassword.length < 4) {
    return NextResponse.json({ error: "新密码至少4位" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: currentUser.sub } });
  if (!user) {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  }

  const valid = await verifyPassword(currentPassword, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "当前密码错误" }, { status: 400 });
  }

  const newHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: currentUser.sub },
    data: { passwordHash: newHash, passwordChanged: true },
  });

  // Re-issue JWT with updated flag
  const token = await createToken({
    id: user.id,
    username: user.username,
    role: user.role,
    passwordChanged: true,
  });
  await setAuthCookie(token);

  return NextResponse.json({ success: true });
}
