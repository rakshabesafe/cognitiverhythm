import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireParticipant } from "@/lib/auth/session";
import { chooseConfidenceHook } from "@/lib/survey/hooks";
import { computeBenchmarkForModules } from "@/lib/survey/scoring";
import { PROFILE_TIERS } from "@/lib/survey/tiers";
import { BenchmarkRows } from "@/components/survey/BenchmarkRows";
import { ReportShell } from "@/components/survey/ReportShell";

const TIER = PROFILE_TIERS.find((t) => t.id === "confidence")!;

export default async function ConfidenceReportPage() {
  const userId = await requireParticipant();
  const responses = await db.getResponses(userId);
  if (!TIER.moduleIds.every((id) => responses.completedModules.includes(id))) redirect("/dashboard");

  const allResponses = await db.listAllResponses();
  const peers = allResponses.filter((r) => r.userId !== userId);
  const hook = chooseConfidenceHook(responses.answers);
  const rows = computeBenchmarkForModules(TIER.moduleIds, responses.answers, peers);

  return (
    <ReportShell tier={TIER} heading={hook.heading} stat={hook.stat} pivot={hook.pivot} responses={responses}>
      <BenchmarkRows rows={rows} />
    </ReportShell>
  );
}
