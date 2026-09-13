import { GRIT_FACETS } from "./schema";
import { HIGH, type GritFacetScore, type PeerStat } from "./scoring";

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

export interface GritHook {
  id: "adaptive-advantage" | "persistence-paradox" | "steadfast-edge" | "spirited-drive";
  heading: string;
  stat: string;
  pivot: string;
  /** Full MDGS facet breakdown (your score vs. live peer average), sorted highest-first. */
  facets: GritFacetScore[];
}

/**
 * facets: the participant's real MDGS facet breakdown, already computed against live
 * in-study peers (see computeGritFacetBreakdown in scoring.ts) and sorted by the
 * participant's own score, highest first. No external "world average" is used — the
 * Multi-Dimensional Grit Scale (Singh & Chukkali, 2021) is a recently validated,
 * India-specific instrument with no established population norms yet (unlike
 * Duckworth's older, structurally different Grit-S), so an outside benchmark would
 * misrepresent a different construct as equivalent. Live in-study peer data is the
 * only honest comparison available.
 *
 * peerTechnostress: computed across everyone (not just fully-completed participants) who
 * has answered the Technostress section, since most peers won't have finished the whole
 * assessment yet when this fires. Real accumulated data only — never a placeholder number.
 */
export function chooseGritHook(facets: GritFacetScore[], peerTechnostress: PeerStat): GritHook {
  const top = facets[0]?.id;

  if (top === "steadfastness" && peerTechnostress.average !== null && peerTechnostress.count >= 3) {
    return {
      id: "steadfast-edge",
      heading: "Here's something interesting…",
      stat: `Your steadfastness reads rock-solid — rejection and setbacks don't derail you, and you hold onto a clear sense of purpose even when things look hopeless. But here's a pattern showing up across the ${peerTechnostress.count} peers who've reached the Technostress section so far: even people who rate themselves as highly resilient still report real strain from workplace technology, averaging ${peerTechnostress.average.toFixed(2)} / 5.0. Resilience doesn't seem to fully cancel out the overload.`,
      pivot:
        "We want to find out if that holds for you too — whether steadiness acts as a shield, or whether the pace of technology gets through regardless of how tough you are. Let's look at your actual task execution next.",
      facets,
    };
  }

  if (top === "adaptability") {
    return {
      id: "adaptive-advantage",
      heading: "You're highly adaptable — but is it translating to impact?",
      stat: "Your standout trait is adaptability — you monitor yourself, learn fast from mistakes, and put in the work to adjust course. That's a distinctly different profile from rigid persistence, and it's closer to what researchers studying Indian IT professionals call jugaad: flexible, resourceful problem-solving rather than stubbornly pushing on with a plan that isn't working. You treat technological shifts as puzzles rather than threats.",
      pivot:
        "But having the psychological capacity to adapt is only half the equation. The next step is seeing how this internal resilience actually translates into your daily execution and collaboration.",
      facets,
    };
  }

  if (top === "perseveranceOfEffort") {
    return {
      id: "persistence-paradox",
      heading: "Here's something interesting…",
      stat: "You lean heavily on sustained effort — stepping outside your comfort zone and pushing through obstacles rather than around them. It's a well-documented pattern that pure persistence can backfire when it isn't paired with knowing when to change approach, leaving people stuck in long, low-yield loops that quietly drain their focus.",
      pivot:
        "The difference between burning out and staying sharp usually comes down to whether that effort is paired with adaptive performance. Let's look at your actual execution style next.",
      facets,
    };
  }

  // Spirited Initiative highest — staying alert and pushing forward through frustration/distress.
  return {
    id: "spirited-drive",
    heading: "Here's something interesting…",
    stat: "You stay alert and keep moving even in the middle of difficult, high-pressure situations — pushing through frustration rather than freezing up or disengaging. People with this profile often end up absorbing a disproportionate share of the pressure during a crunch, precisely because they're the ones who don't flinch.",
    pivot:
      "That's valuable, but it's also easy for organizations to take for granted. Next, we want to measure how that shows up in your actual task execution and in the support you give your team.",
    facets,
  };
}

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
 * Fires after Contextual Performance (which always follows Task Performance in the fixed
 * module order, so both are guaranteed answered by then). contextualPercentile is computed
 * from real peer data only — omitted from the copy entirely when there isn't enough of it
 * yet, rather than inventing a number.
 */
export function choosePerformanceHook(answers: Record<string, number>, contextualPercentile: PeerPercentile): PerformanceHook {
  const perseveranceOfEffort = pctOf5(meanOf(facetItems("perseveranceOfEffort"), answers));
  const adaptability = pctOf5(meanOf(facetItems("adaptability"), answers));
  const taskPerformance = pctOf5(meanOf(TASK_PERFORMANCE_ITEMS, answers));
  const contextualPerformance = pctOf5(meanOf(CONTEXTUAL_PERFORMANCE_ITEMS, answers));

  if (contextualPerformance >= HIGH && contextualPerformance >= taskPerformance) {
    const { percentile, count } = contextualPercentile;
    return {
      id: "network-influence",
      heading: "Here's something interesting…",
      stat:
        percentile !== null
          ? `Your Contextual Performance puts you ahead of about ${percentile}% of the ${count} peers who've reached this section so far — you're not just executing tasks, you're operating as a knowledge hub for the people around you.`
          : "Your Contextual Performance stands out — you're not just executing tasks, you're operating as a knowledge hub for the people around you.",
      pivot:
        "That kind of \"invisible leadership\" is a real asset, but it's also the first thing to get squeezed when workplace technology piles on. Let's look at that next.",
    };
  }

  if (perseveranceOfEffort >= HIGH && taskPerformance >= HIGH) {
    return {
      id: "effort-to-impact",
      heading: "Here's something interesting…",
      stat: "Your high effort and perseverance are clearly translating into strong task execution. But the pattern in your answers suggests you may be getting there through sheer force rather than efficiency — a sustainable strategy for a sprint, not for a career.",
      pivot:
        "Leaning on AI coding assistants or automation for the routine parts of your work could preserve this output while freeing up the energy your effort is currently absorbing. Let's look at how workplace technology is actually landing for you next.",
    };
  }

  if (adaptability >= HIGH && taskPerformance >= HIGH) {
    return {
      id: "resilience-roi",
      heading: "Here's something interesting…",
      stat: "You're successfully converting your adaptability into consistent task execution — a sign your operating rhythm holds up well even as things shift around you.",
      pivot: "The real test is whether that holds under sustained technological pressure. Let's look at that next.",
    };
  }

  return {
    id: "balanced-output",
    heading: "Here's something interesting…",
    stat: "Your effort and your output are moving together in a balanced way so far, with no obvious strain showing up yet.",
    pivot: "Now let's see how the pace of workplace technology factors into that balance.",
  };
}
