import { NextResponse } from "next/server";
import { verifyPassword } from "@/lib/auth/password";
import { ADMIN_COOKIE, setSessionCookie, signSession } from "@/lib/auth/session";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
  const adminHash = process.env.ADMIN_PASSWORD_HASH;

  const valid =
    Boolean(adminEmail && adminHash) &&
    email === adminEmail &&
    (await verifyPassword(password, adminHash as string));

  if (!valid) {
    return NextResponse.json({ error: "Invalid admin credentials." }, { status: 401 });
  }

  const token = await signSession({ role: "admin" });
  await setSessionCookie(ADMIN_COOKIE, token);
  return NextResponse.json({ ok: true });
}
