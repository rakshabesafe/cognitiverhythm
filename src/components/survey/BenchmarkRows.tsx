import type { BenchmarkRow } from "@/lib/survey/scoring";

/** Per-construct score cards: your score, a bar, and how it sits against live peers. */
export function BenchmarkRows({ rows }: { rows: BenchmarkRow[] }) {
  return (
    <div className="flex flex-col gap-3">
      {rows.map((row) => (
        <div key={row.moduleId} className="rounded-2xl border border-border bg-surface p-4">
          <div className="mb-1 flex items-center justify-between gap-3">
            <h3 className="font-medium text-foreground">
              {row.emoji} {row.title}
            </h3>
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
          <p className="text-sm text-muted">
            {row.comparisonText}
            {row.peerAverage !== null && (
              <span>
                {" "}
                Peer average: {row.peerAverage.toFixed(2)} / {row.max.toFixed(1)} ({row.peerCount}{" "}
                {row.peerCount === 1 ? "peer" : "peers"}).
              </span>
            )}
          </p>
        </div>
      ))}
    </div>
  );
}
