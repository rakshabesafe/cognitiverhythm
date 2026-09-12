import { NextResponse } from "next/server";
import { ADMIN_COOKIE, clearSessionCookie } from "@/lib/auth/session";

export async function POST() {
  await clearSessionCookie(ADMIN_COOKIE);
  return NextResponse.json({ ok: true });
}
