// Visualizes the dual-process resource model this study is built on: Grit builds
// Occupational Self-Efficacy through mastery experiences, while Technostress and AI
// Anxiety drain it — and that net balance is what drives Task and Contextual Performance
// (Job Demands-Resources theory; Conservation of Resources theory). All values below are
// the participant's own scores, not a formula derived from them — self-efficacy is
// independently measured, not calculated from the other two sides.
export interface FlowFactor {
  id: string;
  label: string;
  emoji: string;
  score: number;
  max: number;
}

function pct(score: number, max: number): number {
  return max > 1 ? Math.min(1, Math.max(0, (score - 1) / (max - 1))) : 0;
}

function avgPct(factors: FlowFactor[]): number {
  if (factors.length === 0) return 0;
  return factors.reduce((sum, f) => sum + pct(f.score, f.max), 0) / factors.length;
}

function FactorBar({ factor, tone }: { factor: FlowFactor; tone: "build" | "drain" | "neutral" }) {
  const barColor = tone === "build" ? "bg-success" : tone === "drain" ? "bg-danger" : "bg-accent";
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2 text-sm">
        <span className="text-foreground">
          <span className="mr-1">{factor.emoji}</span>
          {factor.label}
        </span>
        <span className="whitespace-nowrap text-xs text-muted">
          {factor.score.toFixed(1)} / {factor.max.toFixed(0)}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct(factor.score, factor.max) * 100}%` }} />
      </div>
    </div>
  );
}

function EfficacyGauge({ score, max }: { score: number; max: number }) {
  const p = pct(score, max);
  const r = 40;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative flex h-28 w-28 shrink-0 items-center justify-center">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--border)" strokeWidth="9" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - p)}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-xl font-semibold text-foreground">{score.toFixed(1)}</span>
        <span className="text-[10px] leading-tight text-muted">/ {max.toFixed(0)} efficacy</span>
      </div>
    </div>
  );
}

function FlowConnector({ tone, label, desktopArrow }: { tone: "build" | "drain"; label: string; desktopArrow: string }) {
  const color = tone === "build" ? "text-success" : "text-danger";
  return (
    <div className={`flex shrink-0 flex-row items-center justify-center gap-1.5 text-xs font-medium md:flex-col md:gap-0.5 ${color}`}>
      <span aria-hidden className="hidden text-lg leading-none md:inline">
        {desktopArrow}
      </span>
      <span aria-hidden className="text-lg leading-none md:hidden">
        ↓
      </span>
      <span className="whitespace-nowrap">{label}</span>
    </div>
  );
}

export interface ResourceLoopDiagramProps {
  building: FlowFactor[];
  draining: FlowFactor[];
  selfEfficacy: { score: number; max: number };
  outcomes: { task: FlowFactor; contextual: FlowFactor };
}

export function ResourceLoopDiagram({ building, draining, selfEfficacy, outcomes }: ResourceLoopDiagramProps) {
  const buildPct = Math.round(avgPct(building) * 100);
  const drainPct = Math.round(avgPct(draining) * 100);
  const netText =
    buildPct >= drainPct
      ? "Right now, your Grit-driven resource-building is outpacing the drain from technostress and AI anxiety — a strong position to protect and build on."
      : "Right now, technostress and AI anxiety are pulling harder than your resource-building — a clear, specific target, and one where small wins tend to compound quickly.";

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-4 sm:p-5">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted">Your Resource Loop</p>
        <p className="mt-1 text-sm text-foreground/90">
          Two forces act on your Occupational Self-Efficacy at once — Grit builds it through mastery experiences, while
          Technostress and AI Anxiety drain it through overload and uncertainty. Here&apos;s how those forces show up in
          your own numbers.
        </p>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-3">
        <div className="flex-1 rounded-xl border border-success/30 bg-success/5 p-3">
          <div className="mb-2.5 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-success">🌱 Building</p>
            <p className="text-xs font-semibold text-success">{buildPct}%</p>
          </div>
          <div className="flex flex-col gap-2.5">
            {building.map((f) => (
              <FactorBar key={f.id} factor={f} tone="build" />
            ))}
          </div>
        </div>

        <FlowConnector tone="build" label="builds" desktopArrow="➜" />

        <EfficacyGauge score={selfEfficacy.score} max={selfEfficacy.max} />

        <FlowConnector tone="drain" label="drained by" desktopArrow="⬅" />

        <div className="flex-1 rounded-xl border border-danger/30 bg-danger/5 p-3">
          <div className="mb-2.5 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-danger">🔥 Draining</p>
            <p className="text-xs font-semibold text-danger">{drainPct}%</p>
          </div>
          <div className="flex flex-col gap-2.5">
            {draining.map((f) => (
              <FactorBar key={f.id} factor={f} tone="drain" />
            ))}
          </div>
        </div>
      </div>

      <p className="text-sm text-foreground/90">{netText}</p>

      <div>
        <p className="mb-2 text-center text-xs text-muted">↓ that balance drives your performance ↓</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FactorBar factor={outcomes.task} tone="neutral" />
          <FactorBar factor={outcomes.contextual} tone="neutral" />
        </div>
      </div>
    </div>
  );
}
