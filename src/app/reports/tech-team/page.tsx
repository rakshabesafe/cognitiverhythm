import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireParticipant } from "@/lib/auth/session";
import { chooseEnergyAllocationHook } from "@/lib/survey/hooks";
import { LIKERT_MODULES, SCALES } from "@/lib/survey/schema";
import { computeModuleMeanForAnswers } from "@/lib/survey/scoring";
import { PROFILE_TIERS } from "@/lib/survey/tiers";
import { EnergyAllocationTable, type EnergyAllocationRow } from "@/components/survey/EnergyAllocationTable";
import { ReportShell } from "@/components/survey/ReportShell";

const TIER = PROFILE_TIERS.find((t) => t.id === "tech-team")!;

export default async function TechTeamReportPage() {
  const userId = await requireParticipant();
  const responses = await db.getResponses(userId);
  if (!TIER.moduleIds.every((id) => responses.completedModules.includes(id))) redirect("/dashboard");

  const hook = chooseEnergyAllocationHook(responses.answers, responses.demographics);

  // No peer comparison in this report — the archetype narrative is about the participant's
  // own allocation, not how it stacks up against anyone else — so this never fetches peers.
  const rows: EnergyAllocationRow[] = TIER.moduleIds.map((moduleId) => {
    const mod = LIKERT_MODULES.find((m) => m.id === moduleId)!;
    return {
      moduleId: moduleId as EnergyAllocationRow["moduleId"],
      title: mod.title,
      yourScore: computeModuleMeanForAnswers(moduleId, responses.answers) ?? 0,
      max: SCALES[mod.scale].labels.length,
    };
  });

  return (
    <ReportShell
      tier={TIER}
      heading={hook.heading}
      stat="You have the psychological toolkit. Now let's look at how you're currently allocating that resilience across your daily workload — your finite cognitive battery, split across two vectors: Technical Execution and Collaborative Support."
      pivot={hook.pivot}
      responses={responses}
    >
      <EnergyAllocationTable rows={rows} insights={hook.rowInsights} />

      <div className="rounded-2xl border border-border bg-surface p-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Bandwidth allocation</p>
        <div className="mb-2 flex h-2.5 w-full overflow-hidden rounded-full bg-border">
          <div className="h-full bg-accent" style={{ width: `${hook.bandwidthSplit.executionPct}%` }} />
          <div className="h-full bg-accent/35" style={{ width: `${hook.bandwidthSplit.collaborationPct}%` }} />
        </div>
        <p className="text-sm text-foreground/90">
          <span className="font-medium text-foreground">{hook.bandwidthSplit.executionPct}% Execution</span> /{" "}
          <span className="font-medium text-foreground">{hook.bandwidthSplit.collaborationPct}% Collaboration</span>
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-4">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted">Diagnostic ratios</p>
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-sm font-medium text-foreground">
              Collaboration Balance Ratio: {hook.collaborationBalance.ratio.toFixed(2)} ({hook.collaborationBalance.label})
            </p>
            <p className="mt-0.5 text-sm text-foreground/90">{hook.collaborationBalance.text}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Cognitive Currency: {hook.cognitiveCurrency.currency.toFixed(1)} / 5.0</p>
            <p className="mt-0.5 text-sm text-foreground/90">{hook.cognitiveCurrency.text}</p>
          </div>
        </div>
      </div>

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

      {hook.careerStageDiagnostic && (
        <div className="rounded-2xl border border-border bg-surface p-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">{hook.careerStageDiagnostic.label}</p>
          <p className="text-sm text-foreground/90">{hook.careerStageDiagnostic.text}</p>
        </div>
      )}

      <div className="rounded-2xl border border-accent/40 bg-accent/10 p-4">
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-accent">Tuning parameter</p>
        <p className="text-sm text-foreground/90">{hook.tuningParameter}</p>
      </div>
    </ReportShell>
  );
}
