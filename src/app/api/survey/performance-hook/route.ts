import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getValidParticipantId } from "@/lib/auth/session";
import { choosePerformanceHook } from "@/lib/survey/hooks";
import { computeModuleMeanForAnswers, computeModulePeerMeans, percentileRank } from "@/lib/survey/scoring";

export async function GET() {
  const userId = await getValidParticipantId();
  if (!userId) {
    return NextResponse.json({ error: "Your session has expired. Please log in again." }, { status: 401 });
  }

  const responses = await db.getResponses(userId);
  const allResponses = await db.listAllResponses();
  const peers = allResponses.filter((r) => r.userId !== userId);

  const myContextualMean = computeModuleMeanForAnswers("contextual-performance", responses.answers) ?? 0;
  const peerMeans = computeModulePeerMeans("contextual-performance", peers);
  const percentile = percentileRank(myContextualMean, peerMeans);

  return NextResponse.json(choosePerformanceHook(responses.answers, { percentile, count: peerMeans.length }));
}
