import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireParticipant } from "@/lib/auth/session";
import {
  countAnsweredRequiredDemographics,
  DEMOGRAPHICS,
  isDemographicsComplete,
  LIKERT_MODULES,
  TOTAL_LIKERT_ITEMS,
  TOTAL_REQUIRED_DEMOGRAPHIC_FIELDS,
} from "@/lib/survey/schema";
import { ModuleCard } from "@/components/survey/ModuleCard";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { LogoutButton } from "@/components/ui/LogoutButton";

export default async function DashboardPage() {
  const userId = await requireParticipant();
  const user = await db.getUserById(userId);
  if (!user?.consentAt) redirect("/consent");

  const responses = await db.getResponses(userId);
  const demographicsAnswered = countAnsweredRequiredDemographics(responses.demographics);
  const answeredItems = Object.keys(responses.answers).length;
  const totalItems = TOTAL_LIKERT_ITEMS + TOTAL_REQUIRED_DEMOGRAPHIC_FIELDS;
  const overallPercent = ((answeredItems + demographicsAnswered) / totalItems) * 100;

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-accent">Cognitive Rhythm &amp; Resilience</p>
          <h1 className="text-xl font-semibold text-foreground">Your Rhythm Map</h1>
        </div>
        <LogoutButton />
      </div>

      <div className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-4">
        <ProgressRing percent={overallPercent} size={64} />
        <div>
          <p className="font-medium text-foreground">Overall completion</p>
          <p className="text-sm text-muted">
            {responses.completedAt
              ? "All done — your personalized report is ready below."
              : "Work through each dimension at your own pace to unlock your personalized report."}
          </p>
        </div>
      </div>

      {responses.completedAt && (
        <Link
          href="/results"
          className="min-h-14 rounded-xl bg-accent px-4 py-3 text-center font-medium text-background"
        >
          View your personalized report
        </Link>
      )}

      <div className="flex flex-col gap-3">
        <ModuleCard
          href="/survey/demographics"
          title={DEMOGRAPHICS.title}
          description={DEMOGRAPHICS.description}
          answered={demographicsAnswered}
          total={TOTAL_REQUIRED_DEMOGRAPHIC_FIELDS}
          completed={isDemographicsComplete(responses.demographics)}
        />
        {LIKERT_MODULES.map((mod) => {
          const answered = mod.items.filter((i) => typeof responses.answers[i.code] === "number").length;
          return (
            <ModuleCard
              key={mod.id}
              href={`/survey/${mod.id}`}
              title={mod.title}
              description={mod.description}
              answered={answered}
              total={mod.items.length}
              completed={responses.completedModules.includes(mod.id)}
            />
          );
        })}
      </div>
    </main>
  );
}
