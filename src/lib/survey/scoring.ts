import { GRIT_FACETS, isDemographicsComplete, LIKERT_MODULES, SCALES, type LikertModule } from "./schema";

export type Band = "Low" | "Moderate" | "High";
export type Direction = "positive" | "negative";

/**
 * The single "what should this participant do next" rule, used after every save so the
 * flow can chain straight into the next section instead of dropping them on a module grid.
 */
export function getNextRoute(responses: {
  demographics: Record<string, string>;
  completedModules: string[];
}): string {
  if (!isDemographicsComplete(responses.demographics)) return "/survey/demographics";
  const next = LIKERT_MODULES.find((m) => !responses.completedModules.includes(m.id));
  return next ? `/survey/${next.id}` : "/results";
}

// Whether a *higher* raw score is a good thing for this construct. Technostress and
// AI anxiety are the two constructs in this instrument where high == strain, not strength.
const DIRECTIONS: Record<string, Direction> = {
  "task-performance": "positive",
  "contextual-performance": "positive",
  grit: "positive",
  technostress: "negative",
  "ai-anxiety": "negative",
  "self-efficacy": "positive",
};

export const HIGH = 2 / 3;
export const LOW = 1 / 3;

function moduleMean(mod: LikertModule, answers: Record<string, number>): number | null {
  const values = mod.items.map((i) => answers[i.code]).filter((v): v is number => typeof v === "number");
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function toPct(mean: number, max: number): number {
  return max > 1 ? (mean - 1) / (max - 1) : 0;
}

function bandFor(pct: number): Band {
  return pct < LOW ? "Low" : pct < HIGH ? "Moderate" : "High";
}

function pctForModule(moduleId: string, answers: Record<string, number>): number {
  const mod = LIKERT_MODULES.find((m) => m.id === moduleId);
  if (!mod) return 0;
  const mean = moduleMean(mod, answers);
  return mean === null ? 0 : toPct(mean, SCALES[mod.scale].labels.length);
}

// --- Peer benchmark -------------------------------------------------------

export interface PeerStat {
  average: number | null;
  count: number;
}

/** peerAnswerSets: the raw `answers` map of every other participant who has completed the assessment. */
export function computePeerAverages(peerAnswerSets: Record<string, number>[]): Record<string, PeerStat> {
  const result: Record<string, PeerStat> = {};
  for (const mod of LIKERT_MODULES) {
    const means = peerAnswerSets
      .map((answers) => moduleMean(mod, answers))
      .filter((m): m is number => m !== null);
    result[mod.id] = {
      average: means.length > 0 ? means.reduce((a, b) => a + b, 0) / means.length : null,
      count: means.length,
    };
  }
  return result;
}

/**
 * Peer means for a single module, computed across whatever response records are passed
 * in (doesn't require full-survey completion — just that module's items). Used for the
 * mid-flow "hook" screens, which fire before most peers have finished the whole thing.
 */
export function computeModulePeerMeans(
  moduleId: string,
  peerResponses: { answers: Record<string, number> }[]
): number[] {
  const mod = LIKERT_MODULES.find((m) => m.id === moduleId);
  if (!mod) return [];
  return peerResponses.map((r) => moduleMean(mod, r.answers)).filter((m): m is number => m !== null);
}

export function computeModulePeerStat(
  moduleId: string,
  peerResponses: { answers: Record<string, number> }[]
): PeerStat {
  const means = computeModulePeerMeans(moduleId, peerResponses);
  return {
    average: means.length > 0 ? means.reduce((a, b) => a + b, 0) / means.length : null,
    count: means.length,
  };
}

/** Percentile rank (0-100) of `mine` among peerMeans, or null if there's too little peer data to be meaningful. */
export function percentileRank(mine: number, peerMeans: number[]): number | null {
  if (peerMeans.length < 3) return null;
  const below = peerMeans.filter((m) => m < mine).length;
  return Math.round((below / peerMeans.length) * 100);
}

export function computeModuleMeanForAnswers(moduleId: string, answers: Record<string, number>): number | null {
  const mod = LIKERT_MODULES.find((m) => m.id === moduleId);
  return mod ? moduleMean(mod, answers) : null;
}

export interface BandwidthSplit {
  executionPct: number;
  collaborationPct: number;
}

/** Task vs. Contextual Performance as a comparative split — the "thread allocation" framing. */
export function computeBandwidthSplit(taskScore: number, contextualScore: number): BandwidthSplit {
  const total = taskScore + contextualScore;
  if (total <= 0) return { executionPct: 50, collaborationPct: 50 };
  const executionPct = Math.round((taskScore / total) * 100);
  return { executionPct, collaborationPct: 100 - executionPct };
}

export type CollaborationBalanceBand = "altruism-tax" | "leaning-collaborative" | "balanced" | "leaning-execution" | "siloed-focus";

export interface CollaborationBalanceReading {
  ratio: number;
  band: CollaborationBalanceBand;
}

// Thresholds per the "Organizational Citizenship Ratio" (Contextual / Task) — grounded in
// Motowidlo & Schmit (1999) and Sonnentag & Frese (2002), which treat contextual behaviors
// as the lubricant for the technical core rather than an unrelated second axis. Balanced
// engineers sit at 0.95-1.05 (this study's own peer mean: Task ≈ 4.00, Contextual ≈ 4.09,
// ratio ≈ 1.02). >1.15 is the "Altruism Tax" band, <0.85 the "Siloed Focus" band; the two
// gaps in between (0.85-0.95, 1.05-1.15) aren't named in the source research, so they get a
// softer "leaning" label rather than being forced into one of the two named extremes.
export function computeCollaborationBalance(taskScore: number, contextualScore: number): CollaborationBalanceReading {
  if (taskScore <= 0) return { ratio: 0, band: "balanced" };
  const ratio = Math.round((contextualScore / taskScore) * 100) / 100;
  let band: CollaborationBalanceBand;
  if (ratio > 1.15) band = "altruism-tax";
  else if (ratio > 1.05) band = "leaning-collaborative";
  else if (ratio >= 0.95) band = "balanced";
  else if (ratio >= 0.85) band = "leaning-execution";
  else band = "siloed-focus";
  return { ratio, band };
}

export interface CognitiveCurrencyReading {
  /** TP4 alone — "I keep my knowledge about my job up-to-date." */
  currency: number;
  /** Mean of TP1/TP2/TP3/TP5 — on-time delivery, accuracy, independent troubleshooting. */
  executionProficiency: number;
}

/**
 * Splits Task Performance's own items into Execution Proficiency and Cognitive Currency —
 * a distinction a single whole-module average quietly hides. Someone can hit every delivery
 * milestone on time while letting continuous learning stall under load, or the reverse.
 */
export function computeCognitiveCurrency(answers: Record<string, number>): CognitiveCurrencyReading {
  const currency = answers["TP4"] ?? 0;
  const executionItems = ["TP1", "TP2", "TP3", "TP5"];
  const values = executionItems.map((c) => answers[c]).filter((v): v is number => typeof v === "number");
  const executionProficiency = values.length > 0 ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100 : 0;
  return { currency, executionProficiency };
}

function facetMean(items: string[], answers: Record<string, number>): number | null {
  const values = items.map((code) => answers[code]).filter((v): v is number => typeof v === "number");
  return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null;
}

/** Inclusive [low, high] typical-score band. */
export type ScoreRange = [number, number];

// Reference norms for the MDGS facets, kept as an internal constant (not attributed to
// any source in the UI). Gives participants a stable comparison point before this study
// has accumulated enough of its own live peer data.
const GRIT_FACET_REFERENCE_RANGE: Record<string, ScoreRange> = {
  adaptability: [3.53, 3.96],
  perseveranceOfEffort: [3.53, 3.88],
  spiritedInitiative: [3.54, 3.8],
  steadfastness: [3.6, 3.85],
};
export const GRIT_OVERALL_REFERENCE_RANGE: ScoreRange = [3.72, 4.11];

// Item-mean reference point within each facet's range — a single figure alongside the
// range so participants can see both where the typical band sits and exactly where the
// average respondent lands inside it.
const GRIT_FACET_REFERENCE_MEAN: Record<string, number> = {
  adaptability: 3.81,
  perseveranceOfEffort: 3.74,
  spiritedInitiative: 3.69,
  steadfastness: 3.75,
};
export const GRIT_OVERALL_REFERENCE_MEAN =
  Object.values(GRIT_FACET_REFERENCE_MEAN).reduce((a, b) => a + b, 0) / Object.values(GRIT_FACET_REFERENCE_MEAN).length;

/**
 * A 5-step read of a score against a comparison point (a reference/typical range, or a
 * live peer average) — used to pick which of several hand-written, always-positive
 * interpretations to show for a given dimension. Never maps to language implying a score
 * is bad; only to how much headroom is being highlighted.
 */
export type ScoreTier = "well-below" | "below" | "typical" | "above" | "well-above";

/** Grades a score against a fixed comparison point (used outside Grit, which has real ranges). */
export function tierFor(yourScore: number, comparisonPoint: number): ScoreTier {
  const diff = yourScore - comparisonPoint;
  if (diff <= -0.75) return "well-below";
  if (diff <= -0.25) return "below";
  if (diff < 0.25) return "typical";
  if (diff < 0.75) return "above";
  return "well-above";
}

/**
 * Grades a score against a typical *range* rather than a single point: anywhere inside
 * [low, high] is "typical" outright, and only distance past whichever bound it's beyond
 * decides "below"/"well-below" or "above"/"well-above".
 */
export function tierForRange(yourScore: number, [low, high]: ScoreRange): ScoreTier {
  if (yourScore < low) return low - yourScore >= 0.5 ? "well-below" : "below";
  if (yourScore > high) return yourScore - high >= 0.5 ? "well-above" : "above";
  return "typical";
}

export interface GritFacetScore {
  id: string;
  label: string;
  yourScore: number;
  referenceRange: ScoreRange;
  referenceMean: number;
}

/**
 * Full MDGS facet breakdown for the participant, sorted by the participant's own score
 * (highest first). referenceRange/referenceMean are a stable typical-score band and item
 * mean sourced from the validated MDGS norms for this instrument — no peer/cohort data
 * involved.
 */
export function computeGritFacetBreakdown(answers: Record<string, number>): GritFacetScore[] {
  return GRIT_FACETS.map((facet) => {
    const yourScore = facetMean(facet.items, answers) ?? 0;
    return {
      id: facet.id,
      label: facet.label,
      yourScore: Math.round(yourScore * 100) / 100,
      referenceRange: GRIT_FACET_REFERENCE_RANGE[facet.id] ?? GRIT_OVERALL_REFERENCE_RANGE,
      referenceMean: GRIT_FACET_REFERENCE_MEAN[facet.id] ?? GRIT_OVERALL_REFERENCE_MEAN,
    };
  }).sort((a, b) => b.yourScore - a.yourScore);
}

/** A typical-score reference point for a section: a mean, a range, or both — whichever is configured. */
export interface SectionReference {
  mean?: number;
  range?: ScoreRange;
}

// Reference norms for the Technostress sub-dimensions, kept as internal constants (not
// attributed to any source in the UI) — same treatment as the Grit facet reference figures.
// Configurable: edit these entries to update the "Typical" figures shown in the Stress
// report. Only mean, only range, or both is fine — the UI renders whatever's present.
const SECTION_REFERENCE: Record<string, SectionReference> = {
  Overload: { mean: 3.0 },
  Complexity: { range: [2.5, 3.0] },
  Uncertainty: { range: [2.71, 3.06] },
};

export interface SectionScore {
  id: string;
  label: string;
  yourScore: number;
  peerAverage: number | null;
  peerCount: number;
  max: number;
  reference?: SectionReference;
}

/**
 * Breaks a module down by its items' `section` groupings (e.g. Technostress splits into
 * Overload / Complexity / Uncertainty), scored against live in-study peers and sorted by
 * the participant's own score, highest first. Same ≥3-peer rule as everywhere else: no
 * peer figure is shown until enough real peers have answered that group. `reference` is a
 * fixed typical-score figure (see SECTION_REFERENCE above) — present only for sections that
 * have one configured, currently just Technostress's three.
 */
export function computeSectionBreakdown(
  moduleId: string,
  answers: Record<string, number>,
  peerResponses: { answers: Record<string, number> }[]
): SectionScore[] {
  const mod = LIKERT_MODULES.find((m) => m.id === moduleId);
  if (!mod) return [];
  const max = SCALES[mod.scale].labels.length;

  const sections: string[] = [];
  for (const item of mod.items) {
    if (item.section && !sections.includes(item.section)) sections.push(item.section);
  }

  return sections
    .map((section) => {
      const codes = mod.items.filter((i) => i.section === section).map((i) => i.code);
      const yourScore = facetMean(codes, answers) ?? 0;
      const peerMeans = peerResponses
        .map((r) => facetMean(codes, r.answers))
        .filter((m): m is number => m !== null);
      const peerAverage =
        peerMeans.length >= 3 ? peerMeans.reduce((a, b) => a + b, 0) / peerMeans.length : null;
      return {
        id: section,
        label: section,
        yourScore: Math.round(yourScore * 100) / 100,
        peerAverage: peerAverage !== null ? Math.round(peerAverage * 100) / 100 : null,
        peerCount: peerMeans.length,
        max,
        reference: SECTION_REFERENCE[section],
      };
    })
    .sort((a, b) => b.yourScore - a.yourScore);
}

// Task Performance / Contextual Performance typical-range norms are published on the
// IWPQ's native 0-4 point scale, but this app stores every "agree5" answer as 1-5
// internally (see LikertScale.tsx: option value = index + 1) — same 5 points, just shifted
// by one. Configured here exactly as published (0-4) so the source figures stay directly
// editable/auditable, then shifted by +1 wherever they're read against a participant's
// stored 1-5 score.
const PERFORMANCE_REFERENCE_RANGE_0_4: Record<string, ScoreRange> = {
  "task-performance": [3.1, 3.27],
  "contextual-performance": [2.53, 3.08],
};

function internalScaleRange(moduleId: string): ScoreRange | undefined {
  const raw = PERFORMANCE_REFERENCE_RANGE_0_4[moduleId];
  return raw ? [raw[0] + 1, raw[1] + 1] : undefined;
}

export interface BenchmarkRow {
  moduleId: string;
  title: string;
  yourScore: number;
  max: number;
  peerAverage: number | null;
  peerCount: number;
  band: Band;
  emoji: "🟢" | "🟡" | "🔴";
  comparisonText: string;
  /** Fixed typical-score range, already shifted to this app's internal scale — configured only for Task/Contextual Performance. */
  referenceRange?: ScoreRange;
}

function buildBenchmarkRow(mod: LikertModule, myAnswers: Record<string, number>, peer: PeerStat): BenchmarkRow {
  const mean = moduleMean(mod, myAnswers) ?? 0;
  const max = SCALES[mod.scale].labels.length;
  const pct = toPct(mean, max);
  const band = bandFor(pct);
  const direction = DIRECTIONS[mod.id];
  const good = (direction === "positive" && band === "High") || (direction === "negative" && band === "Low");
  const bad = (direction === "positive" && band === "Low") || (direction === "negative" && band === "High");
  const emoji: BenchmarkRow["emoji"] = good ? "🟢" : bad ? "🔴" : "🟡";

  let comparisonText: string;
  if (peer.average === null) {
    comparisonText = "You're among the first to complete this — no peer comparison yet.";
  } else {
    const diff = mean - peer.average;
    const meaningful = Math.abs(diff) > max * 0.08;
    if (!meaningful) {
      comparisonText = "In line with your peers.";
    } else if (diff > 0) {
      comparisonText = direction === "positive" ? "Higher than your peers." : "Higher than your peers — worth watching.";
    } else {
      comparisonText = direction === "positive" ? "Lower than your peers." : "Lower than your peers.";
    }
  }

  return {
    moduleId: mod.id,
    title: mod.title,
    yourScore: Math.round(mean * 100) / 100,
    max,
    peerAverage: peer.average != null ? Math.round(peer.average * 100) / 100 : null,
    peerCount: peer.count,
    band,
    emoji,
    comparisonText,
    referenceRange: internalScaleRange(mod.id),
  };
}

export function computeBenchmark(
  myAnswers: Record<string, number>,
  peerAverages: Record<string, PeerStat>
): BenchmarkRow[] {
  return LIKERT_MODULES.map((mod) => buildBenchmarkRow(mod, myAnswers, peerAverages[mod.id] ?? { average: null, count: 0 }));
}

/**
 * Benchmark rows for just the given modules, computed against live in-study peers who've
 * reached each module (not just fully-completed participants) — used by the tier report
 * pages, which a participant can unlock well before finishing the whole assessment.
 */
export function computeBenchmarkForModules(
  moduleIds: string[],
  myAnswers: Record<string, number>,
  peerResponses: { answers: Record<string, number> }[]
): BenchmarkRow[] {
  return LIKERT_MODULES.filter((m) => moduleIds.includes(m.id)).map((mod) =>
    buildBenchmarkRow(mod, myAnswers, computeModulePeerStat(mod.id, peerResponses))
  );
}

/** Band for a single module's score, used by the narrative hooks in hooks.ts. */
export function bandForModule(moduleId: string, answers: Record<string, number>): Band {
  return bandFor(pctForModule(moduleId, answers));
}

/**
 * Band for an arbitrary raw score against its own scale's max — e.g. one Technostress
 * sub-section (Overload/Complexity/Uncertainty), which isn't a module on its own. Always
 * reads the score against its own scale's actual range, so a 5-point and a 7-point
 * construct (Technostress vs. AI Job Anxiety) are never compared using the same raw
 * number — a 7-point "3" and a 5-point "3" are not equivalently "high."
 */
export function bandForScore(score: number, max: number): Band {
  return bandFor(toPct(score, max));
}
