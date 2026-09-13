import { NextResponse } from "next/server";
import { clearSessionCookie, SESSION_COOKIE } from "@/lib/auth/session";
import { withErrorHandling } from "@/lib/api/withErrorHandling";

export const POST = withErrorHandling(async () => {
  await clearSessionCookie(SESSION_COOKIE);
  return NextResponse.json({ ok: true });
});
