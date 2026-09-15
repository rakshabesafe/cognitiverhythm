import type { RowInsight } from "@/lib/survey/hooks";

export interface InsightRowData {
  id: string;
  title: string;
  yourScore: number;
  max: number;
  peerAverage: number | null;
  peerCount: number;
  /** Optional fixed typical-score reference — a mean, a range, or both. */
  referenceMean?: number;
  referenceRange?: [number, number];
  /** Optional one-line "what this dimension actually measures" — shown before the score so the graded read below it has context. */
  meaning?: string;
}

interface InsightRowsProps {
  rows: InsightRowData[];
  insights: RowInsight[];
}

function formatReference(row: InsightRowData): string | null {
  if (typeof row.referenceMean === "number" && row.referenceRange) {
    return `Typical: ${row.referenceMean.toFixed(2)} / ${row.max.toFixed(1)} (range ${row.referenceRange[0].toFixed(2)}–${row.referenceRange[1].toFixed(2)}).`;
  }
  if (typeof row.referenceMean === "number") {
    return `Typical: ${row.referenceMean.toFixed(2)} / ${row.max.toFixed(1)}.`;
  }
  if (row.referenceRange) {
    return `Typical range: ${row.referenceRange[0].toFixed(2)}–${row.referenceRange[1].toFixed(2)} / ${row.max.toFixed(1)}.`;
  }
  return null;
}

/**
 * Per-construct cards: your score, a bar, a red/yellow/green insight (unlike the Energy
 * Allocation report, a "this needs attention" signal is appropriate here — these are
 * strain/confidence readings, not a performance evaluation), and the live peer baseline.
 * Shared by the Stress and Confidence reports.
 */
export function InsightRows({ rows, insights }: InsightRowsProps) {
  return (
    <div className="flex flex-col gap-3">
      {rows.map((row) => {
        const insight = insights.find((i) => i.id === row.id);
        const reference = formatReference(row);
        return (
          <div key={row.id} className="rounded-2xl border border-border bg-surface p-4">
            <div className="mb-1 flex items-center justify-between gap-3">
              <h3 className="font-medium text-foreground">{row.title}</h3>
              <span className="whitespace-nowrap text-sm text-foreground">
                {row.yourScore.toFixed(1)} / {row.max.toFixed(1)}
              </span>
            </div>
            {row.meaning && <p className="mb-2 text-xs text-muted">{row.meaning}</p>}
            <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${((row.yourScore - 1) / (row.max - 1)) * 100}%` }}
              />
            </div>
            {insight && (
              <p className="text-sm text-foreground/90">
                <span className="font-medium">
                  {insight.emoji} {insight.band}:
                </span>{" "}
                {insight.text}
              </p>
            )}
            <p className="mt-1 text-xs text-muted">
              {row.peerAverage !== null
                ? `Peer baseline: ${row.peerAverage.toFixed(2)} / ${row.max.toFixed(1)} (${row.peerCount} ${row.peerCount === 1 ? "peer" : "peers"}).`
                : "You're among the first participants in this study, so there's no peer baseline yet."}
            </p>
            {reference && <p className="mt-0.5 text-xs text-muted">{reference}</p>}
          </div>
        );
      })}
    </div>
  );
}
