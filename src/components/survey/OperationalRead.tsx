import type { OperationalReading } from "@/lib/survey/hooks";

export const OPERATIONAL_BAND_LABEL: Record<OperationalReading["band"], string> = {
  "very-high": "Very high",
  high: "High",
  medium: "Medium",
  low: "Low",
  "very-low": "Very low",
};

/** The named operational state, band chip, interpretation, and calibration tip for a role-calibrated read. Unwrapped — callers supply their own card/divider. */
export function OperationalRead({ reading }: { reading: OperationalReading }) {
  return (
    <>
      <div className="mb-1 flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-foreground">{reading.title}</p>
        <span className="whitespace-nowrap rounded-full border border-accent/40 px-2 py-0.5 text-xs text-accent">
          {OPERATIONAL_BAND_LABEL[reading.band]}
        </span>
      </div>
      <p className="text-sm text-foreground/90">{reading.interpretation}</p>
      <p className="mt-1.5 text-sm text-foreground/90">
        <span className="font-medium text-foreground">Calibration tip: </span>
        {reading.calibrationTip}
      </p>
    </>
  );
}
