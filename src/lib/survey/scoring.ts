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

function facetMean(items: string[], answers: Record<string, number>): number | null {
  const values = items.map((code) => answers[code]).filter((v): v is number => typeof v === "number");
  return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null;
}

// Reference norms for the MDGS facets, kept as an internal constant (not attributed to
// any source in the UI). Gives participants a stable comparison point before this study
// has accumulated enough of its own live peer data.
const GRIT_FACET_REFERENCE: Record<string, number> = {
  adaptability: 3.98,
  spiritedInitiative: 3.96,
  steadfastness: 3.94,
  perseveranceOfEffort: 3.94,
};
export const GRIT_OVERALL_REFERENCE = 3.93;

export interface GritFacetScore {
  id: string;
  label: string;
  yourScore: number;
  peerAverage: number | null;
  peerCount: number;
  referenceAverage: number;
}

/**
 * Full MDGS facet breakdown for the participant vs. their live in-study peers, sorted by
 * the participant's own score (highest first). peerAverage stays null until at least 3
 * peers have answered that facet's items. referenceAverage is always present — a stable
 * comparison point independent of how many live peers have completed the study so far.
 */
export function computeGritFacetBreakdown(
  answers: Record<string, number>,
  peerResponses: { answers: Record<string, number> }[]
): GritFacetScore[] {
  return GRIT_FACETS.map((facet) => {
    const yourScore = facetMean(facet.items, answers) ?? 0;
    const peerMeans = peerResponses
      .map((r) => facetMean(facet.items, r.answers))
      .filter((m): m is number => m !== null);
    const peerAverage =
      peerMeans.length >= 3 ? peerMeans.reduce((a, b) => a + b, 0) / peerMeans.length : null;
    return {
      id: facet.id,
      label: facet.label,
      yourScore: Math.round(yourScore * 100) / 100,
      peerAverage: peerAverage !== null ? Math.round(peerAverage * 100) / 100 : null,
      peerCount: peerMeans.length,
      referenceAverage: GRIT_FACET_REFERENCE[facet.id] ?? GRIT_OVERALL_REFERENCE,
    };
  }).sort((a, b) => b.yourScore - a.yourScore);
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

// --- Confidence (Self-Efficacy) narrative -----------------------------------

export interface ConfidenceNarrative {
  band: Band;
  heading: string;
  body: string;
}

export function confidenceNarrative(answers: Record<string, number>): ConfidenceNarrative {
  const pct = pctForModule("self-efficacy", answers);
  const band = bandFor(pct);

  if (band === "High") {
    return {
      band,
      heading: "You trust your own hands on the wheel.",
      body: "Your answers show strong occupational self-efficacy — you consistently believe you can find a way through whatever your job throws at you, and that belief tends to be self-fulfilling: it's what lets grit and adaptability actually convert into sustained performance instead of burnout.",
    };
  }
  if (band === "Moderate") {
    return {
      band,
      heading: "Your confidence holds up — most of the time.",
      body: "You generally trust your ability to handle what comes your way, though it isn't unshakeable yet. That's a normal, workable place to be — confidence like this tends to grow fastest from small, concrete wins rather than from reassurance alone.",
    };
  }
  return {
    band,
    heading: "Your skills may be ahead of your confidence in them.",
    body: "Your answers suggest you're less sure of your ability to handle job demands than your effort and adaptability elsewhere would predict. That gap is worth naming — low self-efficacy can quietly cap how much of your real capability actually shows up at work, independent of how capable you actually are.",
  };
}

// --- Operating profile / archetype -----------------------------------------

export interface Archetype {
  id: string;
  name: string;
  diagnosis: string;
  actions: string[];
}

export function computeArchetype(answers: Record<string, number>): Archetype {
  const technostress = pctForModule("technostress", answers);
  const grit = pctForModule("grit", answers);
  const selfEfficacy = pctForModule("self-efficacy", answers);
  const aiAnxiety = pctForModule("ai-anxiety", answers);
  const contextualPerformance = pctForModule("contextual-performance", answers);
  const resources = (grit + selfEfficacy) / 2;

  if (aiAnxiety >= HIGH && selfEfficacy < LOW) {
    return {
      id: "obsolescence-trap",
      name: "The Obsolescence Trap",
      diagnosis:
        "The pace of technological change is currently outpacing your sense of mastery over it. That combination — real anxiety about AI plus low confidence in your ability to keep up — can create a loss spiral, where the anxiety itself makes it harder to build the skills that would resolve it.",
      actions: [
        "Stop trying to learn everything at once. Pick one specific, manageable AI tool — a code-completion agent, say — and get genuinely fluent in it this week.",
        "Small, immediate mastery experiences rebuild self-efficacy faster than broad exposure. Track one concrete thing you've gotten good at each week.",
        "Borrow confidence deliberately — find a colleague a step ahead with the same tool and ask them to show you their workflow.",
      ],
    };
  }

  if (technostress >= HIGH && contextualPerformance < LOW) {
    return {
      id: "isolated-engineer",
      name: "The Isolated Engineer",
      diagnosis:
        "The structural demands of your role appear to be pushing you into resource-conservation mode — solving problems alone rather than looping others in. That's a rational short-term response to overload, but it quietly increases the complexity you're fighting, since you lose the shortcuts that come from a second perspective.",
      actions: [
        "Pair-program your next non-trivial ticket instead of debugging it solo.",
        "Timebox solo debugging (45 minutes is a good default) — if it's still unresolved, pull in a second pair of eyes rather than pushing on alone.",
        "Protect one recurring sync with a teammate or mentor that's purely for talking through blockers, not status updates.",
      ],
    };
  }

  if (technostress >= HIGH && resources >= HIGH) {
    return {
      id: "overloaded-innovator",
      name: "The Overloaded Innovator",
      diagnosis:
        "Your data shows a powerful combination of high grit and self-efficacy intersecting with high technostress. Because your resilience and adaptability run high, you naturally step up to handle complex system changes and difficult debugging — but you're doing it in an environment that's forcing you to work faster than is sustainable. You're currently bridging the gap between organizational demands and technological complexity using your own psychological resilience.",
      actions: [
        "Practice strategic quitting: set a strict timebox for debugging (e.g. 45 minutes). If the blocker remains, force a context-switch or bring in a peer review rather than grinding on.",
        "Protect a daily deep-work block — 90 minutes with notifications fully off — to shield your flow state from the fragmentation of constant technology change.",
        "Aggressively automate the routine parts of your work (boilerplate, CI/CD logging) so your cognitive budget goes to architecture and logic, not repetition.",
      ],
    };
  }

  if (technostress >= HIGH) {
    return {
      id: "stretched-thin",
      name: "Stretched Thin",
      diagnosis:
        "Right now, the demands on your time and adaptability outpace the internal resources you have to meet them. This is a common and very fixable pattern — but left unaddressed, it's the classic precursor to burnout, since there's no reserve of grit or confidence currently absorbing the pressure.",
      actions: [
        "Name the single biggest source of friction in your week and raise it explicitly with your manager — this is a structural issue worth surfacing, not a personal failing to hide.",
        "Rebuild momentum with small, clearly completable wins before taking on ambiguous stretch work.",
        "Protect recovery time as seriously as you protect deadlines — under-resourced effort depletes fast without it.",
      ],
    };
  }

  if (resources >= HIGH) {
    return {
      id: "coasting-architect",
      name: "The Coasting Architect",
      diagnosis:
        "You have high resilience and you're currently operating in a comparatively sustainable environment. This is a rare, valuable window rather than something to worry about — the question now is what you deliberately do with the slack.",
      actions: [
        "Use this low-friction period to master a complex new AI workflow before the next wave of technological disruption hits.",
        "Mentor a junior engineer — your contextual performance compounds when you invest it in others while you have the bandwidth.",
        "Bank the win: document what's working in your current setup so you can recreate it the next time demands rise.",
      ],
    };
  }

  return {
    id: "steady-pacer",
    name: "The Steady Pacer",
    diagnosis:
      "Your current environment and your response to it are broadly in balance — you're neither overwhelmed nor coasting. That equilibrium is worth noticing, since it's usually easier to build from than to recover from a deficit.",
    actions: [
      "Use the stability to build one new skill on your own schedule, rather than only in reaction to pressure.",
      "Check back in periodically — balance can shift quietly as demands or team context change.",
      "Consider what meaningfully higher performance would look like for you with 10% more bandwidth, and take one step toward it.",
    ],
  };
}
