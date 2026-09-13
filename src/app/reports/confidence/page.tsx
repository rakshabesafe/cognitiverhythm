import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireParticipant } from "@/lib/auth/session";
import { chooseConfidenceHook, describeConfidenceRow, type RowInsight } from "@/lib/survey/hooks";
import { bandForModule, bandForScore, computeBenchmarkForModules } from "@/lib/survey/scoring";
import { PROFILE_TIERS } from "@/lib/survey/tiers";
import { InsightRows, type InsightRowData } from "@/components/survey/InsightRows";
import { ReportShell } from "@/components/survey/ReportShell";

const TIER = PROFILE_TIERS.find((t) => t.id === "confidence")!;

export default async function ConfidenceReportPage() {
  const userId = await requireParticipant();
  const responses = await db.getResponses(userId);
  if (!TIER.moduleIds.every((id) => responses.completedModules.includes(id))) redirect("/dashboard");

  const allResponses = await db.listAllResponses();
  const peers = allResponses.filter((r) => r.userId !== userId);

  const [efficacyRow] = computeBenchmarkForModules(["self-efficacy"], responses.answers, peers);
  const gritBand = bandForModule("grit", responses.answers);
  const hook = chooseConfidenceHook(responses.answers, responses.demographics, gritBand);

  const rows: InsightRowData[] = [
    { id: "self-efficacy", title: "Occupational Self-Efficacy", yourScore: efficacyRow.yourScore, max: efficacyRow.max, peerAverage: efficacyRow.peerAverage, peerCount: efficacyRow.peerCount },
  ];
  const insights: RowInsight[] = [describeConfidenceRow(bandForScore(efficacyRow.yourScore, efficacyRow.max))];

  return (
    <ReportShell
      tier={TIER}
      heading={hook.heading}
      stat="We just measured the pressure in your environment. But stress alone doesn't dictate performance — the deciding factor is Occupational Self-Efficacy, your core internal belief that you can overcome technical blockers and adapt to new systems. Per Conservation of Resources theory, when engineers face real stress, their confidence either shatters or it hardens. Here's where your internal armor stands right now:"
      pivot={hook.pivot}
      responses={responses}
    >
      <InsightRows rows={rows} insights={insights} />

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
