import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getValidParticipantId } from "@/lib/auth/session";
import { findModuleForItemCode, SCALES } from "@/lib/survey/schema";
import { getNextRoute } from "@/lib/survey/scoring";

export async function POST(request: Request) {
  const userId = await getValidParticipantId();
  if (!userId) {
    return NextResponse.json({ error: "Your session has expired. Please log in again." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const itemCode = typeof body?.itemCode === "string" ? body.itemCode : "";
  const value = typeof body?.value === "number" ? body.value : NaN;

  const mod = findModuleForItemCode(itemCode);
  if (!mod) {
    return NextResponse.json({ error: "Unknown item code." }, { status: 400 });
  }
  const maxValue = SCALES[mod.scale].labels.length;
  if (!Number.isInteger(value) || value < 1 || value > maxValue) {
    return NextResponse.json({ error: "Value out of range for this item's scale." }, { status: 400 });
  }

  const record = await db.saveAnswer(userId, itemCode, value);
  return NextResponse.json({
    completedModules: record.completedModules,
    completedAt: record.completedAt ?? null,
    nextRoute: getNextRoute(record),
  });
}
