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
          <p className="mb-2 text-xs text-muted">{f.meaning}</p>
          <p className="text-sm text-foreground/90">{f.description}</p>
        </div>
      ))}
    </div>
  );
}
