import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireParticipant } from "@/lib/auth/session";
import { chooseGritHook, overallGritSummary } from "@/lib/survey/hooks";
import { computeGritFacetBreakdown, GRIT_OVERALL_REFERENCE } from "@/lib/survey/scoring";
import { PROFILE_TIERS } from "@/lib/survey/tiers";
import { FacetDescriptions } from "@/components/survey/FacetDescriptions";
import { ReportShell } from "@/components/survey/ReportShell";
import { ScoreTable } from "@/components/survey/ScoreTable";

const TIER = PROFILE_TIERS.find((t) => t.id === "grit")!;

export default async function GritReportPage() {
  const userId = await requireParticipant();
  const responses = await db.getResponses(userId);
  if (!responses.completedModules.includes("grit")) redirect("/dashboard");

  const allResponses = await db.listAllResponses();
  const peers = allResponses.filter((r) => r.userId !== userId);
  const facets = computeGritFacetBreakdown(responses.answers, peers);
  const hook = chooseGritHook(facets);

  const overallYourScore = facets.reduce((sum, f) => sum + f.yourScore, 0) / facets.length;

  return (
    <ReportShell tier={TIER} heading={hook.heading} stat={hook.stat} pivot={hook.pivot} responses={responses}>
      <ScoreTable
        title="Your MDGS profile"
        rows={facets.map((f) => ({
          id: f.id,
          label: f.label,
          yourScore: f.yourScore,
          peerAverage: f.peerAverage,
          referenceAverage: f.referenceAverage,
          max: 5,
        }))}
        footnote={`${overallGritSummary(overallYourScore, GRIT_OVERALL_REFERENCE)} (${overallYourScore.toFixed(2)} / 5, typical is ${GRIT_OVERALL_REFERENCE.toFixed(2)} / 5.)`}
      />
      <FacetDescriptions facets={hook.facetDescriptions} />
    </ReportShell>
  );
}
