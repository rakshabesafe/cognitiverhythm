import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireParticipant } from "@/lib/auth/session";
import { computeBenchmarkForModules, stressNarrative } from "@/lib/survey/scoring";
import { LogoutButton } from "@/components/ui/LogoutButton";

const MODULE_IDS = ["technostress", "ai-anxiety"];

export default async function StressReportPage() {
  const userId = await requireParticipant();
  const responses = await db.getResponses(userId);
  if (!MODULE_IDS.every((id) => responses.completedModules.includes(id))) redirect("/dashboard");

  const allResponses = await db.listAllResponses();
  const peers = allResponses.filter((r) => r.userId !== userId);
  const narrative = stressNarrative(responses.answers);
  const rows = computeBenchmarkForModules(MODULE_IDS, responses.answers, peers);

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <Link href="/dashboard" className="text-sm text-muted underline underline-offset-2">
          ← Your Profile
        </Link>
        <LogoutButton />
      </div>

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-accent">⚡ Stress Profile</p>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">{narrative.heading}</h1>
      </div>

      <p className="text-foreground/90">{narrative.body}</p>

      <div className="flex flex-col gap-3">
        {rows.map((row) => (
          <div key={row.moduleId} className="rounded-2xl border border-border bg-surface p-4">
            <div className="mb-1 flex items-center justify-between gap-3">
              <h3 className="font-medium text-foreground">
                {row.emoji} {row.title}
              </h3>
              <span className="whitespace-nowrap text-sm text-foreground">
                {row.yourScore.toFixed(1)} / {row.max.toFixed(1)}
              </span>
            </div>
            <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${((row.yourScore - 1) / (row.max - 1)) * 100}%` }}
              />
            </div>
            <p className="text-sm text-muted">
              {row.comparisonText}
              {row.peerAverage !== null && (
                <span>
                  {" "}
                  Peer average: {row.peerAverage.toFixed(2)} / {row.max.toFixed(1)} ({row.peerCount}{" "}
                  {row.peerCount === 1 ? "peer" : "peers"}).
                </span>
              )}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}
