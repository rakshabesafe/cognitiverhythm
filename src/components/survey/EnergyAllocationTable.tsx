import type { EnergyAllocationRowInsight } from "@/lib/survey/hooks";
import type { BenchmarkRow } from "@/lib/survey/scoring";

interface EnergyAllocationTableProps {
  rows: BenchmarkRow[];
  insights: EnergyAllocationRowInsight[];
}

/**
 * Per-vector energy cards, styled after BenchmarkRows but deliberately avoiding the app's
 * usual 🟢🟡🔴 good/bad coloring — Task and Contextual Performance are framed as where
 * cognitive energy is currently allocated, not scores to be judged, so every row uses the
 * same neutral accent color regardless of level. A card layout (not a wide table) keeps
 * the full insight sentence readable at mobile widths.
 */
export function EnergyAllocationTable({ rows, insights }: EnergyAllocationTableProps) {
  return (
    <div className="flex flex-col gap-3">
      {rows.map((row) => {
        const insight = insights.find((i) => i.moduleId === row.moduleId);
        return (
          <div key={row.moduleId} className="rounded-2xl border border-border bg-surface p-4">
            <div className="mb-1 flex items-center justify-between gap-3">
              <h3 className="font-medium text-foreground">{row.title}</h3>
              <span className="whitespace-nowrap text-sm text-foreground">
                {row.yourScore.toFixed(1)} / {row.max.toFixed(1)}
              </span>
            </div>
            <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${((row.yourScore - 1) / (row.max - 1)) * 100}%` }}
              />
            </div>
            {insight && (
              <p className="text-sm text-foreground/90">
                <span className="font-medium text-accent">● {insight.label}:</span> {insight.text}
              </p>
            )}
            <p className="mt-1 text-xs text-muted">
              {row.peerAverage !== null
                ? `Peer baseline: ${row.peerAverage.toFixed(2)} / ${row.max.toFixed(1)} (${row.peerCount} ${row.peerCount === 1 ? "peer" : "peers"}).`
                : "You're among the first participants in this study, so there's no peer baseline yet."}
            </p>
          </div>
        );
      })}
    </div>
  );
}
