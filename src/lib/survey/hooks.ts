import { HIGH, type PeerStat } from "./scoring";

// Informal groupings of the 12 Grit items, used ONLY to pick which motivational
// "hook" resonates most right after the Grit section. These are presentation-layer
// heuristics, not an additional scored construct — the official Grit score used in
// the report/archetype/CSV export is still the single 12-item mean.
const EFFORT_ITEMS = ["G4", "G5", "G6"]; // monitor/control self, learn from mistakes, work hard
const INITIATIVE_ITEMS = ["G1", "G2", "G7"]; // leave comfort zone, new ideas, adaptable in distress
const STEADFASTNESS_ITEMS = ["G3", "G8", "G9", "G10", "G11", "G12"]; // won't be deterred, sense of purpose
const TASK_PERFORMANCE_ITEMS = ["TP1", "TP2", "TP3", "TP4", "TP5"];
const CONTEXTUAL_PERFORMANCE_ITEMS = ["CP1", "CP2", "CP3", "CP4", "CP5", "CP6", "CP7", "CP8"];

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
  id: "persistence-paradox" | "invisible-work" | "ai-transition-gap";
  heading: string;
  stat: string;
  pivot: string;
}

/**
 * peerTechnostress: computed across everyone (not just fully-completed participants) who
 * has answered the Technostress section, since most peers won't have finished the whole
 * assessment yet when this fires. Real accumulated data only — never a placeholder number.
 */
export function chooseGritHook(answers: Record<string, number>, peerTechnostress: PeerStat): GritHook {
  const effort = meanOf(EFFORT_ITEMS, answers);
  const initiative = meanOf(INITIATIVE_ITEMS, answers);
  const steadfastness = meanOf(STEADFASTNESS_ITEMS, answers);
  const top = Math.max(effort, initiative, steadfastness);

  if (top === steadfastness && peerTechnostress.average !== null && peerTechnostress.count >= 3) {
    return {
      id: "ai-transition-gap",
      heading: "Here's something interesting…",
      stat: `Your steadfastness reads rock-solid — you don't rattle easily under pressure. But here's a pattern showing up across the ${peerTechnostress.count} peers who've reached the Technostress section so far: even people who rate themselves as highly resilient still report real strain from workplace technology, averaging ${peerTechnostress.average.toFixed(2)} / 5.0. Resilience doesn't seem to fully cancel out the overload.`,
      pivot:
        "We want to find out if that holds for you too — whether steadiness acts as a shield, or whether the pace of technology gets through regardless of how tough you are. Let's look at your actual task execution next.",
    };
  }

  if (top === effort) {
    return {
      id: "persistence-paradox",
      heading: "Here's something interesting…",
      stat: "You lean heavily on effort and hard work to reach your goals. It's a well-documented pattern in software engineering that pure persistence can backfire — developers who push through on effort alone are more prone to getting stuck in long, low-yield debugging loops that quietly drain their focus for the rest of the day.",
      pivot:
        "The difference between burning out and staying sharp usually comes down to whether that effort is paired with adaptive performance — knowing when to push and when to change approach. Let's look at your actual execution style next.",
    };
  }

  if (top === initiative) {
    return {
      id: "invisible-work",
      heading: "Here's something interesting…",
      stat: "Your initiative and adaptability stand out. People with this profile often end up carrying a lot of \"invisible work\" — fixing broken pipelines, mentoring juniors, untangling technical debt — the kind of contribution that rarely shows up on a sprint board.",
      pivot:
        "Traditional performance reviews usually miss this entirely. Next, we want to measure the real balance between your visible technical output and the invisible glue work you provide your team.",
    };
  }

  // Steadfastness highest, but not enough peer Technostress data yet for the specific stat.
  return {
    id: "ai-transition-gap",
    heading: "Here's something interesting…",
    stat: "Your steadfastness reads rock-solid — you don't rattle easily under pressure. Research on IT professionals consistently finds that this kind of resilience doesn't fully shield people from the strain of constant technological change; the two tend to run somewhat independently.",
    pivot: "We want to find out if that holds for you too. Let's look at your actual task execution next.",
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
  const effort = pctOf5(meanOf(EFFORT_ITEMS, answers));
  const initiative = pctOf5(meanOf(INITIATIVE_ITEMS, answers));
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

  if (effort >= HIGH && taskPerformance >= HIGH) {
    return {
      id: "effort-to-impact",
      heading: "Here's something interesting…",
      stat: "Your high effort and perseverance are clearly translating into strong task execution. But the pattern in your answers suggests you may be getting there through sheer force rather than efficiency — a sustainable strategy for a sprint, not for a career.",
      pivot:
        "Leaning on AI coding assistants or automation for the routine parts of your work could preserve this output while freeing up the energy your effort is currently absorbing. Let's look at how workplace technology is actually landing for you next.",
    };
  }

  if (initiative >= HIGH && taskPerformance >= HIGH) {
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
