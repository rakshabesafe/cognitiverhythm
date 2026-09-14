import type { ReactNode } from "react";

interface SectionIntroProps {
  emoji: string;
  tagline: string;
  body: string;
  itemCount: number;
  buttonLabel?: string;
  onBegin: () => void;
  children?: ReactNode;
}

export function SectionIntro({ emoji, tagline, body, itemCount, buttonLabel = "Let's go", onBegin, children }: SectionIntroProps) {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-5 px-6 py-16 text-center">
      <span className="text-5xl" aria-hidden>
        {emoji}
      </span>
      <h1 className="text-2xl font-semibold text-foreground">{tagline}</h1>
      <p className="text-muted">{body}</p>
      {children}
      <p className="text-xs uppercase tracking-wide text-muted">
        {itemCount} quick {itemCount === 1 ? "question" : "questions"}
      </p>
      <button
        type="button"
        onClick={onBegin}
        className="min-h-14 w-full rounded-xl bg-accent px-4 py-3 font-medium text-background"
      >
        {buttonLabel}
      </button>
    </main>
  );
}
