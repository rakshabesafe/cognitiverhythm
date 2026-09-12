import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { SESSION_COOKIE, setSessionCookie, signSession } from "@/lib/auth/session";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  const user = email ? await db.getUserByEmail(email) : null;
  const valid = user ? await verifyPassword(password, user.passwordHash) : false;

  if (!user || !valid) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  await db.touchLogin(user.id);
  const token = await signSession({ role: "participant", sub: user.id });
  await setSessionCookie(SESSION_COOKIE, token);

  return NextResponse.json({ id: user.id, email: user.email, hasConsented: Boolean(user.consentAt) });
}
