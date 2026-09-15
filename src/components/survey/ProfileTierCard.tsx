import Link from "next/link";
import type { ProfileTier } from "@/lib/survey/tiers";

interface ProfileTierCardProps {
  tier: ProfileTier;
  unlocked: boolean;
  percent: number;
  continueHref: string;
}

export function ProfileTierCard({ tier, unlocked, percent, continueHref }: ProfileTierCardProps) {
  if (unlocked) {
    return (
      <Link
        href={tier.reportHref}
        className="flex items-center gap-4 rounded-2xl border border-accent/40 bg-accent/10 p-4 transition-colors hover:bg-accent/15"
      >
        <span className="text-2xl" aria-hidden>
          {tier.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 font-medium text-foreground">
            {tier.title}
            <span className="text-xs font-normal text-accent">🔓 Unlocked</span>
          </p>
          <p className="text-sm text-muted">{tier.teaser}</p>
        </div>
        <span className="shrink-0 text-sm text-accent">View →</span>
      </Link>
    );
  }

  return (
    <Link
      href={continueHref}
      className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-4 opacity-70 transition-colors hover:opacity-100"
    >
      <span className="text-2xl grayscale" aria-hidden>
        {tier.emoji}
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 font-medium text-foreground">
          {tier.title}
          <span className="text-xs font-normal text-muted">🔒 Locked</span>
        </p>
        <p className="text-sm text-muted">{tier.teaser}</p>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border">
          <div className="h-full rounded-full bg-accent" style={{ width: `${percent}%` }} />
        </div>
      </div>
      <span className="shrink-0 text-sm text-muted">Continue →</span>
    </Link>
  );
}
