import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, createToken, setAuthCookie } from "@/lib/auth";

export async function POST() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: currentUser.sub } });
  if (!user) {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  }

  const token = await createToken({
    id: user.id,
    username: user.username,
    role: user.role,
    passwordChanged: user.passwordChanged,
  });
  await setAuthCookie(token);

  return NextResponse.json({ success: true });
}
