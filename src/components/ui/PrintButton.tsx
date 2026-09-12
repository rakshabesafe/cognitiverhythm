"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print min-h-12 rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-raised"
    >
      Save / print report
    </button>
  );
}
