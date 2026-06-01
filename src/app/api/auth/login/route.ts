import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createToken, setAuthCookie } from "@/lib/auth";

export async function POST(request: Request) {
  const { username, password } = await request.json();

  if (!username || !password) {
    return NextResponse.json({ error: "用户名和密码不能为空" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    return NextResponse.json({ error: "用户名或密码错误" }, { status: 401 });
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "用户名或密码错误" }, { status: 401 });
  }

  const token = await createToken({
    id: user.id,
    username: user.username,
    role: user.role,
    passwordChanged: user.passwordChanged,
  });
  await setAuthCookie(token);

  return NextResponse.json({
    user: { id: user.id, username: user.username, role: user.role },
    passwordChanged: user.passwordChanged,
  });
}
