import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getValidParticipantId } from "@/lib/auth/session";
import { getNextRoute } from "@/lib/survey/scoring";

export async function POST() {
  const userId = await getValidParticipantId();
  if (!userId) {
    return NextResponse.json({ error: "Your session has expired. Please log in again." }, { status: 401 });
  }
  const user = await db.setConsent(userId);
  const responses = await db.getResponses(userId);
  return NextResponse.json({ consentAt: user.consentAt, nextRoute: getNextRoute(responses) });
}
