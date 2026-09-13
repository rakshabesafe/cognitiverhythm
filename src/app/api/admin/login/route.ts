import { NextResponse } from "next/server";
import { verifyAdminCredentials } from "@/lib/auth/adminCredentials";
import { ADMIN_COOKIE, setSessionCookie, signSession } from "@/lib/auth/session";
import { withErrorHandling } from "@/lib/api/withErrorHandling";

export const POST = withErrorHandling(async (request: Request) => {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  const valid = email ? await verifyAdminCredentials(email, password) : false;

  if (!valid) {
    return NextResponse.json({ error: "Invalid admin credentials." }, { status: 401 });
  }

  const token = await signSession({ role: "admin" });
  await setSessionCookie(ADMIN_COOKIE, token);
  return NextResponse.json({ ok: true });
});
