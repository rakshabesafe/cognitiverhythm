import { NextResponse } from "next/server";
import { clearSessionCookie, SESSION_COOKIE } from "@/lib/auth/session";

export async function POST() {
  await clearSessionCookie(SESSION_COOKIE);
  return NextResponse.json({ ok: true });
}
