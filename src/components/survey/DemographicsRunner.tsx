"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/components/ui/Toast";
import type { DemographicField, SectionIntro as SectionIntroData } from "@/lib/survey/schema";
import { SectionIntro } from "./SectionIntro";

interface DemographicsRunnerProps {
  fields: DemographicField[];
  initialValues: Record<string, string>;
  intro: SectionIntroData;
}

interface SaveResult {
  nextRoute?: string;
}

export function DemographicsRunner({ fields, initialValues, intro }: DemographicsRunnerProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [started, setStarted] = useState(Object.keys(initialValues).length > 0);
  const initialIndex = (() => {
    const idx = fields.findIndex((f) => values[f.code] === undefined);
    return idx === -1 ? 0 : idx;
  })();
  const [index, setIndex] = useState(initialIndex);
  const [nameDraft, setNameDraft] = useState(initialValues.name ?? "");
  const [saving, setSaving] = useState(false);

  const total = fields.length;
  const field = fields[index];

  const goPrev = useCallback(() => setIndex((i) => Math.max(i - 1, 0)), []);

  const persist = useCallback(
    async (delta: Record<string, string>): Promise<SaveResult | null> => {
      setSaving(true);
      try {
        const res = await fetch("/api/survey/demographics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fields: delta }),
        });
        if (res.status === 401) {
          router.push("/login");
          router.refresh();
          return null;
        }
        const data = await res.json();
        if (!res.ok) {
          showToast(data.error ?? "Could not save.", "error");
          return null;
        }
        showToast("Saved");
        return data;
      } finally {
        setSaving(false);
      }
    },
    [router, showToast]
  );

  const submitField = useCallback(
    async (rawValue: string) => {
      const code = field.code;
      setValues((v) => ({ ...v, [code]: rawValue }));
      const data = await persist({ [code]: rawValue });
      if (!data) return;
      if (index === total - 1) {
        router.push(data.nextRoute ?? "/dashboard");
        router.refresh();
      } else {
        setIndex((i) => Math.min(i + 1, total - 1));
      }
    },
    [field, index, total, persist, router]
  );

  useEffect(() => {
    if (!started) return;
    function onKeyDown(e: KeyboardEvent) {
      if (field.type === "select") {
        const num = Number(e.key);
        if (Number.isInteger(num) && num >= 1 && num <= field.options.length) {
          e.preventDefault();
          void submitField(field.options[num - 1]);
          return;
        }
      }
      if (e.key === "ArrowLeft") goPrev();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [started, field, submitField, goPrev]);

  if (!started) {
    return (
      <SectionIntro
        emoji={intro.emoji}
        tagline={intro.tagline}
        body={intro.body}
        itemCount={total}
        buttonLabel="Let's begin"
        onBegin={() => setStarted(true)}
      />
    );
  }

  const answeredCount = fields.filter((f) => values[f.code] !== undefined).length;
  const progressPercent = (answeredCount / total) * 100;

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-6 py-8">
      <div>
        <div className="mb-2 flex items-center justify-between text-xs text-muted">
          <span>About You</span>
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
        <p className="text-lg font-medium text-foreground">
          {field.label}
          {!field.required && <span className="ml-2 text-sm font-normal text-muted">(optional)</span>}
        </p>

        {field.type === "text" ? (
          <div className="flex flex-col gap-3">
            <input
              autoFocus
              type="text"
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void submitField(nameDraft.trim());
              }}
              className="min-h-14 rounded-xl border border-border bg-surface px-4 text-foreground outline-none focus:border-accent"
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setNameDraft("");
                  void submitField("");
                }}
                className="flex-1 rounded-xl border border-border px-4 py-3 text-sm font-medium text-muted hover:bg-surface-raised"
              >
                Skip
              </button>
              <button
                type="button"
                onClick={() => void submitField(nameDraft.trim())}
                className="flex-1 rounded-xl bg-accent px-4 py-3 text-sm font-medium text-background"
              >
                Continue
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" role="radiogroup">
            {field.options.map((opt, idx) => {
              const selected = values[field.code] === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => void submitField(opt)}
                  className={`flex min-h-14 items-center gap-3 rounded-xl border px-4 py-3 text-left text-base transition-colors ${
                    selected
                      ? "border-accent bg-accent/10 text-foreground"
                      : "border-border bg-surface text-foreground hover:bg-surface-raised"
                  }`}
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border text-xs text-muted">
                    {idx + 1}
                  </span>
                  <span>{opt}</span>
                </button>
              );
            })}
          </div>
        )}
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
