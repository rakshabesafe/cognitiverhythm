import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getValidParticipantId } from "@/lib/auth/session";
import { DEMOGRAPHICS } from "@/lib/survey/schema";
import { getNextRoute } from "@/lib/survey/scoring";

// Demographics are now collected one field at a time (see DemographicsRunner), so a
// request only ever carries the fields answered so far — not the full required set.
// Required-ness is enforced by the stepper UI (a required select can't advance without
// a value), not by this endpoint.
export async function POST(request: Request) {
  const userId = await getValidParticipantId();
  if (!userId) {
    return NextResponse.json({ error: "Your session has expired. Please log in again." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const fields = body?.fields;
  if (!fields || typeof fields !== "object") {
    return NextResponse.json({ error: "Missing fields." }, { status: 400 });
  }

  const clean: Record<string, string> = {};
  for (const field of DEMOGRAPHICS.fields) {
    if (!(field.code in fields)) continue;
    const raw = fields[field.code];
    const value = typeof raw === "string" ? raw.trim() : "";
    if (field.type === "select" && value && !field.options.includes(value)) {
      return NextResponse.json({ error: `Invalid value for ${field.label}.` }, { status: 400 });
    }
    // Store the field even if blank (e.g. the optional name field was skipped) — an
    // explicit empty string marks the step as visited, which is what the stepper's
    // resume logic (first field with no stored value at all) depends on.
    clean[field.code] = value;
  }

  const record = await db.saveDemographics(userId, clean);
  return NextResponse.json({
    completedModules: record.completedModules,
    nextRoute: getNextRoute(record),
  });
}
