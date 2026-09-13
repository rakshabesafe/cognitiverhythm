// All participant-facing narrative copy for the unlocked profile reports lives here.
// Each report ends on a "pivot" — a hook into the profile that comes next, following the
// study's own theoretical path: traits (Grit) → environment (Stress) → mindset
// (Confidence) → output (Technology & Team).
import { GRIT_FACETS } from "./schema";
import { bandForModule, HIGH, type Band, type GritFacetScore, type PeerStat, type SectionScore } from "./scoring";

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

// --- 1. Grit Profile → pivots into Stress ------------------------------------

export interface GritHook {
  id: "adaptive-advantage" | "persistence-paradox" | "steadfast-edge" | "spirited-drive";
  heading: string;
  stat: string;
  pivot: string;
  /** Full MDGS facet breakdown (your score, reference average, live peer average). */
  facets: GritFacetScore[];
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
 * peerTechnostress: computed across everyone (not just fully-completed participants) who
 * has answered the Technostress section, since most peers won't have finished the whole
 * assessment yet when this fires. Real accumulated data only — never a placeholder number.
 */
export function chooseGritHook(facets: GritFacetScore[], peerTechnostress: PeerStat): GritHook {
  const top = facets[0]?.id;

  if (top === "steadfastness" && peerTechnostress.average !== null && peerTechnostress.count >= 3) {
    return {
      id: "steadfast-edge",
      heading: "Your foundation is steadfastness.",
      stat: `Your steadfastness reads rock-solid — rejection and setbacks don't derail you, and you hold onto a clear sense of purpose even when things look hopeless. But here's a pattern showing up across the ${peerTechnostress.count} peers who've reached the Technostress section so far: even people who rate themselves as highly resilient still report real strain from workplace technology, averaging ${peerTechnostress.average.toFixed(2)} / 5.0. Resilience doesn't seem to fully cancel out the overload.`,
      pivot:
        "Resilience doesn't exist in a vacuum. Next, let's look at the environmental friction — technostress and AI anxiety — that's currently testing your grit, and whether steadiness actually shields you from it.",
      facets,
    };
  }

  if (top === "adaptability") {
    return {
      id: "adaptive-advantage",
      heading: "Your foundation is adaptability.",
      stat: "Your standout trait is adaptability — you monitor yourself, learn fast from mistakes, and put in the work to adjust course. That's a distinctly different profile from rigid persistence, and it's closer to what's often called a jugaad mindset: flexible, resourceful problem-solving rather than stubbornly pushing on with a plan that isn't working. You treat technological shifts as puzzles rather than threats.",
      pivot:
        "High adaptability is a massive asset — but resilience doesn't exist in a vacuum. Next, let's look at the environmental friction — technostress and AI anxiety — that's currently testing your grit.",
      facets,
    };
  }

  if (top === "perseveranceOfEffort") {
    return {
      id: "persistence-paradox",
      heading: "Your foundation is perseverance of effort.",
      stat: "You lean heavily on sustained effort — stepping outside your comfort zone and pushing through obstacles rather than around them. It's a well-documented pattern that pure persistence can backfire when it isn't paired with knowing when to change approach, leaving people stuck in long, low-yield loops that quietly drain their focus.",
      pivot:
        "Whether that effort sustains you or drains you depends heavily on what you're pushing against. Next, let's measure the environmental friction — technostress and AI anxiety — that's currently testing your grit.",
      facets,
    };
  }

  // Spirited Initiative highest — staying alert and pushing forward through frustration/distress.
  return {
    id: "spirited-drive",
    heading: "Your foundation is spirited initiative.",
    stat: "You stay alert and keep moving even in the middle of difficult, high-pressure situations — pushing through frustration rather than freezing up or disengaging. People with this profile often end up absorbing a disproportionate share of the pressure during a crunch, precisely because they're the ones who don't flinch.",
    pivot:
      "Which raises the obvious question: how much pressure are you actually absorbing? Next, let's measure the environmental friction — technostress and AI anxiety — that's currently testing your grit.",
    facets,
  };
}

// --- 2. Stress Profile → pivots into Confidence -------------------------------

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

// --- 3. Confidence Profile → pivots into Technology & Team --------------------

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

  if (confidence === "High") {
    return {
      band: confidence,
      heading: "This is your internal bridge.",
      stat: underPressure
        ? "Your belief in your ability to solve complex problems at work remains high despite the techno-overload you're carrying. That's the single most important pattern in your profile so far: you're maintaining mastery under pressure rather than losing it. Confidence is the bridge that lets grit actually fight back against stress instead of being worn down by it."
        : "You consistently believe you can find a way through whatever your job throws at you. That belief tends to be self-fulfilling — it's the bridge that turns grit and adaptability into sustained output instead of burnout.",
      pivot:
        "Finally, let's see exactly how this confidence translates into your daily output and your team collaboration — the two halves of your actual execution.",
    };
  }

  if (confidence === "Moderate") {
    return {
      band: confidence,
      heading: "This is your internal bridge.",
      stat: underPressure
        ? "Your confidence is holding, but it's under real load — the pressure you're carrying appears to be pressing on your belief in your own abilities. This is the exact point where stress either gets absorbed or starts to translate into lost output."
        : "You generally trust your ability to handle what comes your way, though it isn't unshakeable yet. Confidence at this level grows fastest from small, concrete wins rather than reassurance.",
      pivot:
        "Finally, let's see exactly how this confidence translates into your daily output and your team collaboration — the two halves of your actual execution.",
    };
  }

  return {
    band: confidence,
    heading: "This is your internal bridge.",
    stat: underPressure
      ? "Your confidence is reading low while you're carrying substantial technological pressure. That combination matters: when self-efficacy drops under load, capable people often stop attempting the very work that would rebuild their sense of mastery."
      : "Your answers suggest you're less sure of your ability to handle job demands than your effort and adaptability elsewhere would predict. That gap is worth naming — low self-efficacy can quietly cap how much of your real capability actually reaches your work.",
    pivot:
      "Finally, let's see exactly how this plays out in practice — your daily output and your team collaboration, the two halves of your actual execution.",
  };
}

// --- 4. Technology & Team Profile → pivots into the Full Combined Report ------

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
 * Fires after Contextual Performance, the final module. contextualPercentile is computed
 * from real peer data only — omitted from the copy entirely when there isn't enough of it
 * yet, rather than inventing a number.
 */
export function choosePerformanceHook(answers: Record<string, number>, contextualPercentile: PeerPercentile): PerformanceHook {
  const perseveranceOfEffort = pctOf5(meanOf(facetItems("perseveranceOfEffort"), answers));
  const adaptability = pctOf5(meanOf(facetItems("adaptability"), answers));
  const taskPerformance = pctOf5(meanOf(TASK_PERFORMANCE_ITEMS, answers));
  const contextualPerformance = pctOf5(meanOf(CONTEXTUAL_PERFORMANCE_ITEMS, answers));

  const pivot =
    "That's every piece of your profile mapped. Your full report connects them — how your specific combination of grit and pressure is actually driving your performance.";

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
