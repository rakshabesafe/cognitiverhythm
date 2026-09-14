import Link from "next/link";
import type { ReactNode } from "react";
import { getNextRoute } from "@/lib/survey/scoring";
import { isTierUnlocked, nextTierAfter, type ProfileTier } from "@/lib/survey/tiers";
import { LogoutButton } from "@/components/ui/LogoutButton";

interface ReportShellProps {
  tier: ProfileTier;
  heading: string;
  stat: string;
  /** The hook into whatever profile comes next — hidden once they've already unlocked it. */
  pivot: string;
  responses: {
    demographics: Record<string, string>;
    completedModules: string[];
    completedAt?: string;
  };
  children: ReactNode;
}

/** Shared frame for an unlocked profile report: the reveal, the data, then the cliffhanger. */
export function ReportShell({ tier, heading, stat, pivot, responses, children }: ReportShellProps) {
  const followingTier = nextTierAfter(tier.id);
  const showPivot = !followingTier || !isTierUnlocked(followingTier, responses.completedModules);
  const allDone = Boolean(responses.completedAt);
  const continueHref = allDone ? "/results" : getNextRoute(responses);
  const continueLabel = allDone ? "Generate your Full Combined Report" : "Continue";

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="flex min-h-10 items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-sm font-medium text-foreground/90"
        >
          <span aria-hidden="true">←</span> Your Profile
        </Link>
        <LogoutButton />
      </div>

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-accent">
          {tier.emoji} {tier.title}
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">{heading}</h1>
      </div>

      <p className="text-foreground/90">{stat}</p>

      {children}

      {showPivot && <p className="text-muted">{pivot}</p>}

      <Link
        href={continueHref}
        className="min-h-14 rounded-xl bg-accent px-4 py-3 text-center font-medium text-background"
      >
        {continueLabel}
      </Link>
    </main>
  );
}
