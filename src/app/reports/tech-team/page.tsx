import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireParticipant } from "@/lib/auth/session";
import { chooseEnergyAllocationHook } from "@/lib/survey/hooks";
import { computeBenchmarkForModules } from "@/lib/survey/scoring";
import { PROFILE_TIERS } from "@/lib/survey/tiers";
import { EnergyAllocationTable } from "@/components/survey/EnergyAllocationTable";
import { ReportShell } from "@/components/survey/ReportShell";

const TIER = PROFILE_TIERS.find((t) => t.id === "tech-team")!;

export default async function TechTeamReportPage() {
  const userId = await requireParticipant();
  const responses = await db.getResponses(userId);
  if (!TIER.moduleIds.every((id) => responses.completedModules.includes(id))) redirect("/dashboard");

  const allResponses = await db.listAllResponses();
  const peers = allResponses.filter((r) => r.userId !== userId);

  const hook = chooseEnergyAllocationHook(responses.answers, responses.demographics);
  const rows = computeBenchmarkForModules(TIER.moduleIds, responses.answers, peers);

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
