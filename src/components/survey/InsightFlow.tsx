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

interface InsightFlowProps {
  title: string;
  intro: SectionIntroData;
  labels: string[];
  items: Item[];
  initialAnswers: Record<string, number>;
  /** API route (GET) that returns { heading, stat, pivot } based on what's been answered so far. */
  hookEndpoint: string;
  analyzingLabel?: string;
}

interface GritBenchmark {
  yourScore: number;
  scaleMax: number;
  studyPeerAverage: number | null;
  studyPeerCount: number;
  worldAverage: number;
  worldSampleSize: number;
  worldCitation: string;
}

interface HookData {
  heading: string;
  stat: string;
  pivot: string;
  benchmark?: GritBenchmark;
}

function BenchmarkBar({ label, value, max, tone }: { label: string; value: number; max: number; tone: "you" | "peer" | "world" }) {
  const pct = Math.max(0, Math.min(100, ((value - 1) / (max - 1)) * 100));
  const barColor = tone === "you" ? "bg-accent" : tone === "peer" ? "bg-foreground/60" : "bg-muted";
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-xs text-muted">
        <span>{label}</span>
        <span className="font-medium text-foreground">{value.toFixed(2)} / {max}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-border">
        <div className={`h-2 rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function GritBenchmarkCard({ benchmark }: { benchmark: GritBenchmark }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted">How your grit compares</p>
      <div className="flex flex-col gap-3">
        <BenchmarkBar label="You" value={benchmark.yourScore} max={benchmark.scaleMax} tone="you" />
        {benchmark.studyPeerAverage !== null && (
          <BenchmarkBar
            label={`IT professionals in this study (${benchmark.studyPeerCount} so far)`}
            value={benchmark.studyPeerAverage}
            max={benchmark.scaleMax}
            tone="peer"
          />
        )}
        <BenchmarkBar label="Published research average (general population)" value={benchmark.worldAverage} max={benchmark.scaleMax} tone="world" />
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-muted">
        General-population figure from {benchmark.worldCitation}, N={benchmark.worldSampleSize.toLocaleString()}, measured on a
        comparable 1–5 scale. Provided as a rough reference point, not a like-for-like clinical comparison — that study used
        differently worded items than this one.
      </p>
    </div>
  );
}

const MIN_ANALYZING_MS = 2200;

/**
 * Wraps SurveyRunner for a module that should show a mid-flow "insight" screen after its
 * last question — an analyzing spinner, then a personalized, puzzling-but-informative
 * stat with a pivot into why the next section matters — before continuing on. Used after
 * Grit and after Contextual Performance; reusable for any future section that wants one.
 */
export function InsightFlow({
  hookEndpoint,
  analyzingLabel = "Analyzing your operating rhythm…",
  ...runnerProps
}: InsightFlowProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<"questions" | "analyzing" | "hook">("questions");
  const [nextRoute, setNextRoute] = useState("/dashboard");
  const [hook, setHook] = useState<HookData | null>(null);

  useEffect(() => {
    if (phase !== "analyzing") return;
    let cancelled = false;
    const start = Date.now();
    (async () => {
      const res = await fetch(hookEndpoint);
      const data = res.ok ? ((await res.json()) as HookData) : null;
      const remaining = Math.max(0, MIN_ANALYZING_MS - (Date.now() - start));
      setTimeout(() => {
        if (cancelled) return;
        if (data) {
          setHook(data);
          setPhase("hook");
        } else {
          // If the insight can't be generated for any reason, don't block progress on it.
          router.push(nextRoute);
          router.refresh();
        }
      }, remaining);
    })();
    return () => {
      cancelled = true;
    };
  }, [phase, nextRoute, router, hookEndpoint]);

  if (phase === "questions") {
    return (
      <SurveyRunner
        {...runnerProps}
        onModuleComplete={(route) => {
          setNextRoute(route);
          setPhase("analyzing");
        }}
      />
    );
  }

  if (phase === "analyzing") {
    return (
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
        <div
          aria-hidden
          className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-accent"
        />
        <p className="text-muted">{analyzingLabel}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center gap-6 px-6 py-16">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-accent">Quick insight</p>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">{hook?.heading}</h1>
      </div>
      <p className="text-foreground/90">{hook?.stat}</p>
      {hook?.benchmark && <GritBenchmarkCard benchmark={hook.benchmark} />}
      <p className="text-muted">{hook?.pivot}</p>
      <button
        type="button"
        onClick={() => {
          router.push(nextRoute);
          router.refresh();
        }}
        className="min-h-14 rounded-xl bg-accent px-4 py-3 font-medium text-background"
      >
        Continue
      </button>
    </main>
  );
}
