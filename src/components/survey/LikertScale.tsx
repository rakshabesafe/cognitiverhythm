"use client";

interface LikertScaleProps {
  labels: string[];
  value?: number;
  onSelect: (value: number) => void;
}

export function LikertScale({ labels, value, onSelect }: LikertScaleProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" role="radiogroup">
      {labels.map((label, idx) => {
        const v = idx + 1;
        const selected = value === v;
        return (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={selected}
            data-option-value={v}
            onClick={() => onSelect(v)}
            className={`flex min-h-14 items-center gap-3 rounded-xl border px-4 py-3 text-left text-base transition-colors active:scale-[0.99] ${
              selected
                ? "border-accent bg-accent/10 text-foreground"
                : "border-border bg-surface text-foreground hover:bg-surface-raised"
            }`}
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border text-xs text-muted">
              {v}
            </span>
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
