import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getValidParticipantId } from "@/lib/auth/session";
import { chooseGritHook } from "@/lib/survey/hooks";
import { computeModuleMeanForAnswers, computeModulePeerStat } from "@/lib/survey/scoring";

export async function GET() {
  const userId = await getValidParticipantId();
  if (!userId) {
    return NextResponse.json({ error: "Your session has expired. Please log in again." }, { status: 401 });
  }

  const responses = await db.getResponses(userId);
  const allResponses = await db.listAllResponses();
  const peers = allResponses.filter((r) => r.userId !== userId);
  const peerTechnostress = computeModulePeerStat("technostress", peers);
  const peerGrit = computeModulePeerStat("grit", peers);
  const yourGritMean = computeModuleMeanForAnswers("grit", responses.answers) ?? 0;

  return NextResponse.json(chooseGritHook(responses.answers, peerTechnostress, yourGritMean, peerGrit));
}
