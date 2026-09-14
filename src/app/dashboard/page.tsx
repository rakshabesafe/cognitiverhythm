import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireParticipant } from "@/lib/auth/session";
import {
  countAnsweredRequiredDemographics,
  isDemographicsComplete,
  TOTAL_LIKERT_ITEMS,
  TOTAL_REQUIRED_DEMOGRAPHIC_FIELDS,
} from "@/lib/survey/schema";
import { getNextRoute } from "@/lib/survey/scoring";
import { isTierUnlocked, PROFILE_TIERS, tierProgress } from "@/lib/survey/tiers";
import { ProfileTierCard } from "@/components/survey/ProfileTierCard";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { LogoutButton } from "@/components/ui/LogoutButton";

export default async function DashboardPage() {
  const userId = await requireParticipant();
  const user = await db.getUserById(userId);
  if (!user?.consentAt) redirect("/consent");

  const responses = await db.getResponses(userId);
  const demographicsAnswered = countAnsweredRequiredDemographics(responses.demographics);
  const demographicsDone = isDemographicsComplete(responses.demographics);
  const answeredItems = Object.keys(responses.answers).length;
  const totalItems = TOTAL_LIKERT_ITEMS + TOTAL_REQUIRED_DEMOGRAPHIC_FIELDS;
  const overallPercent = ((answeredItems + demographicsAnswered) / totalItems) * 100;
  const nextRoute = getNextRoute(responses);

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-accent">Cognitive Rhythm &amp; Resilience</p>
          <h1 className="text-xl font-semibold text-foreground">Your Profile</h1>
        </div>
        <LogoutButton />
      </div>

      {!demographicsDone && (
        <Link
          href={nextRoute}
          className="flex items-center gap-4 rounded-2xl border border-accent/40 bg-accent/10 p-4 transition-colors hover:bg-accent/15"
        >
          <span className="text-2xl" aria-hidden>
            👋
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-foreground">Let&rsquo;s start with a few quick details about you</p>
            <p className="text-sm text-muted">
              {demographicsAnswered}/{TOTAL_REQUIRED_DEMOGRAPHIC_FIELDS} answered — every report below unlocks
              once this is done.
            </p>
          </div>
          <span className="shrink-0 text-sm text-accent">Start →</span>
        </Link>
      )}

      <div className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-4">
        <ProgressRing percent={overallPercent} size={64} />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-foreground">
            {responses.completedAt ? "Your profile is fully unlocked" : "Unlocking your profile"}
          </p>
          <p className="text-sm text-muted">
            {responses.completedAt
              ? "Every report below is ready to view."
              : "Keep going to unlock each report below, then your full combined report."}
          </p>
        </div>
      </div>

      {!responses.completedAt && demographicsDone && (
        <Link
          href={nextRoute}
          className="min-h-14 rounded-xl bg-accent px-4 py-3 text-center font-medium text-background"
        >
          Continue unlocking your profile
        </Link>
      )}

      <div className="flex flex-col gap-3">
        {PROFILE_TIERS.map((tier) => {
          const unlocked = isTierUnlocked(tier, responses.completedModules);
          const { answered, total } = tierProgress(tier, responses.answers);
          const percent = total > 0 ? (answered / total) * 100 : 0;
          return (
            <ProfileTierCard
              key={tier.id}
              tier={tier}
              unlocked={unlocked}
              percent={percent}
              continueHref={nextRoute}
            />
          );
        })}

        {responses.completedAt ? (
          <Link
            href="/results"
            className="flex items-center gap-4 rounded-2xl border border-accent/40 bg-accent/10 p-4 transition-colors hover:bg-accent/15"
          >
            <span className="text-2xl" aria-hidden>
              📊
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 font-medium text-foreground">
                Full Combined Report
                <span className="text-xs font-normal text-accent">🔓 Unlocked</span>
              </p>
              <p className="truncate text-sm text-muted">
                Your peer benchmark, operating profile, and strategic action plan — all in one place.
              </p>
            </div>
            <span className="shrink-0 text-sm text-accent">View →</span>
          </Link>
        ) : (
          <div className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-4 opacity-70">
            <span className="text-2xl grayscale" aria-hidden>
              📊
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 font-medium text-foreground">
                Full Combined Report
                <span className="text-xs font-normal text-muted">🔒 Locked</span>
              </p>
              <p className="truncate text-sm text-muted">
                Unlocks once every profile above is complete.
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
