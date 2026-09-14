import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getValidParticipantId } from "@/lib/auth/session";
import { withErrorHandling } from "@/lib/api/withErrorHandling";

export const POST = withErrorHandling(async () => {
  const userId = await getValidParticipantId();
  if (!userId) {
    return NextResponse.json({ error: "Your session has expired. Please log in again." }, { status: 401 });
  }
  const user = await db.setConsent(userId);
  // Land on the dashboard rather than auto-forwarding into demographics, so the
  // participant sees the full set of reports they're unlocking before filling anything in.
  return NextResponse.json({ consentAt: user.consentAt, nextRoute: "/dashboard" });
});
