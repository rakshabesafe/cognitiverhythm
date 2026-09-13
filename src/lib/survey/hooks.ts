// All participant-facing narrative copy for the unlocked profile reports lives here.
// Each report ends on a "pivot" — a hook into the profile that comes next: traits (Grit)
// → output (Technology & Team) → environment (Stress) → mindset (Confidence).
import { GRIT_FACETS } from "./schema";
import {
  bandForModule,
  HIGH,
  tierFor,
  type Band,
  type GritFacetScore,
  type ScoreTier,
  type SectionScore,
} from "./scoring";

const TASK_PERFORMANCE_ITEMS = ["TP1", "TP2", "TP3", "TP4", "TP5"];
const CONTEXTUAL_PERFORMANCE_ITEMS = ["CP1", "CP2", "CP3", "CP4", "CP5", "CP6", "CP7", "CP8"];

function facetItems(id: string): string[] {
  return GRIT_FACETS.find((f) => f.id === id)?.items ?? [];
}

function meanOf(codes: string[], answers: Record<string, number>): number {
  const values = codes.map((c) => answers[c]).filter((v): v is number => typeof v === "number");
  return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

// Grit, Task Performance, and Contextual Performance all happen to sit on the same
// 1-5 scale in this instrument, so a single pct-of-5 helper is enough to compare them.
function pctOf5(mean: number): number {
  return (mean - 1) / 4;
}

// --- 1. Grit Profile → pivots into Technology & Team ---------------------------

interface GritFacetCopy {
  /** Plain-language definition of what this dimension actually measures. */
  meaning: string;
  /** One always-positive interpretation per gradation, keyed against the reference score. */
  tiers: Record<ScoreTier, string>;
}

// Every tier is written to sound encouraging — even "well-below" is framed as fast,
// available upside rather than a deficiency, per product direction: never sound negative
// about a score, always give it a positive spin, regardless of where it actually lands.
const GRIT_FACET_COPY: Record<string, GritFacetCopy> = {
  perseveranceOfEffort: {
    meaning:
      "How much steady effort you put toward a goal — pushing through obstacles and sticking with something rather than giving up on it.",
    tiers: {
      "well-above":
        "You bring an exceptional amount of sustained effort to your goals — you keep going long after most people would ease off, and that kind of persistence compounds into real results over time.",
      above:
        "You bring strong, steady effort to your goals — you push through obstacles rather than stalling out, which is a real asset.",
      typical:
        "You bring a solid, dependable level of effort to your goals — right in line with most professionals in this field, and a good foundation to build on.",
      below:
        "You tend to pace your effort carefully rather than pushing all-out on everything — a smart instinct in a demanding job. An easy win: pick one or two goals a month to deliberately push a little harder on.",
      "well-below":
        "You're currently more selective about where you invest sustained effort than most — which means there's fast, easy upside available: even small increases in follow-through here tend to show up quickly in results.",
    },
  },
  adaptability: {
    meaning:
      "How well you notice when something isn't working, learn from it, and change your approach — rather than sticking with a plan that's stopped serving you.",
    tiers: {
      "well-above":
        "You're exceptionally adaptable — you read situations quickly and change course without hesitation. That's one of the rarer, more valuable traits in fast-moving technical work.",
      above:
        "You adapt well — you notice when an approach isn't working and adjust course, which keeps you effective as things shift around you.",
      typical: "You adapt about as well as most professionals in this field — a solid, functional level of flexibility.",
      below:
        "You tend to give an approach a bit longer before adjusting course, which often reflects real conviction in your plan. An easy add: build a short checkpoint into big tasks to catch course-corrections even sooner.",
      "well-below":
        "Right now you lean toward staying the course rather than pivoting quickly — a real strength when a plan needs to be seen through. Adding a habit of briefly re-checking your approach partway through is a fast way to build more adaptability on top of that.",
    },
  },
  spiritedInitiative: {
    meaning:
      "How alert and proactive you stay in frustrating or high-pressure moments — pushing forward instead of freezing up or disengaging.",
    tiers: {
      "well-above":
        "You have an exceptional ability to stay engaged under real pressure — you push through frustration rather than disengaging, a standout trait in demanding environments.",
      above: "You stay alert and proactive under pressure more than most — you push through frustrating moments instead of stalling out.",
      typical: "You handle pressure and frustration about as well as most professionals in this field — a solid, workable baseline.",
      below:
        "Under real pressure, you tend to step back and reset before pushing forward again — often a healthy form of self-protection. A small, easy shift: give yourself one extra deliberate minute before stepping away, and see how often you push through anyway.",
      "well-below":
        "You currently favor stepping back when frustration builds — a genuinely reasonable instinct. The fastest upside here is small, low-stakes practice at staying engaged just a little longer before disengaging.",
    },
  },
  steadfastness: {
    meaning:
      "How strongly you hold on to your sense of purpose and keep going through setbacks or rejection, even when a situation looks hopeless.",
    tiers: {
      "well-above":
        "Your steadfastness is exceptional — rejection and setbacks barely register against your sense of purpose, giving you unusual staying power in long, difficult efforts.",
      above: "You hold onto your sense of purpose well through setbacks — more than most, you keep going instead of being derailed by a difficult patch.",
      typical: "You hold up under setbacks about as well as most professionals in this field — a solid, dependable baseline of resolve.",
      below:
        "Setbacks and rejection shake your resolve a little more than average — a very human, honest response. An easy anchor: keep one clear reminder of your \"why\" somewhere visible for the moments that test it.",
      "well-below":
        "Right now, difficult stretches affect your sense of purpose more than they do for most people — which just means this is the area with the fastest potential gains. Even a small anchor, like a clear reason \"why\" or a person to check in with, tends to move this quickly.",
    },
  },
};

export interface GritFacetDescription {
  id: string;
  label: string;
  meaning: string;
  tier: ScoreTier;
  description: string;
}

/** One graded, always-positive description per facet, in the same order as `facets`. */
export function describeGritFacets(facets: GritFacetScore[]): GritFacetDescription[] {
  return facets.map((f) => {
    const copy = GRIT_FACET_COPY[f.id];
    const tier = tierFor(f.yourScore, f.referenceAverage);
    return { id: f.id, label: f.label, meaning: copy.meaning, tier, description: copy.tiers[tier] };
  });
}

const OVERALL_GRIT_SUMMARY: Record<ScoreTier, string> = {
  "well-above": "Across all four dimensions, your overall grit score is exceptionally high — a genuine strength to lean on.",
  above: "Across all four dimensions, your overall grit score comes in above the typical range — a real strength to build from.",
  typical: "Across all four dimensions, your overall grit score lands right around the typical range for this field — a solid, dependable foundation.",
  below:
    "Across all four dimensions, your overall grit score is a touch below the typical range — which mostly means there's meaningful, fast-to-unlock room to grow, especially in the areas below.",
  "well-below":
    "Across all four dimensions, your overall grit score has real room to grow — and that's genuinely good news, since this kind of trait responds quickly to small, deliberate practice.",
};

/** Graded, always-positive one-liner for the overall (all-4-facet-average) grit score. */
export function overallGritSummary(overallYourScore: number, overallReference: number): string {
  return OVERALL_GRIT_SUMMARY[tierFor(overallYourScore, overallReference)];
}

export interface GritHook {
  heading: string;
  stat: string;
  pivot: string;
  /** Full MDGS facet breakdown (your score, reference average, live peer average). */
  facets: GritFacetScore[];
  /** Graded, plain-language interpretation of every facet — not just the highest one. */
  facetDescriptions: GritFacetDescription[];
}

/**
 * facets: the participant's real MDGS facet breakdown, already computed against live
 * in-study peers (see computeGritFacetBreakdown in scoring.ts) and sorted by the
 * participant's own score, highest first. Each facet also carries a fixed reference
 * average (GRIT_FACET_REFERENCE in scoring.ts) sourced from the validated MDGS norms for
 * this exact instrument, shown to participants as an unattributed "typical score" — never
 * cited by name in the UI. The live peerAverage stays separate and null until at least 3
 * real in-study peers have answered that facet, so the two numbers are never conflated.
 *
 * "Highest of your own four facets" is not the same as "above average" — someone's top
 * facet can still sit below the typical score (see facetDescriptions, which grades each
 * facet against its own reference point rather than against the participant's other
 * facets). The heading below only ever claims relative standing within their own profile,
 * never absolute strength, so it can't contradict the graded descriptions underneath it.
 */
export function chooseGritHook(facets: GritFacetScore[]): GritHook {
  const top = facets[0];
  const facetDescriptions = describeGritFacets(facets);

  // None of these claim an absolute strength level — that would risk contradicting a
  // facet's graded description above if the participant's relative-highest still sits
  // below the typical range. They only pose a forward-looking question, pivoting into
  // Technology & Team — the next tier in the flow.
  const pivots: Record<string, string> = {
    steadfastness:
      "Resilience doesn't exist in a vacuum, though — it's tested by what you actually do with it. Next, let's see how this shows up in your daily execution and team collaboration.",
    adaptability:
      "But knowing how to adjust course is only half the picture — the other half is what you actually produce with it. Next, let's see how this shows up in your daily execution and team collaboration.",
    perseveranceOfEffort:
      "Whether that effort sustains you or drains you shows up most clearly in what you actually produce. Next, let's see how this translates into your daily execution and team collaboration.",
    spiritedInitiative:
      "Which raises the obvious question: how does that translate into what you actually get done? Next, let's see how this shows up in your daily execution and team collaboration.",
  };

  const pivot = pivots[top?.id ?? ""] ?? pivots.adaptability;

  return {
    heading: top ? `Your strongest dimension right now is ${top.label}.` : "Here's your grit profile.",
    stat: "Grit isn't one trait — it's four. Here's what each dimension actually measures, and what your score on it means.",
    pivot,
    facets,
    facetDescriptions,
  };
}

// --- 2. Technology & Team Profile → pivots into Stress -------------------------

export interface PerformanceHook {
  id: "network-influence" | "effort-to-impact" | "resilience-roi" | "balanced-output";
  heading: string;
  stat: string;
  pivot: string;
}

interface PeerPercentile {
  percentile: number | null;
  count: number;
}

/**
 * Fires after Contextual Performance, which always follows Task Performance in the fixed
 * module order, so both are guaranteed answered by then. contextualPercentile is computed
 * from real peer data only — omitted from the copy entirely when there isn't enough of it
 * yet, rather than inventing a number.
 */
export function choosePerformanceHook(answers: Record<string, number>, contextualPercentile: PeerPercentile): PerformanceHook {
  const perseveranceOfEffort = pctOf5(meanOf(facetItems("perseveranceOfEffort"), answers));
  const adaptability = pctOf5(meanOf(facetItems("adaptability"), answers));
  const taskPerformance = pctOf5(meanOf(TASK_PERFORMANCE_ITEMS, answers));
  const contextualPerformance = pctOf5(meanOf(CONTEXTUAL_PERFORMANCE_ITEMS, answers));

  const pivot =
    "Now that we've seen your actual execution, let's measure the environmental pressure behind it — technostress and AI anxiety — and see how it's really landing on you.";

  if (contextualPerformance >= HIGH && contextualPerformance >= taskPerformance) {
    const { percentile, count } = contextualPercentile;
    return {
      id: "network-influence",
      heading: "This is your actual execution.",
      stat:
        percentile !== null
          ? `Your contextual performance puts you ahead of about ${percentile}% of the ${count} peers who've reached this section so far — you're not just executing tasks, you're operating as a knowledge hub for the people around you. That invisible collaborative work is real output, even though it rarely shows up on a sprint board.`
          : "Your contextual performance stands out — you're not just executing tasks, you're operating as a knowledge hub for the people around you. That invisible collaborative work is real output, even though it rarely shows up on a sprint board.",
      pivot,
    };
  }

  if (perseveranceOfEffort >= HIGH && taskPerformance >= HIGH) {
    return {
      id: "effort-to-impact",
      heading: "This is your actual execution.",
      stat: "Your high effort and perseverance are clearly translating into strong task execution. But the pattern in your answers suggests you may be getting there through sheer force rather than efficiency — a sustainable strategy for a sprint, not for a career.",
      pivot,
    };
  }

  if (adaptability >= HIGH && taskPerformance >= HIGH) {
    return {
      id: "resilience-roi",
      heading: "This is your actual execution.",
      stat: "You're successfully converting your adaptability into consistent task execution — a sign your operating rhythm holds up well even as things shift around you.",
      pivot,
    };
  }

  return {
    id: "balanced-output",
    heading: "This is your actual execution.",
    stat: "Your deep technical work and your collaborative work are moving together in a balanced way, with no obvious strain showing up between them.",
    pivot,
  };
}

// --- 3. Stress Profile → pivots into Confidence -------------------------------

export interface StressHook {
  band: Band;
  heading: string;
  stat: string;
  pivot: string;
}

/**
 * sections: the Technostress sub-dimension breakdown (Overload / Complexity / Uncertainty),
 * sorted highest-first, so the copy can name whichever one is actually driving their load.
 */
export function chooseStressHook(answers: Record<string, number>, sections: SectionScore[]): StressHook {
  const technostress = bandForModule("technostress", answers);
  const aiAnxiety = bandForModule("ai-anxiety", answers);
  const topSection = sections[0]?.label;
  const driver = topSection ? ` The biggest single driver is ${topSection.toLowerCase()}.` : "";

  if (technostress === "High" || aiAnxiety === "High") {
    return {
      band: "High",
      heading: "This is the cognitive weight you're currently carrying.",
      stat: `You're absorbing a high amount of structural pressure right now.${driver} That's not a personal shortcoming — it's a signal that the rate of technological change around you currently exceeds what's comfortable to absorb, and it's exactly the kind of demand that competes for the same mental budget your deep work needs.`,
      pivot:
        "When demands run this high, some engineers lose their confidence, while others rely on their grit to push through. Next, let's measure your occupational self-efficacy — to see whether this stress is depleting your confidence, or whether you're holding the line.",
    };
  }

  if (technostress === "Moderate" || aiAnxiety === "Moderate") {
    return {
      band: "Moderate",
      heading: "This is the cognitive weight you're currently carrying.",
      stat: `You're carrying a moderate amount of structural pressure — noticeable, but not yet overwhelming.${driver} This is the range where the habits you build now determine whether it stays manageable or quietly climbs.`,
      pivot:
        "Pressure at this level tends to be absorbed by confidence rather than resilience alone. Next, let's measure your occupational self-efficacy — the belief that you can handle what's coming — and see how well it's holding up.",
    };
  }

  return {
    band: "Low",
    heading: "This is the cognitive weight you're currently carrying.",
    stat: `Your readings come back light — the pace of workplace technology and the rise of AI aren't currently registering as threats to you.${driver} That's a genuinely valuable position, and rarer in this industry than you might expect.`,
    pivot:
      "Low pressure and high confidence usually travel together — but not always. Next, let's measure your occupational self-efficacy and see whether your belief in your own abilities matches how little this pressure is getting to you.",
  };
}

// --- 4. Confidence Profile → pivots into the Full Combined Report -------------

export interface ConfidenceHook {
  band: Band;
  heading: string;
  stat: string;
  pivot: string;
}

export function chooseConfidenceHook(answers: Record<string, number>): ConfidenceHook {
  const confidence = bandForModule("self-efficacy", answers);
  const technostress = bandForModule("technostress", answers);
  const underPressure = technostress === "High";
  const pivot =
    "That's every piece of your profile mapped. Your full report connects them — how your specific combination of grit, execution, and pressure is actually shaping your confidence, and what to do next.";

  if (confidence === "High") {
    return {
      band: confidence,
      heading: "This is your internal bridge.",
      stat: underPressure
        ? "Your belief in your ability to solve complex problems at work remains high despite the techno-overload you're carrying. That's the single most important pattern in your profile so far: you're maintaining mastery under pressure rather than losing it. Confidence is the bridge that lets grit actually fight back against stress instead of being worn down by it."
        : "You consistently believe you can find a way through whatever your job throws at you. That belief tends to be self-fulfilling — it's the bridge that turns grit and adaptability into sustained output instead of burnout.",
      pivot,
    };
  }

  if (confidence === "Moderate") {
    return {
      band: confidence,
      heading: "This is your internal bridge.",
      stat: underPressure
        ? "Your confidence is holding, but it's under real load — the pressure you're carrying appears to be pressing on your belief in your own abilities. This is the exact point where stress either gets absorbed or starts to translate into lost output."
        : "You generally trust your ability to handle what comes your way, though it isn't unshakeable yet. Confidence at this level grows fastest from small, concrete wins rather than reassurance.",
      pivot,
    };
  }

  return {
    band: confidence,
    heading: "This is your internal bridge.",
    stat: underPressure
      ? "Your confidence is reading low while you're carrying substantial technological pressure. That combination matters: when self-efficacy drops under load, capable people often stop attempting the very work that would rebuild their sense of mastery."
      : "Your answers suggest you're less sure of your ability to handle job demands than your effort and adaptability elsewhere would predict. That gap is worth naming — low self-efficacy can quietly cap how much of your real capability actually reaches your work.",
    pivot,
  };
}
