import { GRIT_OVERALL_REFERENCE, type GritFacetScore } from "@/lib/survey/scoring";

/** Renders the four MDGS facets: your score, a typical-score reference, and your live in-study peer average. */
export function GritFacetTable({ facets }: { facets: GritFacetScore[] }) {
  const hasAnyPeerData = facets.some((f) => f.peerAverage !== null);
  const overallYourScore = facets.reduce((sum, f) => sum + f.yourScore, 0) / facets.length;

  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted">Your MDGS profile</p>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-muted">
              <th className="py-2 pr-2 font-normal">Facet</th>
              <th className="py-2 pr-2 text-right font-normal">Your score</th>
              <th className="py-2 pr-2 text-right font-normal">Typical score</th>
              <th className="py-2 text-right font-normal">Peer average</th>
            </tr>
          </thead>
          <tbody>
            {facets.map((f) => (
              <tr key={f.id} className="border-b border-border/50 last:border-0">
                <td className="py-2 pr-2 text-foreground">{f.label}</td>
                <td className="py-2 pr-2 text-right font-medium text-accent">{f.yourScore.toFixed(2)} / 5</td>
                <td className="py-2 pr-2 text-right text-muted">{f.referenceAverage.toFixed(2)} / 5</td>
                <td className="py-2 text-right text-muted">
                  {f.peerAverage !== null ? `${f.peerAverage.toFixed(2)} / 5` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted">
        Your overall grit score is {overallYourScore.toFixed(2)} / 5 — the typical score is{" "}
        {GRIT_OVERALL_REFERENCE.toFixed(2)} / 5.
      </p>
      {!hasAnyPeerData && (
        <p className="mt-1 text-[11px] leading-relaxed text-muted">
          You&rsquo;re among the first participants in this study, so there&rsquo;s no live peer average yet — check
          back later as more IT professionals complete this section.
        </p>
      )}
    </div>
  );
}
