// All participant-facing narrative copy for the unlocked profile reports lives here.
// Each report ends on a "pivot" — a hook into the profile that comes next: traits (Grit)
// → output (Technology & Team) → environment (Stress) → mindset (Confidence).
import {
  bandForModule,
  bandForScore,
  computeBandwidthSplit,
  computeCognitiveCurrency,
  computeCollaborationBalance,
  HIGH,
  tierForRange,
  type Band,
  type BandwidthSplit,
  type CognitiveCurrencyReading,
  type CollaborationBalanceReading,
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
    const tier = tierForRange(f.yourScore, f.referenceRange);
    return { id: f.id, label: f.label, meaning: copy.meaning, tier, description: copy.tiers[tier] };
  });
}

/**
 * Plain factual statement of the overall (all-4-facet-average) grit score — no tier
 * judgment. The numbers already speak for themselves, and each facet gets its own graded
 * interpretation below this; this line shouldn't editorialize on top of that.
 */
export function overallGritSummary(): string {
  return "Across all four dimensions, here's your overall grit score:";
}

export interface GritHook {
  heading: string;
  stat: string;
  pivot: string;
  /** Full MDGS facet breakdown (your score vs. typical range). */
  facets: GritFacetScore[];
  /** Graded, plain-language interpretation of every facet — not just the highest one. */
  facetDescriptions: GritFacetDescription[];
}

/**
 * facets: the participant's real MDGS facet breakdown (see computeGritFacetBreakdown in
 * scoring.ts), sorted by the participant's own score, highest first. Each facet also
 * carries a fixed reference range (GRIT_FACET_REFERENCE_RANGE in scoring.ts) sourced from
 * the validated MDGS norms for this exact instrument, shown to participants as an
 * unattributed "typical score" range — never cited by name in the UI. No live peer/cohort
 * comparison here.
 *
 * "Highest of your own four facets" is not the same as "above average" — someone's top
 * facet can still sit below the typical range (see facetDescriptions, which grades each
 * facet against its own reference range rather than against the participant's other
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

export interface DiagnosticRatio {
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
  /** Task vs. Contextual Performance as a comparative split — "52% Execution / 48% Collaboration." */
  bandwidthSplit: BandwidthSplit;
  /** The Organizational Citizenship Ratio (Contextual / Task), graded against named bands. */
  collaborationBalance: CollaborationBalanceReading & DiagnosticRatio;
  /** TP4 ("keep my knowledge up-to-date") read against the rest of Task Performance. */
  cognitiveCurrency: CognitiveCurrencyReading & DiagnosticRatio;
  /** A demographic-specific read of the diagnostic ratios above — only shown when one genuinely applies. */
  careerStageDiagnostic?: DiagnosticRatio;
  /** A single, concrete operational adjustment to try before moving on. */
  tuningParameter: string;
}

type RoleGroup = "ic" | "leader";
type ExperienceTier = "newcomer" | "mid" | "veteran";

// Engineers intuitively parse ratio/multiplier framing over an abstract "score," so both
// diagnostic ratios below are phrased that way — what the number is doing, not how good it is.

const COLLABORATION_BALANCE_COPY: Record<CollaborationBalanceReading["band"], { label: string; text: string }> = {
  "altruism-tax": {
    label: "Altruism Tax",
    text: "You're generating disproportionate social capital for your team relative to your own ticket velocity — genuinely valuable, but worth watching for citizenship fatigue if individual output is what gets formally evaluated.",
  },
  "leaning-collaborative": {
    label: "Leaning Collaborative",
    text: "You're putting somewhat more energy into team-facing work than into your own execution right now — a reasonable lean, worth keeping an eye on if it keeps drifting further.",
  },
  balanced: {
    label: "Balanced",
    text: "Your execution and team-facing effort are running close to evenly matched — right around where balanced engineers in this field typically land.",
  },
  "leaning-execution": {
    label: "Leaning Execution",
    text: "You're putting somewhat more energy into your own execution than into team-facing work right now — a reasonable lean, worth watching if it keeps drifting further.",
  },
  "siloed-focus": {
    label: "Siloed Focus Mode",
    text: "You run clean, low-friction execution loops focused on your own tickets — strong independent output, but you may be under-leveraging your influence on team or architectural decisions.",
  },
};

function describeCollaborationBalance(reading: CollaborationBalanceReading): CollaborationBalanceReading & DiagnosticRatio {
  return { ...reading, ...COLLABORATION_BALANCE_COPY[reading.band] };
}

/**
 * Cognitive Currency (TP4 alone) read against Execution Proficiency (the other four Task
 * Performance items) — the "Knowledge-Execution Delta." A whole-module Task Performance
 * average hides exactly this: someone can hit every delivery milestone while continuous
 * learning quietly stalls under load, or the reverse.
 */
function describeCognitiveCurrency(reading: CognitiveCurrencyReading): CognitiveCurrencyReading & DiagnosticRatio {
  const currencyHigh = bandForScore(reading.currency, 5) === "High";
  const executionHigh = bandForScore(reading.executionProficiency, 5) === "High";
  let text: string;
  if (currencyHigh && executionHigh) {
    text = "High active knowledge renewal despite a heavy execution load — you're keeping your skills current at the same time you're shipping.";
  } else if (currencyHigh && !executionHigh) {
    text = "You're prioritizing continuous learning even while pacing your delivery output — a deliberate investment in future capability.";
  } else if (!currencyHigh && executionHigh) {
    text = "Your knowledge renewal isn't keeping pace with your strong delivery output — a common trade-off under heavy load, worth deliberately protecting time for later so it doesn't compound.";
  } else {
    text = "Both delivery output and knowledge renewal are reading below your peak right now — consistent with a broader pacing pattern rather than a learning-specific gap.";
  }
  return { ...reading, label: "Cognitive Currency", text };
}

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

/**
 * Mixes the two diagnostic ratios with role, tenure, and org type — but only surfaces a
 * line when one of these specific, research-grounded scenarios genuinely applies (Salgado &
 * Cabal 2011; Campbell 1990 on architect/lead role expectations; Igbaria & Siegel 1992;
 * Sethi et al. 1999 on tenure-based friction), checked in priority order. Falls through to
 * undefined — no generic filler paragraph — when nothing specific is actually true, so this
 * never repeats what the archetype's own context/meaning copy already said.
 */
function careerStageDiagnostic(
  roleGroup: RoleGroup,
  experienceTier: ExperienceTier,
  demographics: Record<string, string>,
  taskHigh: boolean,
  contextualHigh: boolean,
  contextualRaw: number
): DiagnosticRatio | undefined {
  if (roleGroup === "leader" && taskHigh && !contextualHigh) {
    return {
      label: "What this means at your career stage:",
      text: "In senior architectural and leadership roles, technical coordination and mentoring are structurally expected parts of the job. A dip in team collaboration here rarely reflects a lack of willingness — it usually means unplanned production fires or architectural complexity are pulling you into manually intervening in the codebase, rather than staying at the strategic-alignment level the role calls for.",
    };
  }

  if (experienceTier === "veteran" && contextualRaw > 4.2) {
    return {
      label: "What this means at your career stage:",
      text: "With over a decade of experience and this much active investment in team-facing work, you're operating as a primary knowledge transmitter for your team — the kind of institutional mentorship that measurably reduces onboarding time for newer hires.",
    };
  }

  if (experienceTier === "newcomer" && contextualHigh && !taskHigh) {
    return {
      label: "What this means at your career stage:",
      text: "Early in a career, taking on a lot of informal coordination before core technical mastery is fully solid tends to create steeper learning-curve friction later. Worth deliberately protecting more heads-down time for foundational skill-building alongside the collaboration.",
    };
  }

  if (demographics.orgType === "Service Industry" && contextualHigh) {
    return {
      label: "What this means in your organization:",
      text: "In service-delivery organizations, this level of contextual effort is typically voluntary, unbilled investment — genuinely valuable to your team, but a pattern that frequently drives burnout precisely because it isn't the work that gets formally measured.",
    };
  }

  if (demographics.orgType === "Product" && taskHigh && contextualHigh) {
    return {
      label: "What this means in your organization:",
      text: "In product engineering, balancing change-implementation work with code accuracy is exactly what keeps technical debt under control — this combination is your organization's version of doing the job well.",
    };
  }

  return undefined;
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

function conservationModeCopy(tier: ExperienceTier, roleGroup: RoleGroup): ArchetypeCopy {
  if (tier === "newcomer") {
    return {
      contextText:
        "With a few years in production environments, you've already built real technical capacity — a pullback like this usually isn't a skills gap.",
      meaningParagraphs: [
        "With a few years in production environments, entering Conservation Mode usually indicates boundary defense against creeping ticket scope — protecting your bandwidth from work that's expanded past what was originally agreed.",
        "Worth naming explicitly to yourself, or your manager, what's actually been added to your plate recently, so the boundary stays a deliberate choice rather than something that erodes quietly over time.",
      ],
    };
  }
  if (tier === "veteran" && roleGroup === "leader") {
    return {
      contextText:
        "With over a decade in the industry and in a leadership role, you've almost certainly seen this pattern before — in yourself and in the people you've mentored.",
      meaningParagraphs: [
        "For senior leaders, pulling back into tactical conservation often signals systemic fatigue from ongoing architectural churn, or from time spent unblocking junior team members — not a dip in capability.",
        "Worth checking whether that support load has quietly become unsustainable. The fix here is usually structural — delegation, clearer ownership — rather than more personal effort.",
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

// A single, concrete operational adjustment per archetype — a "tuning parameter" to try
// before moving on, not another interpretation of the score.
const TUNING_PARAMETER: Record<EnergyAllocationHook["id"], string> = {
  "dual-core":
    "Pick one day this week to go fully async — no live meetings. Running two demanding threads at once needs at least one day where neither gets interrupted by the other.",
  "deep-work-specialist":
    "Timebox one 30-minute, low-stakes check-in with a teammate this week. It keeps the collaborative thread from going fully dormant without costing your focus time.",
  "ecosystem-enabler":
    "Before your calendar fills up this week, block one 90-minute session for independent build time — protect at least one slice of uninterrupted execution.",
  "conservation-mode":
    "Audit your calendar for one recurring, low-yield sync meeting this sprint and decline or delegate it. Protect that block exclusively for undisturbed execution or mental recovery.",
};

/**
 * Fires after Contextual Performance, which always follows Task Performance in the fixed
 * module order, so both are guaranteed answered by then. A simple 2x2 on Task Performance
 * x Contextual Performance (each read against the same HIGH threshold used everywhere
 * else in this file) picks one of four non-judgmental archetypes, then role (for the three
 * archetypes with a clear expectation to compare against) or tenure + role (for
 * Conservation Mode, where the same low-low reading means something very different for a
 * newcomer vs. a veteran individual contributor vs. a veteran leader) personalizes the
 * narrative. Demographics are always complete by this point — they're required before any
 * Likert module is reachable — so role/experience are real, not guessed.
 *
 * bandwidthSplit/collaborationBalance/cognitiveCurrency are computed once, off the raw 1-5
 * means and item scores (not the pct-of-5 banding used for archetype selection) — engineers
 * read a "52/48 split" or a named ratio band as an operational fact about where energy is
 * going, independent of which archetype that split happens to land in.
 */
export function chooseEnergyAllocationHook(
  answers: Record<string, number>,
  demographics: Record<string, string>
): EnergyAllocationHook {
  const taskRaw = meanOf(TASK_PERFORMANCE_ITEMS, answers);
  const contextualRaw = meanOf(CONTEXTUAL_PERFORMANCE_ITEMS, answers);
  const taskPerformance = pctOf5(taskRaw);
  const contextualPerformance = pctOf5(contextualRaw);
  const taskHigh = taskPerformance >= HIGH;
  const contextualHigh = contextualPerformance >= HIGH;

  const bandwidthSplit = computeBandwidthSplit(taskRaw, contextualRaw);
  const collaborationBalance = describeCollaborationBalance(computeCollaborationBalance(taskRaw, contextualRaw));
  const cognitiveCurrency = describeCognitiveCurrency(computeCognitiveCurrency(answers));

  const role = demographics.role || "professional";
  const roleGroup = roleGroupFor(demographics.role);
  const experienceTier = experienceTierFor(demographics.experience);
  const careerStage = careerStageDiagnostic(roleGroup, experienceTier, demographics, taskHigh, contextualHigh, contextualRaw);

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
        "Running two demanding threads at once takes fuel. The question is what's powering it, and whether that pace is sustainable. In the next module, we evaluate Techno-Overload and AI Anxiety to see what's behind the intensity.",
      rowInsights,
      bandwidthSplit,
      collaborationBalance,
      cognitiveCurrency,
      careerStageDiagnostic: careerStage,
      tuningParameter: TUNING_PARAMETER["dual-core"],
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
        "Protecting deep-work time this well isn't free — something has to be absorbing the rest of the noise around you. In the next module, we evaluate Techno-Overload and AI Anxiety to see what that's costing you.",
      rowInsights,
      bandwidthSplit,
      collaborationBalance,
      cognitiveCurrency,
      careerStageDiagnostic: careerStage,
      tuningParameter: TUNING_PARAMETER["deep-work-specialist"],
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
        "Being the team's glue takes real energy — the question is where that energy is coming from. In the next module, we evaluate Techno-Overload and AI Anxiety to see what's underneath this pattern.",
      rowInsights,
      bandwidthSplit,
      collaborationBalance,
      cognitiveCurrency,
      careerStageDiagnostic: careerStage,
      tuningParameter: TUNING_PARAMETER["ecosystem-enabler"],
    };
  }

  const copy = conservationModeCopy(experienceTier, roleGroup);
  const meaningLabel =
    experienceTier === "newcomer"
      ? "What this means early in your career:"
      : experienceTier === "veteran"
        ? roleGroup === "leader"
          ? "What this means as a senior leader:"
          : "What this means as a veteran engineer:"
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
      "Pacing your output is a defensive adaptation. The question is what environmental drag is forcing you to conserve. In the next module, we evaluate Techno-Overload and AI Anxiety to identify the source of the friction.",
    rowInsights,
    bandwidthSplit,
    collaborationBalance,
    cognitiveCurrency,
    careerStageDiagnostic: careerStage,
    tuningParameter: TUNING_PARAMETER["conservation-mode"],
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

// --- 5. Full Combined Report — cross-construct archetype ------------------
//
// The final /results report synthesizes Grit + Occupational Self-Efficacy + Technostress
// into one cross-construct archetype — the "so what does this all add up to" read. Efficacy
// and Technostress are collapsed to a binary High/not-High split (this framework is
// genuinely a 2x2 — environment demand × internal confidence); Grit stays at full 3-band
// resolution because it's the one real fork inside the "high demand, low confidence"
// quadrant: sheer-force coping (high grit) is a materially different story from genuine
// risk (not), even though both start from the same environment+confidence reading. Every
// branch only ever restates what bandForModule already found for that participant — this
// can't credit or flag anything their own tier reports didn't already surface.

export interface OverallArchetypeHook {
  id: "resilient-innovator" | "overwhelmed-crusader" | "at-risk-friction" | "competent-maintainer" | "steady-starter";
  name: string;
  summary: string;
  impact: string;
  recommendation: string;
}

export function chooseOverallArchetype(gritBand: Band, efficacyBand: Band, technostressBand: Band): OverallArchetypeHook {
  const efficacyHigh = efficacyBand === "High";
  const technostressHigh = technostressBand === "High";
  const gritHigh = gritBand === "High";

  if (technostressHigh && efficacyHigh) {
    return {
      id: "resilient-innovator",
      name: "The Resilient Innovator",
      summary:
        "You have the internal grit and technical confidence to appraise the demands on you as challenges worth solving, rather than threats to withstand.",
      impact:
        "That combination tends to show up as strong, dependable output on your day-to-day work, and a real willingness to take on the messier, cross-team problems other people route around.",
      recommendation:
        "Channel it into mentoring a peer through a tool you've already mastered, or lead one process improvement — but keep half an eye on your own reserves, since even well-resourced people can run themselves down quietly under sustained load.",
    };
  }

  if (technostressHigh && !efficacyHigh && gritHigh) {
    return {
      id: "overwhelmed-crusader",
      name: "The Overwhelmed Crusader",
      summary:
        "You're bringing real determination to a genuinely demanding environment, but your confidence in the tools themselves hasn't caught up yet — so you're getting to results through sheer persistence rather than smooth, efficient execution.",
      impact:
        "That usually still produces solid output, but at a real cost — brute-forcing your way through unfamiliar tools takes far more out of you than working from confidence would.",
      recommendation:
        "Targeted, hands-on practice with whichever specific tool feels least familiar will close this gap faster than more hours of grinding through it solo.",
    };
  }

  if (technostressHigh && !efficacyHigh && !gritHigh) {
    return {
      id: "at-risk-friction",
      name: "The At-Risk / High-Friction State",
      summary:
        "Right now, a demanding environment is meeting genuinely low reserves on both fronts — persistence and technical confidence — which is the combination most likely to make day-to-day work feel like a constant uphill push.",
      impact:
        "This is the pattern most worth addressing directly: it's the one most associated with real drops in output and with quietly disengaging rather than asking for help.",
      recommendation:
        "Break the single biggest source of friction into the smallest possible next step, and protect a hard boundary around after-hours technology demands while you rebuild some margin.",
    };
  }

  if (!technostressHigh && efficacyHigh) {
    return {
      id: "competent-maintainer",
      name: "The Competent Maintainer",
      summary:
        "Your current environment isn't placing much strain on you, and you feel genuinely capable of what it does ask of you — a stable, low-friction position to operate from.",
      impact:
        "That tends to produce steady, reliable output. The risk here isn't burnout — it's a plateau, since there's little in your day-to-day forcing new growth.",
      recommendation:
        "Deliberately volunteer for one cross-functional project or an emerging tool outside your current lane — you have the bandwidth to stretch on your own terms, rather than only in reaction to pressure.",
    };
  }

  return {
    id: "steady-starter",
    name: "The Steady Starter",
    summary:
      "Your environment isn't currently demanding much of you technologically, and your confidence in these tools hasn't been tested much yet either — a perfectly ordinary place to be, not a warning sign.",
    impact:
      "Because the pressure is low, there's little right now forcing either your output or your confidence to move — this reads as a quiet stretch, not a risk.",
    recommendation:
      "Use the calm deliberately: build hands-on fluency with one tool now, on your own schedule, so you're not building it for the first time once real pressure actually shows up.",
  };
}

// Tailored, always-actionable micro-steps keyed to whichever specific driver is highest —
// deliberately actions, not score interpretations, so there's no tension with the
// always-positive framing used for the score descriptions elsewhere in the report.
const TECHNOSTRESS_ACTION: Record<string, string> = {
  Overload: "Timebox one recurring source of digital overload this week — batch notifications into set windows instead of reacting to each one as it lands.",
  Complexity: "Pick one tool you're currently working around rather than confidently using, and block 30 focused minutes of hands-on practice with it — not documentation, actual use.",
  Uncertainty: "Ask your team directly what's actually changing in the next sprint or two — concrete answers tend to shrink uncertainty faster than waiting it out does.",
};

/** id: "Overload" | "Complexity" | "Uncertainty" — the highest-scoring Technostress subsection. */
export function technostressAction(id: string): string {
  return TECHNOSTRESS_ACTION[id] ?? TECHNOSTRESS_ACTION.Overload;
}

const EFFICACY_ACTION: Record<Band, string> = {
  Low: "Build confidence through small, hands-on wins — a structured sandbox tutorial will move the needle faster than reading documentation passively.",
  Moderate: "Pick one system or tool you're only partly confident in and go deep on it this month — moving it from workable to strong compounds quickly.",
  High: "Your confidence is a resource — put it to work by pairing with someone earlier in their journey on the exact tool you've already mastered.",
};

export function efficacyAction(band: Band): string {
  return EFFICACY_ACTION[band];
}

const GRIT_FACET_ACTION: Record<string, string> = {
  spiritedInitiative:
    "Your strongest asset under pressure is initiative — put it to visible use in sprint planning or retros, where speaking up early shapes outcomes for the whole team.",
  adaptability:
    "Your strongest asset is adjusting course quickly — volunteer to own the parts of a project most likely to change scope, since you'll adapt to shifts faster than most.",
  perseveranceOfEffort:
    "Your strongest asset is sustained effort — channel it into one meaningful stretch goal this quarter rather than spreading it thin across everything at once.",
  steadfastness:
    "Your strongest asset is staying the course through setbacks — that makes you the right person to own the work everyone else is tempted to abandon halfway through.",
};

/** id: the participant's single highest-scoring grit facet (facets[0].id from computeGritFacetBreakdown). */
export function gritFacetAction(id: string): string {
  return GRIT_FACET_ACTION[id] ?? GRIT_FACET_ACTION.perseveranceOfEffort;
}
