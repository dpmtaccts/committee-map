import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // No-cache on all API routes
  if (req.nextUrl.pathname.startsWith("/api/")) {
    res.headers.set("Cache-Control", "no-store");
  }

  return res;
}

export const config = {
  matcher: "/api/:path*",
};
