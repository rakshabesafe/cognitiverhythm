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

  const hook = chooseEnergyAllocationHook(responses.answers);
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
      <p className="text-foreground/90">{hook.bodyParagraphs[0]}</p>
      <p className="text-foreground/90">{hook.bodyParagraphs[1]}</p>
    </ReportShell>
  );
}
