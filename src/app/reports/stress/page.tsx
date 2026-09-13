import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireParticipant } from "@/lib/auth/session";
import { chooseStressHook } from "@/lib/survey/hooks";
import { computeBenchmarkForModules, computeSectionBreakdown } from "@/lib/survey/scoring";
import { PROFILE_TIERS } from "@/lib/survey/tiers";
import { BenchmarkRows } from "@/components/survey/BenchmarkRows";
import { ReportShell } from "@/components/survey/ReportShell";
import { ScoreTable } from "@/components/survey/ScoreTable";

const TIER = PROFILE_TIERS.find((t) => t.id === "stress")!;

export default async function StressReportPage() {
  const userId = await requireParticipant();
  const responses = await db.getResponses(userId);
  if (!TIER.moduleIds.every((id) => responses.completedModules.includes(id))) redirect("/dashboard");

  const allResponses = await db.listAllResponses();
  const peers = allResponses.filter((r) => r.userId !== userId);
  const sections = computeSectionBreakdown("technostress", responses.answers, peers);
  const hook = chooseStressHook(responses.answers, sections);
  const rows = computeBenchmarkForModules(TIER.moduleIds, responses.answers, peers);

  return (
    <ReportShell tier={TIER} heading={hook.heading} stat={hook.stat} pivot={hook.pivot} responses={responses}>
      <ScoreTable
        title="Where the pressure is coming from"
        rows={sections.map((s) => ({
          id: s.id,
          label: s.label,
          yourScore: s.yourScore,
          peerAverage: s.peerAverage,
          max: s.max,
        }))}
      />
      <BenchmarkRows rows={rows} />
    </ReportShell>
  );
}
