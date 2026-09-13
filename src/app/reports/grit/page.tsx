import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireParticipant } from "@/lib/auth/session";
import { chooseGritHook } from "@/lib/survey/hooks";
import { computeGritFacetBreakdown, computeModulePeerStat } from "@/lib/survey/scoring";
import { GritFacetTable } from "@/components/survey/GritFacetTable";
import { LogoutButton } from "@/components/ui/LogoutButton";

export default async function GritReportPage() {
  const userId = await requireParticipant();
  const responses = await db.getResponses(userId);
  if (!responses.completedModules.includes("grit")) redirect("/dashboard");

  const allResponses = await db.listAllResponses();
  const peers = allResponses.filter((r) => r.userId !== userId);
  const peerTechnostress = computeModulePeerStat("technostress", peers);
  const facets = computeGritFacetBreakdown(responses.answers, peers);
  const hook = chooseGritHook(facets, peerTechnostress);

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <Link href="/dashboard" className="text-sm text-muted underline underline-offset-2">
          ← Your Profile
        </Link>
        <LogoutButton />
      </div>

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-accent">🔥 Grit Profile</p>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">{hook.heading}</h1>
      </div>

      <p className="text-foreground/90">{hook.stat}</p>
      <GritFacetTable facets={hook.facets} />
      <p className="text-muted">{hook.pivot}</p>
    </main>
  );
}
