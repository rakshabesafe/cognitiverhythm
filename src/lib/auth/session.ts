import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

const encoder = new TextEncoder();
function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set. Add it to .env.local");
  }
  return encoder.encode(secret);
}

export const SESSION_COOKIE = "cr_session";
export const ADMIN_COOKIE = "cr_admin_session";

interface ParticipantPayload {
  role: "participant";
  sub: string;
}
interface AdminPayload {
  role: "admin";
}
type SessionPayload = ParticipantPayload | AdminPayload;

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS)
    .sign(getSecret());
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.role === "participant" && typeof payload.sub === "string") {
      return { role: "participant", sub: payload.sub };
    }
    if (payload.role === "admin") {
      return { role: "admin" };
    }
    return null;
  } catch {
    return null;
  }
}

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_TTL_SECONDS,
};

export async function setSessionCookie(name: string, token: string) {
  const store = await cookies();
  store.set(name, token, cookieOptions);
}

export async function clearSessionCookie(name: string) {
  const store = await cookies();
  store.set(name, "", { ...cookieOptions, maxAge: 0 });
}

/** Returns the logged-in participant's user id, or null. Safe to call anywhere. */
export async function getParticipantSession(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = await verifySession(token);
  return payload?.role === "participant" ? payload.sub : null;
}

/** For Server Components/pages that require a logged-in participant. Redirects otherwise. */
export async function requireParticipant(): Promise<string> {
  const userId = await getParticipantSession();
  if (!userId) redirect("/login");
  // The cookie can outlive the user record it points to (e.g. account data reset
  // while a session was still active). Treat that the same as being logged out
  // rather than letting downstream db lookups throw.
  const user = await db.getUserById(userId);
  if (!user) redirect("/login");
  return userId;
}

/**
 * For Route Handlers that require a logged-in participant. Unlike requireParticipant(),
 * this can't redirect (the caller is a fetch(), not a navigation) — it clears the stale
 * cookie if the referenced user no longer exists and returns null so the route can
 * respond with a proper 401 instead of a db lookup throwing.
 */
export async function getValidParticipantId(): Promise<string | null> {
  const userId = await getParticipantSession();
  if (!userId) return null;
  const user = await db.getUserById(userId);
  if (!user) {
    await clearSessionCookie(SESSION_COOKIE);
    return null;
  }
  return userId;
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  const payload = token ? await verifySession(token) : null;
  return payload?.role === "admin";
}

/** For the admin dashboard page. Redirects to the admin login otherwise. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdminAuthenticated())) redirect("/admin");
}
