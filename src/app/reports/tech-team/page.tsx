import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireParticipant } from "@/lib/auth/session";
import { choosePerformanceHook } from "@/lib/survey/hooks";
import {
  computeBenchmarkForModules,
  computeModuleMeanForAnswers,
  computeModulePeerMeans,
  percentileRank,
} from "@/lib/survey/scoring";
import { PROFILE_TIERS } from "@/lib/survey/tiers";
import { BenchmarkRows } from "@/components/survey/BenchmarkRows";
import { ReportShell } from "@/components/survey/ReportShell";

const TIER = PROFILE_TIERS.find((t) => t.id === "tech-team")!;

export default async function TechTeamReportPage() {
  const userId = await requireParticipant();
  const responses = await db.getResponses(userId);
  if (!TIER.moduleIds.every((id) => responses.completedModules.includes(id))) redirect("/dashboard");

  const allResponses = await db.listAllResponses();
  const peers = allResponses.filter((r) => r.userId !== userId);

  const myContextualMean = computeModuleMeanForAnswers("contextual-performance", responses.answers) ?? 0;
  const peerMeans = computeModulePeerMeans("contextual-performance", peers);
  const percentile = percentileRank(myContextualMean, peerMeans);
  const hook = choosePerformanceHook(responses.answers, { percentile, count: peerMeans.length });
  const rows = computeBenchmarkForModules(TIER.moduleIds, responses.answers, peers);

  return (
    <ReportShell tier={TIER} heading={hook.heading} stat={hook.stat} pivot={hook.pivot} responses={responses}>
      <BenchmarkRows rows={rows} />
    </ReportShell>
  );
}
