// Groups the underlying survey modules into the three profile "unlocks" participants
// experience, so the app reads as unlocking a report rather than filling out a form.
import { LIKERT_MODULES } from "./schema";

export interface ProfileTier {
  id: "grit" | "tech-team" | "confidence";
  title: string;
  emoji: string;
  teaser: string;
  moduleIds: string[];
  reportHref: string;
}

export const PROFILE_TIERS: ProfileTier[] = [
  {
    id: "grit",
    title: "Grit Profile",
    emoji: "🔥",
    teaser: "The four Multi-Dimensional Grit Scale facets that shape how you push through obstacles.",
    moduleIds: ["grit"],
    reportHref: "/reports/grit",
  },
  {
    id: "tech-team",
    title: "Technology & Team Profile",
    emoji: "⚡",
    teaser: "How you execute, collaborate, and hold up under technology pressure — read alongside your grit.",
    moduleIds: ["task-performance", "contextual-performance", "technostress", "ai-anxiety"],
    reportHref: "/reports/tech-team",
  },
  {
    id: "confidence",
    title: "Confidence Profile",
    emoji: "💪",
    teaser: "How much you trust your own ability to handle whatever your job throws at you.",
    moduleIds: ["self-efficacy"],
    reportHref: "/reports/confidence",
  },
];

export function tierProgress(
  tier: ProfileTier,
  answers: Record<string, number>
): { answered: number; total: number } {
  const modules = LIKERT_MODULES.filter((m) => tier.moduleIds.includes(m.id));
  const total = modules.reduce((sum, m) => sum + m.items.length, 0);
  const answered = modules.reduce(
    (sum, m) => sum + m.items.filter((i) => typeof answers[i.code] === "number").length,
    0
  );
  return { answered, total };
}

export function isTierUnlocked(tier: ProfileTier, completedModules: string[]): boolean {
  return tier.moduleIds.every((id) => completedModules.includes(id));
}
