import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireParticipant } from "@/lib/auth/session";
import {
  chooseStressHook,
  describeAiAnxietyOperationalRead,
  describeStressRow,
  describeTechnostressOperationalRead,
  stressDimensionMeaning,
  type RowInsight,
} from "@/lib/survey/hooks";
import { bandForModule, bandForScore, computeBenchmarkForModules, computeSectionBreakdown } from "@/lib/survey/scoring";
import { PROFILE_TIERS } from "@/lib/survey/tiers";
import { InsightRows, type InsightRowData } from "@/components/survey/InsightRows";
import { OperationalRead } from "@/components/survey/OperationalRead";
import { ReportShell } from "@/components/survey/ReportShell";

const TIER = PROFILE_TIERS.find((t) => t.id === "stress")!;

export default async function StressReportPage() {
  const userId = await requireParticipant();
  const responses = await db.getResponses(userId);
  if (!TIER.moduleIds.every((id) => responses.completedModules.includes(id))) redirect("/dashboard");

  const allResponses = await db.listAllResponses();
  const peers = allResponses.filter((r) => r.userId !== userId);

  const sections = computeSectionBreakdown("technostress", responses.answers, peers);
  const [aiAnxietyRow] = computeBenchmarkForModules(["ai-anxiety"], responses.answers, peers);
  const gritBand = bandForModule("grit", responses.answers);
  const hook = chooseStressHook(responses.answers, responses.demographics, gritBand);

  const rows: InsightRowData[] = [
    ...sections.map((s) => ({
      id: s.id,
      title: s.label,
      yourScore: s.yourScore,
      max: s.max,
      peerAverage: s.peerAverage,
      peerCount: s.peerCount,
      referenceMean: s.reference?.mean,
      referenceRange: s.reference?.range,
      meaning: stressDimensionMeaning(s.id),
    })),
    {
      id: "ai-anxiety",
      title: "AI Job Anxiety",
      yourScore: aiAnxietyRow.yourScore,
      max: aiAnxietyRow.max,
      peerAverage: aiAnxietyRow.peerAverage,
      peerCount: aiAnxietyRow.peerCount,
      meaning: stressDimensionMeaning("ai-anxiety"),
    },
  ];
  const insights: RowInsight[] = rows.map((row) => describeStressRow(row.id, bandForScore(row.yourScore, row.max)));
  const operationalReads = [
    ...sections.map((s) => ({ id: s.id, label: s.label, reading: describeTechnostressOperationalRead(s.id, s.yourScore, responses.demographics.role) })),
    { id: "ai-anxiety", label: "AI Job Anxiety", reading: describeAiAnxietyOperationalRead(aiAnxietyRow.yourScore, responses.demographics.role) },
  ].filter((r): r is { id: string; label: string; reading: NonNullable<typeof r.reading> } => r.reading !== null);

  return (
    <ReportShell
      tier={TIER}
      heading={hook.heading}
      stat="We've seen how you allocate your energy. Now let's look at the systemic forces draining it. In the modern IT landscape, stress originates from two directions: Operational Friction (the speed, complexity, and volume of your work) and Existential Threat (AI job replacement anxiety). Here's your current burden:"
      pivot={hook.pivot}
      responses={responses}
    >
      <InsightRows rows={rows} insights={insights} />

      {operationalReads.map((r) => (
        <div key={r.id} className="rounded-2xl border border-border bg-surface p-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Role-calibrated read — {r.label}</p>
          <OperationalRead reading={r.reading} />
        </div>
      ))}

      <div className="rounded-2xl border border-border bg-surface p-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">{hook.contextLabel}</p>
        <p className="text-sm text-foreground/90">{hook.contextText}</p>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-foreground">{hook.meaningLabel}</p>
        {hook.meaningParagraphs.map((paragraph, i) => (
          <p key={i} className="text-foreground/90">
            {paragraph}
          </p>
        ))}
      </div>
    </ReportShell>
  );
}
