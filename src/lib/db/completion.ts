import { isDemographicsComplete, LIKERT_MODULES } from "@/lib/survey/schema";

/**
 * Shared by every DataStore implementation so "is this participant done" logic
 * can't drift between the JSON store and the MongoDB store.
 */
export function computeCompletion(
  demographics: Record<string, string>,
  answers: Record<string, number>,
  existingCompletedAt: string | undefined
): { completedModules: string[]; completedAt?: string } {
  const completedModules = LIKERT_MODULES.filter((mod) =>
    mod.items.every((item) => typeof answers[item.code] === "number")
  ).map((mod) => mod.id);
  const allDone = isDemographicsComplete(demographics) && completedModules.length === LIKERT_MODULES.length;
  return {
    completedModules,
    completedAt: allDone ? existingCompletedAt ?? new Date().toISOString() : undefined,
  };
}
