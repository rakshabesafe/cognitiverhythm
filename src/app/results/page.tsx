import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireParticipant } from "@/lib/auth/session";
import { computeArchetype, computeBenchmark, computePeerAverages } from "@/lib/survey/scoring";
import { LogoutButton } from "@/components/ui/LogoutButton";
import { PrintButton } from "@/components/ui/PrintButton";

export default async function ResultsPage() {
  const userId = await requireParticipant();
  const responses = await db.getResponses(userId);
  if (!responses.completedAt) redirect("/dashboard");

  const allResponses = await db.listAllResponses();
  const peerAnswerSets = allResponses
    .filter((r) => r.completedAt && r.userId !== userId)
    .map((r) => r.answers);
  const peerAverages = computePeerAverages(peerAnswerSets);
  const benchmark = computeBenchmark(responses.answers, peerAverages);
  const archetype = computeArchetype(responses.answers);

  const name = responses.demographics.name?.trim();
  const role = responses.demographics.role;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="no-print text-xs font-medium uppercase tracking-wide text-accent">
            Cognitive Rhythm &amp; Resilience
          </p>
          <h1 className="text-2xl font-semibold text-foreground">Your Personal Report</h1>
          <p className="mt-1 text-sm text-muted">
            Prepared for {name || "you"}
            {role ? ` · ${role}` : ""}
          </p>
        </div>
        <div className="no-print flex shrink-0 items-center gap-3">
          <LogoutButton />
        </div>
      </div>

      <p className="text-sm text-muted">
        Thank you for contributing to this research on the Indian IT workforce. This report
        analyzes your responses on cognitive load, technological adaptation, and grit to reflect
        back your current professional operating rhythm — and a few concrete ways to protect it.
      </p>

      <PrintButton />

      {/* Section 1: Benchmark */}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-foreground">1. Your Industry Benchmark</h2>
        <p className="text-sm text-muted">How your current operating rhythm compares to peers who&apos;ve completed this.</p>
        <div className="flex flex-col gap-3">
          {benchmark.map((row) => (
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
                    Peer average: {row.peerAverage.toFixed(2)} / {row.max.toFixed(1)} (
                    {row.peerCount} {row.peerCount === 1 ? "peer" : "peers"}).
                  </span>
                )}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Section 2: Diagnosis */}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-foreground">2. Your Operating Profile</h2>
        <div className="rounded-2xl border border-accent/40 bg-accent/10 p-5">
          <h3 className="mb-2 text-xl font-semibold text-foreground">{archetype.name}</h3>
          <p className="text-sm leading-relaxed text-foreground/90">{archetype.diagnosis}</p>
        </div>
      </section>

      {/* Section 3: Action plan */}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-foreground">3. Strategic Action Plan</h2>
        <div className="flex flex-col gap-3">
          {archetype.actions.map((action, idx) => (
            <div key={idx} className="flex gap-3 rounded-2xl border border-border bg-surface p-4">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-background">
                {idx + 1}
              </span>
              <p className="text-sm text-foreground/90">{action}</p>
            </div>
          ))}
        </div>
      </section>

      <p className="text-center text-xs text-muted">
        This report is for personal and professional reflection only — it is not a clinical or
        diagnostic assessment. Thank you for contributing to this research.
      </p>
    </main>
  );
}
