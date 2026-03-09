import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

function makeToken(password: string) {
  return createHash("sha256").update(`era-admin:${password}`).digest("hex").slice(0, 32);
}

export async function POST(req: NextRequest) {
  const { password } = await req.json();

  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
  }

  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("admin_session", makeToken(password), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
  });
  return res;
}
