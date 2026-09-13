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
//
// Maps Operational Friction (Technostress) against Existential Threat (AI Job Anxiety) —
// two different sources of strain that call for different responses, so collapsing them
// into one generic "stress level" would lose the most actionable part of the read. Each
// axis uses this app's usual pct-of-own-scale HIGH threshold (bandForModule/bandForScore)
// rather than a shared raw-number cutoff, since Technostress sits on a 5-point scale and
// AI Job Anxiety on a 7-point one — a raw "3" means a very different thing on each.

/** A single per-construct card's insight — shared shape for both Stress and Confidence. */
export interface RowInsight {
  id: string;
  emoji: "🔴" | "🟡" | "🟢";
  band: Band;
  text: string;
}

// Technostress/AI Anxiety are "negative"-direction constructs (High = bad = red); Self-
// Efficacy is "positive"-direction (High = good = green) — same distinction scoring.ts's
// DIRECTIONS map makes elsewhere. Using one map for both would tell someone their high
// self-confidence is a red flag, which is simply wrong, not just a tone issue.
const NEGATIVE_ROW_EMOJI: Record<Band, "🔴" | "🟡" | "🟢"> = { High: "🔴", Moderate: "🟡", Low: "🟢" };
const POSITIVE_ROW_EMOJI: Record<Band, "🔴" | "🟡" | "🟢"> = { High: "🟢", Moderate: "🟡", Low: "🔴" };

const STRESS_ROW_COPY: Record<string, Record<Band, string>> = {
  Overload: {
    High: "You're in a perpetual state of transition and time pressure.",
    Moderate: "You feel the pace, but it isn't yet overwhelming.",
    Low: "The pace of change and workload feels manageable to you.",
  },
  Complexity: {
    High: "You're spending real energy just trying to understand the tools you're required to use.",
    Moderate: "New technology takes some effort to pick up, but it isn't a major obstacle.",
    Low: "You understand the tech; the difficulty isn't the issue.",
  },
  Uncertainty: {
    High: "Constant, unpredictable change in your tools and systems is a real source of strain.",
    Moderate: "Things change fairly often, but at a pace you can mostly keep up with.",
    Low: "Your tools and systems feel stable enough to plan around.",
  },
  "ai-anxiety": {
    High: "You perceive AI as a direct threat to your professional relevance.",
    Moderate: "AI's rise registers as a real concern, without dominating how you think about your career.",
    Low: "You feel secure in your role alongside AI.",
  },
};

/** id: "Overload" | "Complexity" | "Uncertainty" | "ai-anxiety" — matches STRESS_ROW_COPY's keys. */
export function describeStressRow(id: string, band: Band): RowInsight {
  return { id, emoji: NEGATIVE_ROW_EMOJI[band], band, text: STRESS_ROW_COPY[id][band] };
}

export interface StressHook {
  id: "pressure-cooker" | "obsolescence-spiral" | "existential-wait" | "shielded-operator";
  archetypeName: string;
  heading: string;
  contextLabel: string;
  contextText: string;
  meaningLabel: string;
  meaningParagraphs: string[];
  pivot: string;
}

function pressureCookerContext(orgType: string | undefined): string {
  if (orgType === "Product") {
    return "In product companies, the pressure usually isn't client SLAs — it's release velocity. Your high techno-overload reads as a structural feature of how fast your organization ships, not a personal time-management failure.";
  }
  return "Operating in the global delivery model common to service-based IT companies inherently normalizes boundary-blurring and tight client SLAs. Your high techno-overload is a structural feature of your organization's business model, not a personal time-management failure.";
}

function existentialWaitContext(orgType: string | undefined): string {
  if (orgType === "Product") {
    return "In product firms, the pressure isn't usually client hours — it's innovation velocity. Your anxiety likely stems from watching AI get integrated into your core product architecture, forcing a perpetual state of transition even while your day-to-day workload stays manageable.";
  }
  return "In service-delivery organizations, AI anxiety often centers less on today's ticket queue and more on how AI could reshape the billable-hours model itself — which explains why your day-to-day friction reads low while this concern persists.";
}

function obsolescenceSpiralContext(ageGroup: string | undefined): string {
  if (ageGroup === "18 to 28") {
    return "As a younger engineer, you're facing a unique paradox: AI is automating the exact routine coding and testing tasks entry-level engineers typically use to build foundational mastery. Your anxiety is valid — the stepping stones of your career path are shifting under you.";
  }
  if (ageGroup === "35 and above") {
    return "With your seniority, this concern is less about core coding ability and more about staying strategically relevant as the tools around you change faster than most organizations can absorb.";
  }
  return "At this stage of your career, you've built real technical grounding — so this isn't about foundational skills. It more likely reflects watching the tools and workflows you've mastered get rapidly reshaped by AI, with the shape of your next few years genuinely unclear.";
}

/**
 * demographics: orgType personalizes Pressure Cooker and Existential Wait (their strain
 * has a different structural source in a Product vs. a Service-delivery organization);
 * ageGroup personalizes Obsolescence Spiral (the same double-threat reading means
 * something different for someone still building foundational skills vs. someone senior).
 * gritBand: the participant's own Grit reading (bandForModule("grit", answers) from the
 * caller) — referenced only in the Obsolescence Spiral pivot, which poses the "unstoppable
 * force meets immovable object" cliffhanger explicitly in terms of their own grit score,
 * tying back to the first report in the arc.
 */
export function chooseStressHook(
  answers: Record<string, number>,
  demographics: Record<string, string>,
  gritBand: Band
): StressHook {
  const technostressHigh = bandForModule("technostress", answers) === "High";
  const aiAnxietyHigh = bandForModule("ai-anxiety", answers) === "High";

  if (technostressHigh && !aiAnxietyHigh) {
    return {
      id: "pressure-cooker",
      archetypeName: "The Pressure Cooker",
      heading: "Your Stress Profile: The Pressure Cooker",
      contextLabel: "The context of your environment:",
      contextText: pressureCookerContext(demographics.orgType),
      meaningLabel: "What this means for you:",
      meaningParagraphs: [
        "The friction here is strictly operational, not existential — you're not worried AI is coming for your job, you're worn down by the sheer volume of updates, tight deadlines, and constant change.",
        "That's a meaningfully different, and more directly solvable, problem than career-threat anxiety: it responds to workload and process changes rather than requiring you to resolve how you feel about AI itself.",
      ],
      pivot:
        "The friction is real, but it's environmental, not a reflection of your ability to keep up. Next, let's measure your Occupational Self-Efficacy to see how well your confidence is holding up under this operational load.",
    };
  }

  if (technostressHigh && aiAnxietyHigh) {
    const pivot =
      gritBand === "High"
        ? "High grit. High overload. High AI anxiety. What happens when an unstoppable force — this much technostress — meets an immovable object — your own Multidimensional Grit? The deciding factor is your Occupational Self-Efficacy: your core belief in your ability to survive this transition. Let's measure it next."
        : "That's a lot to carry at once. Next, let's measure your Occupational Self-Efficacy — your core belief in your ability to survive this transition — to see how it's holding up.";
    return {
      id: "obsolescence-spiral",
      archetypeName: "The Obsolescence Spiral",
      heading: "Your Stress Profile: The Obsolescence Spiral",
      contextLabel: "The context of your career stage:",
      contextText: obsolescenceSpiralContext(demographics.ageGroup),
      meaningLabel: "What this means for you:",
      meaningParagraphs: [
        "You're facing a double-threat: overwhelmed by current workload, and simultaneously concerned that the AI tools you're struggling to adopt will eventually replace you.",
        "When extreme workload combines with job insecurity, Conservation of Resources theory describes this as a \"loss spiral\" — you're spending so much cognitive energy surviving your daily tickets that there's little bandwidth left to upskill and secure your future value.",
      ],
      pivot,
    };
  }

  if (!technostressHigh && aiAnxietyHigh) {
    return {
      id: "existential-wait",
      archetypeName: "The Existential Wait",
      heading: "Your Stress Profile: The Existential Wait",
      contextLabel: "The context of your environment:",
      contextText: existentialWaitContext(demographics.orgType),
      meaningLabel: "What this means for you:",
      meaningParagraphs: [
        "Your day-to-day workload is genuinely manageable — but you're carrying a real cognitive burden about the future relevance of your skills as AI automates core technical tasks.",
        "That's a different kind of weight than overload: quieter, but no less real, since there's no ticket queue to clear that makes it go away.",
      ],
      pivot:
        "A quiet weight is still a weight. Next, let's measure your Occupational Self-Efficacy to see whether your confidence in your own skills matches how manageable your day-to-day actually feels.",
    };
  }

  return {
    id: "shielded-operator",
    archetypeName: "The Shielded Operator",
    heading: "Your Stress Profile: The Shielded Operator",
    contextLabel: "The context of your environment:",
    contextText:
      "Right now, both the pace of change around you and your read on AI's impact on your career are registering as manageable — a genuinely valuable combination, and rarer in this industry than you might expect.",
    meaningLabel: "What this means for you:",
    meaningParagraphs: [
      "You're operating in a low-friction environment. The structural demands on you are reasonable, and you feel secure in your role alongside AI.",
      "Worth noting what's actually working here — it's easier to protect a good setup than to rebuild one once it slips.",
    ],
    pivot:
      "Low pressure and high confidence usually travel together — but not always. Next, let's measure your Occupational Self-Efficacy and see whether your belief in your own abilities matches how little this pressure is getting to you.",
  };
}

// --- 4. Confidence Profile → pivots into the Full Combined Report -------------
//
// Maps Occupational Self-Efficacy against the Total Stress (Technostress + AI Anxiety)
// uncovered in the previous report — this reveals whether the participant is in a "Gain
// Spiral" (stress is generating mastery experiences) or a "Loss Spiral" (stress is eroding
// confidence), per Conservation of Resources theory. "Total Stress" reads High if either
// axis from the Stress report was High — matching how the Stress report itself treats them
// as two independent, either-can-dominate sources of strain rather than averaging them
// into one number.

const CONFIDENCE_ROW_COPY: Record<Band, string> = {
  High: "You possess exceptional confidence in your ability to solve technical problems and adapt to new systems.",
  Moderate: "You generally trust your ability to handle what's in front of you, though it isn't unshakeable yet.",
  Low: "Your belief in your own technical abilities is reading lower than your effort elsewhere would predict.",
};

/** Row insight for the single Occupational Self-Efficacy construct shown in this report. */
export function describeConfidenceRow(band: Band): RowInsight {
  return { id: "self-efficacy", emoji: POSITIVE_ROW_EMOJI[band], band, text: CONFIDENCE_ROW_COPY[band] };
}

export interface ConfidenceHook {
  id: "unbreakable-architect" | "depleted-expert" | "master-operator" | "competency-gap";
  archetypeName: string;
  heading: string;
  contextLabel: string;
  contextText: string;
  meaningLabel: string;
  meaningParagraphs: string[];
  pivot: string;
}

function depletedExpertContext(tier: ExperienceTier): string {
  if (tier === "newcomer") {
    return "Early in your career, self-efficacy is highly fragile, because you haven't yet accumulated enough historical \"wins\" to fall back on. When techno-complexity hits, it can feel like a personal failure rather than a normal part of the learning curve.";
  }
  if (tier === "veteran") {
    return "Even with years of experience behind you, a sustained high-pressure stretch can wear down confidence that was previously solid. That's not a reflection of your underlying skill — it's what chronic overload does to anyone.";
  }
  return "A few years in, you've built real skill, but maybe not yet enough varied experience to fall back on when several new pressures hit at once. That gap between skill and self-trust tends to close with more reps, not more effort.";
}

function unbreakableArchitectContext(tier: ExperienceTier): string {
  if (tier === "veteran") {
    return "With over a decade in the industry, your high self-efficacy acts as a massive anchor. You've survived multiple hype-cycles already, so your brain recognizes the current AI transition as just another cycle you can master, shielding you from panic.";
  }
  if (tier === "newcomer") {
    return "Building this kind of confidence this early in your career is a strong signal — you're generating real mastery experiences fast enough to outpace the pressure, which isn't the norm this early on.";
  }
  return "You've accumulated enough real wins by now that pressure reads as familiar territory rather than a threat — a pattern that tends to keep compounding from here.";
}

/**
 * demographics: experience personalizes Depleted Expert and Unbreakable Architect — the
 * same stress-vs-efficacy reading means something different for someone who hasn't
 * accumulated "wins" to fall back on yet vs. someone who's survived several tech cycles.
 * gritBand: the participant's own Grit reading, referenced only in the Unbreakable
 * Architect narrative (gated on it actually being High, so this report never claims a
 * strength the Grit report didn't actually find).
 */
export function chooseConfidenceHook(
  answers: Record<string, number>,
  demographics: Record<string, string>,
  gritBand: Band
): ConfidenceHook {
  const efficacyHigh = bandForModule("self-efficacy", answers) === "High";
  const stressHigh = bandForModule("technostress", answers) === "High" || bandForModule("ai-anxiety", answers) === "High";
  const experienceTier = experienceTierFor(demographics.experience);

  if (stressHigh && efficacyHigh) {
    const gritLine =
      gritBand === "High"
        ? "Instead of letting constant AI updates and tight deadlines defeat you, your high grit is pushing you to confront these challenges head-on."
        : "Instead of letting constant AI updates and tight deadlines defeat you, you're confronting these challenges head-on rather than avoiding them.";
    return {
      id: "unbreakable-architect",
      archetypeName: "The Unbreakable Architect",
      heading: "Your Mindset Profile: The Unbreakable Architect",
      contextLabel: "The context of your experience:",
      contextText: unbreakableArchitectContext(experienceTier),
      meaningLabel: "What this means for you:",
      meaningParagraphs: [
        `You're experiencing a psychological "Gain Spiral." ${gritLine} Every time you debug a complex system or master a new framework under pressure, it deposits a "mastery experience" into your psychological bank account.`,
        "The environment is throwing real friction at you, but your internal psychological armor is holding — and that armor is exactly what lets the rest of your profile keep compounding instead of eroding.",
      ],
      pivot:
        "You have the grit, you've faced the stress, and your confidence is holding strong. That's every piece of your profile mapped — your full report connects them, showing exactly how this psychological state has been driving your execution and collaboration.",
    };
  }

  if (stressHigh && !efficacyHigh) {
    return {
      id: "depleted-expert",
      archetypeName: "The Depleted Expert",
      heading: "Your Mindset Profile: The Depleted Expert",
      contextLabel: "The context of your experience:",
      contextText: depletedExpertContext(experienceTier),
      meaningLabel: "What this means for you:",
      meaningParagraphs: [
        "The structural demands are currently winning. The constant barrage of system changes and time pressure has begun to press on your core belief in your technical capabilities.",
        "Conservation of Resources theory calls this a \"loss spiral\" — the same resources needed to rebuild confidence are exactly what the stress is depleting, which is why this tends not to resolve on its own without a deliberate change in load.",
      ],
      pivot:
        "That's every piece of your profile mapped. Your full report connects them — including how this dip in confidence is actually showing up in your execution and collaboration.",
    };
  }

  if (!stressHigh && efficacyHigh) {
    return {
      id: "master-operator",
      archetypeName: "The Master Operator",
      heading: "Your Mindset Profile: The Master Operator",
      contextLabel: "The context of your state:",
      contextText:
        "Low environmental friction combined with high self-belief is the state most engineers are chasing — and it doesn't happen by accident.",
      meaningLabel: "What this means for you:",
      meaningParagraphs: [
        "You're in something close to the optimal state of flow. The environmental friction around you is manageable, and your technical confidence is near its peak.",
        "This combination is genuinely rare in this industry — worth noticing what's working here specifically, so it's easier to protect if demands shift later.",
      ],
      pivot:
        "That's every piece of your profile mapped. Your full report connects them — showing exactly how this combination of low friction and high confidence has been translating into your actual output.",
    };
  }

  return {
    id: "competency-gap",
    archetypeName: "The Competency Gap",
    heading: "Your Mindset Profile: The Competency Gap",
    contextLabel: "The context of your state:",
    contextText:
      "A stable environment paired with real self-doubt is a specific, useful signal — the causes tend to be much narrower and more fixable than they feel in the moment.",
    meaningLabel: "What this means for you:",
    meaningParagraphs: [
      "Your work environment is relatively stable, but you're experiencing real self-doubt about your own capabilities.",
      "Because the structural pressure isn't unusually high, this more often points to a direct skill-gap in a specific area than to burnout — which is genuinely good news, since skill gaps are the most directly fixable pattern in this whole report.",
    ],
    pivot:
      "That's every piece of your profile mapped. Your full report connects them — including a closer look at where this specific gap is actually showing up in your day-to-day execution.",
  };
}
