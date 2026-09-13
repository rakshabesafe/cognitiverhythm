import { isDemographicsComplete, LIKERT_MODULES } from "@/lib/survey/schema";

/**
 * "Is this participant done" logic, kept separate from mongoStore.ts so it stays
 * easy to unit-test independent of the database.
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
