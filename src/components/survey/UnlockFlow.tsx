"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { SectionIntro as SectionIntroData } from "@/lib/survey/schema";
import { SurveyRunner } from "./SurveyRunner";

interface Item {
  code: string;
  text: string;
  section?: string;
}

interface UnlockFlowProps {
  title: string;
  intro: SectionIntroData;
  labels: string[];
  items: Item[];
  initialAnswers: Record<string, number>;
  analyzingLabel: string;
}

const MIN_ANALYZING_MS = 2200;

/**
 * Wraps SurveyRunner for a module that closes out a profile tier: instead of snapping
 * straight to the next section, it holds on a brief "analyzing" beat before revealing the
 * report that was just unlocked (the answer API returns that report's route).
 */
export function UnlockFlow({ analyzingLabel, ...runnerProps }: UnlockFlowProps) {
  const router = useRouter();
  const [nextRoute, setNextRoute] = useState<string | null>(null);

  useEffect(() => {
    if (!nextRoute) return;
    const timer = setTimeout(() => {
      router.push(nextRoute);
      router.refresh();
    }, MIN_ANALYZING_MS);
    return () => clearTimeout(timer);
  }, [nextRoute, router]);

  if (!nextRoute) {
    return <SurveyRunner {...runnerProps} onModuleComplete={(route) => setNextRoute(route)} />;
  }

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <div aria-hidden className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-accent" />
      <p className="text-muted">{analyzingLabel}</p>
    </main>
  );
}
