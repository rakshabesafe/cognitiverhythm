"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/components/ui/Toast";
import type { SectionIntro as SectionIntroData } from "@/lib/survey/schema";
import { LikertScale } from "./LikertScale";
import { SectionIntro } from "./SectionIntro";

interface Item {
  code: string;
  text: string;
  section?: string;
}

interface SurveyRunnerProps {
  title: string;
  intro: SectionIntroData;
  labels: string[];
  items: Item[];
  initialAnswers: Record<string, number>;
  /** Overrides the default immediate-navigate behavior when the module's last item is saved
   *  (e.g. Grit uses this to show a mid-flow insight screen before moving on). */
  onModuleComplete?: (nextRoute: string) => void;
}

export function SurveyRunner({ title, intro, labels, items, initialAnswers, onModuleComplete }: SurveyRunnerProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [answers, setAnswers] = useState<Record<string, number>>(initialAnswers);
  const firstUnanswered = items.findIndex((i) => typeof initialAnswers[i.code] !== "number");
  const [index, setIndex] = useState(firstUnanswered === -1 ? 0 : firstUnanswered);
  const [saving, setSaving] = useState(false);
  // Only greet with the hype screen on a fresh module — resuming mid-module skips it.
  const [started, setStarted] = useState(firstUnanswered !== 0);

  const total = items.length;
  const item = items[index];
  const answeredCount = items.filter((i) => typeof answers[i.code] === "number").length;

  const goNext = useCallback(() => setIndex((i) => Math.min(i + 1, total - 1)), [total]);
  const goPrev = useCallback(() => setIndex((i) => Math.max(i - 1, 0)), []);

  const selectValue = useCallback(
    async (value: number) => {
      setAnswers((a) => ({ ...a, [item.code]: value }));
      setSaving(true);
      try {
        const res = await fetch("/api/survey/answer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemCode: item.code, value }),
        });
        if (res.status === 401) {
          showToast("Your session has expired. Please log in again.", "error");
          router.push("/login");
          router.refresh();
          return;
        }
        const data = await res.json();
        if (!res.ok) {
          showToast(data.error ?? "Could not save your answer.", "error");
          return;
        }
        showToast("Saved");
        if (index === total - 1) {
          const nextRoute = data.nextRoute ?? "/dashboard";
          if (onModuleComplete) {
            onModuleComplete(nextRoute);
          } else {
            router.push(nextRoute);
            router.refresh();
          }
        } else {
          setIndex((i) => Math.min(i + 1, total - 1));
        }
      } finally {
        setSaving(false);
      }
    },
    [item, index, total, router, showToast, onModuleComplete]
  );

  useEffect(() => {
    if (!started) return;
    function onKeyDown(e: KeyboardEvent) {
      const num = Number(e.key);
      if (Number.isInteger(num) && num >= 1 && num <= labels.length) {
        e.preventDefault();
        void selectValue(num);
        return;
      }
      if (e.key === "ArrowLeft") goPrev();
      if ((e.key === "ArrowRight" || e.key === "Enter") && typeof answers[item.code] === "number") {
        goNext();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [started, selectValue, goPrev, goNext, answers, item, labels.length]);

  if (!started) {
    return (
      <SectionIntro
        emoji={intro.emoji}
        tagline={intro.tagline}
        body={intro.body}
        itemCount={total}
        onBegin={() => setStarted(true)}
      />
    );
  }

  const progressPercent = (answeredCount / total) * 100;

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-6 py-8">
      <div>
        <div className="mb-2 flex items-center justify-between text-xs text-muted">
          <span>{title}</span>
          <span>
            {index + 1} / {total}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-center gap-6">
        {item.section && (
          <span className="w-fit rounded-full border border-border px-3 py-1 text-xs text-muted">
            {item.section}
          </span>
        )}
        <p className="text-lg font-medium text-foreground">{item.text}</p>
        <LikertScale labels={labels} value={answers[item.code]} onSelect={selectValue} />
        {saving && <p className="text-xs text-muted">Saving…</p>}
      </div>

      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={goPrev}
          disabled={index === 0}
          className="rounded-lg px-3 py-2 text-muted disabled:opacity-30"
        >
          ← Previous
        </button>
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="rounded-lg px-3 py-2 text-muted hover:text-foreground"
        >
          Save &amp; exit
        </button>
      </div>
    </main>
  );
}
