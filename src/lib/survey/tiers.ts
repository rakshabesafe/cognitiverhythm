// Groups the underlying survey modules into the profile "unlocks" participants experience,
// so the app reads as unlocking a report rather than filling out a form. The order follows
// the study's own theoretical path: traits → environment → mindset → output, with each
// unlocked report ending on a hook into the one that follows.
import { LIKERT_MODULES } from "./schema";

export interface ProfileTier {
  id: "grit" | "stress" | "confidence" | "tech-team";
  title: string;
  emoji: string;
  teaser: string;
  /** Shown during the brief "analyzing" beat before this report is revealed. */
  analyzingLabel: string;
  moduleIds: string[];
  reportHref: string;
}

export const PROFILE_TIERS: ProfileTier[] = [
  {
    id: "grit",
    title: "Grit Profile",
    emoji: "🌱",
    teaser: "Your baseline psychological foundation, across the four dimensions of grit.",
    analyzingLabel: "Analyzing your operating rhythm…",
    moduleIds: ["grit"],
    reportHref: "/reports/grit",
  },
  {
    id: "stress",
    title: "Stress Profile",
    emoji: "⚡",
    teaser: "The cognitive weight you're currently carrying, from technology's pace and AI's rise.",
    analyzingLabel: "Measuring the pressure you're under…",
    moduleIds: ["technostress", "ai-anxiety"],
    reportHref: "/reports/stress",
  },
  {
    id: "confidence",
    title: "Confidence Profile",
    emoji: "🧠",
    teaser: "Your internal bridge — where grit pushes back against pressure.",
    analyzingLabel: "Locating your internal bridge…",
    moduleIds: ["self-efficacy"],
    reportHref: "/reports/confidence",
  },
  {
    id: "tech-team",
    title: "Technology & Team Profile",
    emoji: "🤝",
    teaser: "Your actual execution — deep technical work versus the invisible collaborative kind.",
    analyzingLabel: "Analyzing your execution and collaboration…",
    moduleIds: ["task-performance", "contextual-performance"],
    reportHref: "/reports/tech-team",
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

/** The tier this module closes out, if it's the last one in that tier. */
export function tierEndingWith(moduleId: string): ProfileTier | undefined {
  return PROFILE_TIERS.find((t) => t.moduleIds[t.moduleIds.length - 1] === moduleId);
}

/** The tier that follows this one in the narrative arc, if any. */
export function nextTierAfter(tierId: string): ProfileTier | undefined {
  const index = PROFILE_TIERS.findIndex((t) => t.id === tierId);
  return index === -1 ? undefined : PROFILE_TIERS[index + 1];
}

/**
 * The report to reveal after answering an item, when that answer just completed a tier —
 * the unlock moment. Returns undefined when the participant is still mid-tier.
 */
export function tierUnlockedByModule(moduleId: string, completedModules: string[]): ProfileTier | undefined {
  const tier = PROFILE_TIERS.find((t) => t.moduleIds.includes(moduleId));
  return tier && isTierUnlocked(tier, completedModules) ? tier : undefined;
}
