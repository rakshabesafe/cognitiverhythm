import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireParticipant } from "@/lib/auth/session";
import { chooseGritHook, describePersistenceQuality, overallGritSummary } from "@/lib/survey/hooks";
import {
  computeGritFacetBreakdown,
  computePersistenceQuality,
  GRIT_OVERALL_REFERENCE_MEAN,
  GRIT_OVERALL_REFERENCE_RANGE,
} from "@/lib/survey/scoring";
import { PROFILE_TIERS } from "@/lib/survey/tiers";
import { FacetDescriptions } from "@/components/survey/FacetDescriptions";
import { ReportShell } from "@/components/survey/ReportShell";
import { ScoreTable } from "@/components/survey/ScoreTable";

const TIER = PROFILE_TIERS.find((t) => t.id === "grit")!;

export default async function GritReportPage() {
  const userId = await requireParticipant();
  const responses = await db.getResponses(userId);
  if (!responses.completedModules.includes("grit")) redirect("/dashboard");

  const facets = computeGritFacetBreakdown(responses.answers);
  const hook = chooseGritHook(facets, responses.demographics.role);
  const persistence = describePersistenceQuality(computePersistenceQuality(responses.answers));
  const facetTotal = persistence.adaptability + persistence.perseverance;
  const pivotShare = facetTotal > 0 ? Math.round((persistence.adaptability / facetTotal) * 100) : 50;

  const overallYourScore = facets.reduce((sum, f) => sum + f.yourScore, 0) / facets.length;

  return (
    <ReportShell tier={TIER} heading={hook.heading} stat={hook.stat} pivot={hook.pivot} responses={responses}>
      <ScoreTable
        title="Your MDGS profile"
        rows={facets.map((f) => ({
          id: f.id,
          label: f.label,
          yourScore: f.yourScore,
          referenceMean: f.referenceMean,
          referenceRange: f.referenceRange,
          max: 5,
        }))}
        footnote={`${overallGritSummary()} ${overallYourScore.toFixed(2)} / 5 (typical mean is ${GRIT_OVERALL_REFERENCE_MEAN.toFixed(2)} / 5, range ${GRIT_OVERALL_REFERENCE_RANGE[0].toFixed(2)}–${GRIT_OVERALL_REFERENCE_RANGE[1].toFixed(2)}).`}
      />

      <div className="rounded-2xl border border-border bg-surface p-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Persistence quality</p>
        <div className="mb-2 flex items-center justify-between gap-3">
          <h3 className="font-medium text-foreground">{persistence.label}</h3>
          <span className="whitespace-nowrap text-sm text-foreground">Ratio {persistence.ratio.toFixed(2)}</span>
        </div>
        <div className="mb-1.5 flex h-2.5 w-full overflow-hidden rounded-full bg-border">
          <div className="h-full bg-accent" style={{ width: `${pivotShare}%` }} />
          <div className="h-full bg-accent/35" style={{ width: `${100 - pivotShare}%` }} />
        </div>
        <p className="mb-2 text-xs text-muted">
          Adaptability {persistence.adaptability.toFixed(2)} / 5 · Perseverance of Effort{" "}
          {persistence.perseverance.toFixed(2)} / 5
        </p>
        <p className="text-sm text-foreground/90">{persistence.text}</p>
      </div>

      <FacetDescriptions facets={hook.facetDescriptions} />
    </ReportShell>
  );
}
