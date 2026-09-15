import type { GritFacetDescription } from "@/lib/survey/hooks";

const TIER_LABEL: Record<GritFacetDescription["tier"], string> = {
  "well-above": "Well above typical",
  above: "Above typical",
  typical: "Around typical",
  below: "Below typical",
  "well-below": "Room to grow",
};

/** Plain-language meaning + a graded, always-positive read, for every facet — not just the top one. */
export function FacetDescriptions({ facets }: { facets: GritFacetDescription[] }) {
  return (
    <div className="flex flex-col gap-3">
      {facets.map((f) => (
        <div key={f.id} className="rounded-2xl border border-border bg-surface p-4">
          <div className="mb-1 flex items-center justify-between gap-3">
            <h3 className="font-medium text-foreground">{f.label}</h3>
            <span className="whitespace-nowrap rounded-full border border-border px-2 py-0.5 text-xs text-muted">
              {TIER_LABEL[f.tier]}
            </span>
          </div>
          {f.tagline && <p className="mb-1 text-sm font-medium text-accent">{f.tagline}</p>}
          <p className="mb-2 text-xs text-muted">
            {f.tagline && <span className="font-medium">What it measures: </span>}
            {f.meaning}
          </p>
          <p className="text-sm text-foreground/90">{f.description}</p>
          {f.whyItMatters && (
            <p className="mt-2 border-t border-border pt-2 text-sm text-foreground/90">
              <span className="font-medium text-foreground">{f.whyItMattersLabel ?? "Why it matters in software"}: </span>
              {f.whyItMatters}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
