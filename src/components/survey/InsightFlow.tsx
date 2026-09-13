"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { SectionIntro as SectionIntroData } from "@/lib/survey/schema";
import type { GritFacetScore } from "@/lib/survey/scoring";
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

interface HookData {
  heading: string;
  stat: string;
  pivot: string;
  facets?: GritFacetScore[];
}

function GritFacetTable({ facets }: { facets: GritFacetScore[] }) {
  const hasAnyPeerData = facets.some((f) => f.peerAverage !== null);
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted">Your MDGS profile</p>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-muted">
              <th className="py-2 pr-2 font-normal">Facet</th>
              <th className="py-2 pr-2 text-right font-normal">Your score</th>
              <th className="py-2 text-right font-normal">Peer average</th>
            </tr>
          </thead>
          <tbody>
            {facets.map((f) => (
              <tr key={f.id} className="border-b border-border/50 last:border-0">
                <td className="py-2 pr-2 text-foreground">{f.label}</td>
                <td className="py-2 pr-2 text-right font-medium text-accent">{f.yourScore.toFixed(2)} / 5</td>
                <td className="py-2 text-right text-muted">
                  {f.peerAverage !== null ? `${f.peerAverage.toFixed(2)} / 5` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!hasAnyPeerData && (
        <p className="mt-3 text-[11px] leading-relaxed text-muted">
          You&rsquo;re among the first participants in this study, so there&rsquo;s no peer average yet — check back later
          as more IT professionals complete this section.
        </p>
      )}
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
      {hook?.facets && <GritFacetTable facets={hook.facets} />}
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
