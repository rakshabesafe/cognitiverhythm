export interface ScoreTableRow {
  id: string;
  label: string;
  yourScore: number;
  peerAverage: number | null;
  max: number;
  /** Optional fixed reference figure, shown as an unattributed "typical score". */
  referenceAverage?: number;
}

interface ScoreTableProps {
  title: string;
  rows: ScoreTableRow[];
  footnote?: string;
}

/** Your score vs. an optional typical-score reference vs. the live in-study peer average. */
export function ScoreTable({ title, rows, footnote }: ScoreTableProps) {
  const hasAnyPeerData = rows.some((r) => r.peerAverage !== null);
  const hasReference = rows.some((r) => typeof r.referenceAverage === "number");

  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted">{title}</p>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-muted">
              <th className="py-2 pr-2 font-normal">Dimension</th>
              <th className="py-2 pr-2 text-right font-normal">Your score</th>
              {hasReference && <th className="py-2 pr-2 text-right font-normal">Typical score</th>}
              <th className="py-2 text-right font-normal">Peer average</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-border/50 last:border-0">
                <td className="py-2 pr-2 text-foreground">{row.label}</td>
                <td className="py-2 pr-2 text-right font-medium text-accent">
                  {row.yourScore.toFixed(2)} / {row.max}
                </td>
                {hasReference && (
                  <td className="py-2 pr-2 text-right text-muted">
                    {typeof row.referenceAverage === "number" ? `${row.referenceAverage.toFixed(2)} / ${row.max}` : "—"}
                  </td>
                )}
                <td className="py-2 text-right text-muted">
                  {row.peerAverage !== null ? `${row.peerAverage.toFixed(2)} / ${row.max}` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {footnote && <p className="mt-3 text-xs text-muted">{footnote}</p>}
      {!hasAnyPeerData && (
        <p className="mt-1 text-[11px] leading-relaxed text-muted">
          You&rsquo;re among the first participants in this study, so there&rsquo;s no live peer average yet — check
          back later as more IT professionals complete this section.
        </p>
      )}
    </div>
  );
}
