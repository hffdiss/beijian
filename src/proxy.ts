import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "beijian-secret-change-in-production"
);

const PUBLIC_PATHS = [
  "/login",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
  "/api/auth/me",
];

const PASSWORD_BYPASS_PATHS = [
  "/settings",
  "/api/auth/change-password",
  "/api/auth/update-profile",
  "/api/auth/logout",
  "/api/auth/me",
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Allow static assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.match(/\.(svg|png|jpg|jpeg|gif|css|js)$/)
  ) {
    return NextResponse.next();
  }

  // Check auth cookie
  const token = request.cookies.get("beijian_token")?.value;
  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);

    // Force password change on first login
    if (payload.passwordChanged === false) {
      const isBypassPath = PASSWORD_BYPASS_PATHS.some((p) =>
        pathname.startsWith(p)
      );
      if (!isBypassPath) {
        if (pathname.startsWith("/api/")) {
          return NextResponse.json(
            { error: "请先修改默认密码", mustChangePassword: true },
            { status: 403 }
          );
        }
        return NextResponse.redirect(new URL("/settings", request.url));
      }
    }

    return NextResponse.next();
  } catch {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "登录已过期" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
