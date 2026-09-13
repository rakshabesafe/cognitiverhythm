// All participant-facing narrative copy for the unlocked profile reports lives here.
// Each report ends on a "pivot" — a hook into the profile that comes next: traits (Grit)
// → output (Technology & Team) → environment (Stress) → mindset (Confidence).
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
//
// Framed as an "Energy Allocation Profile," not a performance evaluation: performance is
// a sensitive topic, and labeling someone "Low" here would trigger defensiveness and
// undermine the psychological safety the rest of the study depends on. Task Performance
// and Contextual Performance aren't scored as good/bad — they're read as two vectors of a
// finite cognitive budget, with every archetype (including the lowest-output one) framed
// as a deliberate, reasonable allocation strategy rather than a deficiency.
//
// The narrative is further personalized by role and tenure, since this study's own
// framework treats demographic/contextual variables as moderators of these relationships:
// what a given Task/Contextual split *means* genuinely differs for an individual
// contributor vs. a technical leader, and for someone 1 year in vs. 12.

export interface EnergyAllocationRowInsight {
  moduleId: "task-performance" | "contextual-performance";
  /** Short, neutral verb — "Channeling"/"Conserving"/"Investing"/"Protecting" — never "Low". */
  label: string;
  text: string;
}

export interface EnergyAllocationHook {
  id: "dual-core" | "deep-work-specialist" | "ecosystem-enabler" | "conservation-mode";
  archetypeName: string;
  heading: string;
  contextLabel: string;
  contextText: string;
  meaningLabel: string;
  meaningParagraphs: string[];
  pivot: string;
  rowInsights: EnergyAllocationRowInsight[];
}

type RoleGroup = "ic" | "leader";
type ExperienceTier = "newcomer" | "mid" | "veteran";

// Demographics' "role" field is exactly "Software Engineer" | "Designer/Architect" |
// "Manager" (see DEMOGRAPHICS in schema.ts) — Designer/Architect and Manager both carry
// the "unblock others, shape the system" expectation the narrative below is built around.
function roleGroupFor(role: string | undefined): RoleGroup {
  return role === "Software Engineer" ? "ic" : "leader";
}

function experienceTierFor(experience: string | undefined): ExperienceTier {
  if (experience === "<= 5") return "newcomer";
  if (experience === "10+") return "veteran";
  return "mid";
}

interface ArchetypeCopy {
  contextText: string;
  meaningParagraphs: string[];
}

function dualCoreCopy(roleGroup: RoleGroup, role: string): ArchetypeCopy {
  if (roleGroup === "ic") {
    return {
      contextText:
        "As a Software Engineer, your core mandate is deep technical execution, with collaboration as a valuable addition on top of it.",
      meaningParagraphs: [
        "Right now you're doing both at a high level — shipping independently and actively supporting your team. That's a genuinely strong signal, but it also means you're running two demanding threads on the same finite cognitive budget.",
      ],
    };
  }
  return {
    contextText: `As a ${role}, your typical baseline already leans toward Contextual Performance — mentoring, unblocking others, and shaping how the team works.`,
    meaningParagraphs: [
      "Right now you're also matching that with high independent technical execution — effectively doing both the leadership work and the individual-contributor work at once.",
      "That combination is powerful, but it's also the profile most likely to lead to being spread too thin if it continues unchecked.",
    ],
  };
}

function deepWorkCopy(roleGroup: RoleGroup, role: string): ArchetypeCopy {
  if (roleGroup === "ic") {
    return {
      contextText:
        "As a Software Engineer, your core mandate is deep technical execution — collaboration is valuable, but it isn't the primary measure of your role.",
      meaningParagraphs: [
        "This is the optimal state for a developer. You're successfully protecting your code-commit time from meeting fatigue and constant context-switching.",
      ],
    };
  }
  return {
    contextText: `As a ${role}, your typical baseline usually requires heavy Contextual Performance — mentoring developers, designing system boundaries, and guiding team workflows.`,
    meaningParagraphs: [
      "Right now, though, your data shows you operating more like an individual contributor — heavily indexed on independent technical problem-solving while pulling back from team-support work.",
      "When an experienced technical leader shifts this way, it's almost always a symptom of environmental strain — a staffing gap on the team, or a critical deadline pulling you back into the codebase. Short-term, this kind of brute-force execution works. Long-term, relying on a leader to operate as an individual contributor is worth naming as an organizational risk, not just absorbing quietly.",
    ],
  };
}

function ecosystemEnablerCopy(roleGroup: RoleGroup, role: string): ArchetypeCopy {
  if (roleGroup === "leader") {
    return {
      contextText: `As a ${role}, your typical baseline already leans toward Contextual Performance.`,
      meaningParagraphs: [
        "Right now you're operating exactly as a servant-leader should — sacrificing some of your own independent tickets to make sure the broader team and architecture hold together. That's the role working as intended.",
      ],
    };
  }
  return {
    contextText:
      "As a Software Engineer, your core mandate is usually deep technical execution first, with collaboration as a valuable addition on top of it.",
    meaningParagraphs: [
      "You're currently acting as the glue for your team — genuinely valuable work.",
      "One thing worth watching: engineers who over-index on team support for an extended stretch sometimes fall behind on the core technical upskilling their own growth depends on. Worth protecting a little independent build time alongside it.",
    ],
  };
}

function conservationModeCopy(tier: ExperienceTier): ArchetypeCopy {
  if (tier === "newcomer") {
    return {
      contextText:
        "Early in a career, your technical bandwidth is still being built — a reading like this isn't unusual, but it's worth understanding the cause rather than just pushing through.",
      meaningParagraphs: [
        "Landing in Conservation Mode this early often means you've hit a steep technical-complexity wall — quietly struggling with a new framework or system rather than asking for help.",
        "This is exactly the moment to lean on your own spirited initiative and pull in a senior peer — it's a faster path back to momentum than pushing through alone.",
      ],
    };
  }
  if (tier === "veteran") {
    return {
      contextText:
        "With over a decade in the industry, you've almost certainly seen this pattern before — in yourself and in the people you've mentored.",
      meaningParagraphs: [
        "For veteran engineers, stepping into Conservation Mode usually isn't about a lack of skill — it's a strategic retreat.",
        "You're likely pacing yourself through a disorganized project cycle specifically to avoid the emotional exhaustion that leads to burnout.",
      ],
    };
  }
  return {
    contextText:
      "With a few years of experience behind you, you've generally built real technical capacity — so a pullback like this is more often a deliberate signal than a skills gap.",
    meaningParagraphs: [
      "Pulling back into Conservation Mode at this stage usually means you're protecting your bandwidth for something specific — a looming deadline, a personal commitment, or recovery from a recent crunch.",
      "It's worth naming to yourself what it's actually protecting, so it stays a deliberate choice rather than a slow drift.",
    ],
  };
}

/**
 * Fires after Contextual Performance, which always follows Task Performance in the fixed
 * module order, so both are guaranteed answered by then. A simple 2x2 on Task Performance
 * x Contextual Performance (each read against the same HIGH threshold used everywhere
 * else in this file) picks one of four non-judgmental archetypes, then role (for the three
 * archetypes with a clear expectation to compare against) or tenure (for Conservation
 * Mode, where the same low-low reading means something very different for a newcomer vs.
 * a veteran) personalizes the narrative. Demographics are always complete by this point —
 * they're required before any Likert module is reachable — so role/experience are real,
 * not guessed.
 */
export function chooseEnergyAllocationHook(
  answers: Record<string, number>,
  demographics: Record<string, string>
): EnergyAllocationHook {
  const taskPerformance = pctOf5(meanOf(TASK_PERFORMANCE_ITEMS, answers));
  const contextualPerformance = pctOf5(meanOf(CONTEXTUAL_PERFORMANCE_ITEMS, answers));
  const taskHigh = taskPerformance >= HIGH;
  const contextualHigh = contextualPerformance >= HIGH;

  const role = demographics.role || "professional";
  const roleGroup = roleGroupFor(demographics.role);
  const experienceTier = experienceTierFor(demographics.experience);

  const rowInsights: EnergyAllocationRowInsight[] = [
    {
      moduleId: "task-performance",
      label: taskHigh ? "Channeling" : "Conserving",
      text: taskHigh
        ? "You're routing significant bandwidth into technical execution."
        : "You're pacing your technical output.",
    },
    {
      moduleId: "contextual-performance",
      label: contextualHigh ? "Investing" : "Protecting",
      text: contextualHigh
        ? "You're allocating bandwidth to unblocking and supporting your team."
        : "You're limiting extra collaborative commitments.",
    },
  ];

  if (taskHigh && contextualHigh) {
    const copy = dualCoreCopy(roleGroup, role);
    return {
      id: "dual-core",
      archetypeName: "The Dual-Core Contributor",
      heading: "Your Operating Rhythm: The Dual-Core Contributor",
      contextLabel: "The context of your role:",
      contextText: copy.contextText,
      meaningLabel: `What this means for you as a ${role}:`,
      meaningParagraphs: copy.meaningParagraphs,
      pivot:
        "Next: running at this intensity means something has to be fueling it. Let's measure the invisible friction in your workflow — technostress and AI anxiety — to see what's behind the pace.",
      rowInsights,
    };
  }

  if (taskHigh && !contextualHigh) {
    const copy = deepWorkCopy(roleGroup, role);
    return {
      id: "deep-work-specialist",
      archetypeName: "The Deep-Work Specialist",
      heading: "Your Operating Rhythm: The Deep-Work Specialist",
      contextLabel: "The context of your role:",
      contextText: copy.contextText,
      meaningLabel: `What this means for you as a ${role}:`,
      meaningParagraphs: copy.meaningParagraphs,
      pivot:
        "Next: let's measure the invisible friction in your workflow — technostress and AI anxiety — to see what's shaping this focus.",
      rowInsights,
    };
  }

  if (!taskHigh && contextualHigh) {
    const copy = ecosystemEnablerCopy(roleGroup, role);
    return {
      id: "ecosystem-enabler",
      archetypeName: "The Ecosystem Enabler",
      heading: "Your Operating Rhythm: The Ecosystem Enabler",
      contextLabel: "The context of your role:",
      contextText: copy.contextText,
      meaningLabel: `What this means for you as a ${role}:`,
      meaningParagraphs: copy.meaningParagraphs,
      pivot:
        "Next: let's measure the invisible friction in your workflow — technostress and AI anxiety — to see what's behind this pattern.",
      rowInsights,
    };
  }

  const copy = conservationModeCopy(experienceTier);
  const meaningLabel =
    experienceTier === "newcomer"
      ? "What this means early in your career:"
      : experienceTier === "veteran"
        ? "What this means as a veteran engineer:"
        : "What this means at this stage of your career:";
  return {
    id: "conservation-mode",
    archetypeName: "Conservation Mode",
    heading: "Your Operating Rhythm: Conservation Mode",
    contextLabel: "The context of your experience:",
    contextText: copy.contextText,
    meaningLabel,
    meaningParagraphs: copy.meaningParagraphs,
    pivot:
      "Next: you're clearly conserving energy, which means something in your environment is likely draining it. Let's measure the invisible friction in your workflow — technostress and AI anxiety — to find the source of the drain.",
    rowInsights,
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
