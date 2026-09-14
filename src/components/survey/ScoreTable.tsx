export interface ScoreTableRow {
  id: string;
  label: string;
  yourScore: number;
  max: number;
  /** Optional fixed reference point, shown as an unattributed "typical score". */
  referenceMean?: number;
  /** Optional fixed reference band around that mean. */
  referenceRange?: [number, number];
}

interface ScoreTableProps {
  title: string;
  rows: ScoreTableRow[];
  footnote?: string;
}

/** Your score vs. an optional typical-score mean and range. */
export function ScoreTable({ title, rows, footnote }: ScoreTableProps) {
  const hasReference = rows.some((r) => typeof r.referenceMean === "number" || Array.isArray(r.referenceRange));

  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted">{title}</p>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-muted">
              <th className="py-2 pr-2 font-normal">Dimension</th>
              <th className="py-2 pr-2 text-right font-normal">Your score</th>
              {hasReference && <th className="py-2 text-right font-normal">Typical score</th>}
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
                  <td className="py-2 text-right text-muted">
                    {typeof row.referenceMean === "number" ? (
                      <>
                        {row.referenceMean.toFixed(2)} / {row.max}
                        {row.referenceRange && (
                          <span className="block text-[11px] text-muted/80">
                            range {row.referenceRange[0].toFixed(2)}–{row.referenceRange[1].toFixed(2)}
                          </span>
                        )}
                      </>
                    ) : row.referenceRange ? (
                      `${row.referenceRange[0].toFixed(2)}–${row.referenceRange[1].toFixed(2)} / ${row.max}`
                    ) : (
                      "—"
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {footnote && <p className="mt-3 text-xs text-muted">{footnote}</p>}
    </div>
  );
}
