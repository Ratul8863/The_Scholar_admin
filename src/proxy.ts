import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicPaths = ["/login", "/invite"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (publicPaths.some((path) => pathname.startsWith(path)) || pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }
  const token = request.cookies.get("authjs.session-token") ?? request.cookies.get("__Secure-authjs.session-token");
  if (!token) {
    const url = new URL("/login", request.url);
    if (pathname !== "/") url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
