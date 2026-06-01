import { SignJWT, jwtVerify } from "jose";
import { compare, hash } from "bcryptjs";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "beijian-secret-change-in-production"
);
const COOKIE_NAME = "beijian_token";

export interface AuthUser {
  sub: string;
  username: string;
  role: string;
  passwordChanged: boolean;
}

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return compare(password, hash);
}

export async function createToken(user: {
  id: string;
  username: string;
  role: string;
  passwordChanged: boolean;
}): Promise<string> {
  return new SignJWT({
    sub: user.id,
    username: user.username,
    role: user.role,
    passwordChanged: user.passwordChanged,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      sub: payload.sub as string,
      username: payload.username as string,
      role: (payload.role as string) ?? "user",
      passwordChanged: (payload.passwordChanged as boolean) ?? true,
    };
  } catch {
    return null;
  }
}

export async function getAuthCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value;
}

export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = await getAuthCookie();
  if (!token) return null;
  return verifyToken(token);
}
