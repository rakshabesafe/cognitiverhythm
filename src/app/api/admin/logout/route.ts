import { NextResponse } from "next/server";
import { ADMIN_COOKIE, clearSessionCookie } from "@/lib/auth/session";
import { withErrorHandling } from "@/lib/api/withErrorHandling";

export const POST = withErrorHandling(async () => {
  await clearSessionCookie(ADMIN_COOKIE);
  return NextResponse.json({ ok: true });
});
