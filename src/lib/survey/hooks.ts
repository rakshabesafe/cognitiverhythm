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
  operationalBandForScore,
  selfEfficacyBandForScore,
  tierForRange,
  type Band,
  type BandwidthSplit,
  type CognitiveCurrencyReading,
  type CollaborationBalanceReading,
  type CounterweightReading,
  type EfficacyDeliveryReading,
  type GritFacetScore,
  type OperationalBand,
  type PersistenceQualityReading,
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

interface GritFacetVariant {
  tagline?: string;
  meaning?: string;
  whyItMatters?: string;
  whyItMattersLabel?: string;
}

interface GritFacetCopy {
  /** Plain-language definition of what this dimension actually measures. */
  meaning: string;
  /** One always-positive interpretation per gradation, keyed against the reference score. */
  tiers: Record<ScoreTier, string>;
  /** Optional one-line framing of the dimension in engineering terms. */
  tagline?: string;
  /** Optional "why this matters in software specifically" — the operational consequence of the trait. */
  whyItMatters?: string;
  /**
   * Overrides for participants in a leadership role, where the same underlying trait is
   * tested by team, roadmap, and capacity decisions rather than by hands-on technical work.
   * Only the fields present here are swapped; the graded tier interpretations are shared,
   * since those are read against the same MDGS reference ranges regardless of role.
   */
  leader?: GritFacetVariant;
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
    tagline: "Your architectural pivot speed and learning agility.",
    meaning:
      "How quickly you recognize when an implementation isn't working, let go of dead ends, and alter your approach without losing momentum.",
    whyItMatters:
      "In production systems, brute-force perseverance often causes burnout and technical debt. High adaptability keeps your persistence intelligent — letting you pivot across framework churn, refactor failing designs, and turn PR feedback into cleaner system execution.",
    leader: {
      tagline: "Your operational flexibility and organizational recalibration speed.",
      meaning:
        "How effectively you pivot team direction, adjust project constraints, and navigate organizational uncertainty without compromising team morale or delivery stability.",
      whyItMattersLabel: "Why it matters for leaders",
      whyItMatters:
        "In high-velocity technology environments, rigid project management accelerates developer burnout and turnover. High managerial adaptability lets you act as an operational shock absorber — realigning roadmap priorities and shielding your squad's focus during periods of rapid change.",
    },
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
  tagline?: string;
  whyItMatters?: string;
  whyItMattersLabel?: string;
  /** Present only for facets with a role-calibrated operational read (currently Spirited Initiative and Perseverance of Effort). */
  operationalRead?: OperationalReading;
}

// Spirited Initiative and Perseverance of Effort's operational reads are role-specific in a
// way the other two facets aren't: the same score means something different depending on
// whether it shows up in debugging loops (engineer), a multi-quarter migration (architect),
// or shielding a team's delivery commitments (manager). This exact three-way split matches
// demographics.role's own options (Software Engineer / Designer/Architect / Manager), so it
// reads the field directly rather than reusing the coarser ic/leader grouping the other
// reports use.
type OperationalRole = "engineer" | "architect" | "manager";

function operationalRoleFor(role: string | undefined): OperationalRole {
  if (role === "Designer/Architect") return "architect";
  if (role === "Manager") return "manager";
  return "engineer";
}

export interface OperationalReading {
  band: OperationalBand;
  /** The named "operational state" for this role + band, e.g. "The Autonomous Vanguard". */
  title: string;
  interpretation: string;
  calibrationTip: string;
}

interface OperationalCopy {
  title: string;
  interpretation: string;
  calibrationTip: string;
}

type OperationalCopyTable = Record<OperationalRole, Record<OperationalBand, OperationalCopy>>;

// Every "very-low" entry stays genuinely honest about the operational state (that's the
// whole point of an operational read — naming what a trait looks like under real distress)
// while still framing the calibration tip as a concrete, achievable next step rather than a
// verdict — matching the house rule of never leaving a participant with nothing to do about
// a score.
const SPIRITED_INITIATIVE_COPY: OperationalCopyTable = {
  engineer: {
    "very-high": {
      title: "The Autonomous Vanguard",
      interpretation:
        "When a build pipeline fails or production throws an alert, you dive in immediately without waiting for a triage ticket. You regularly write developer tooling and automate repetitive team tasks on your own initiative.",
      calibrationTip:
        "Watch for \"rogue refactoring\" — keep spontaneous code improvements aligned with your sprint commitments and the PR review process, so momentum doesn't outrun the team's ability to track it.",
    },
    high: {
      title: "The Proactive Problem-Solver",
      interpretation:
        "You maintain strong technical ownership. When roadblocks arise, you explore root causes independently and propose concrete fixes rather than just escalating the bug.",
      calibrationTip:
        "Keep this rhythm going — it's the behavior that most reliably accelerates a move into senior and lead engineering roles.",
    },
    medium: {
      title: "The Balanced Responder",
      interpretation:
        "You handle unexpected problems within your own features capably, but you rarely volunteer to troubleshoot issues outside your assigned sprint backlog.",
      calibrationTip:
        "Look for a low-risk way to expand your ownership — picking up an unassigned flaky test or refining shared documentation is an easy first step.",
    },
    low: {
      title: "The Structured Executor",
      interpretation:
        "You operate strictly by the spec. When you hit architectural ambiguity or an unexpected test failure, your instinct is to pause and wait for guidance or an explicit ticket.",
      calibrationTip:
        "If you're hesitating because you're worried about breaking shared code, try writing an isolated reproduction test to validate your hypothesis before asking for help — it de-risks the exploration.",
    },
    "very-low": {
      title: "The Dormant / Detached Executor",
      interpretation:
        "Unexpected roadblocks or incidents tend to cause a noticeable freeze or disengagement — you rarely touch unassigned code, and rapid change can feel overwhelming.",
      calibrationTip:
        "This far more often signals high Techno-Complexity or cognitive depletion than a skills gap. Breaking an intimidating roadblock into one small, investigative experiment is usually the fastest way to rebuild momentum.",
    },
  },
  architect: {
    "very-high": {
      title: "The Emergent Innovator",
      interpretation:
        "You proactively build proofs-of-concept, stress-test next-generation approaches, and tackle systemic technical debt months before the business asks for it.",
      calibrationTip:
        "Guard against over-engineering — make sure exploratory prototypes are aimed at real, current constraints rather than speculative elegance.",
    },
    high: {
      title: "The Preemptive Stabilizer",
      interpretation:
        "You actively monitor system boundaries and write Architectural Decision Records to remove ambiguity before a migration starts.",
      calibrationTip:
        "This is the sweet spot for architectural leadership — it de-risks multi-quarter roadmaps without burying your teams in constant paradigm churn.",
    },
    medium: {
      title: "The Pragmatic Maintainer",
      interpretation:
        "You address architectural bottlenecks and refactor once they're proven pain points, but you rarely initiate exploratory work on emerging platforms ahead of need.",
      calibrationTip:
        "Protecting a small, regular slice of your time for prototyping new tooling keeps technical debt from accumulating unchecked.",
    },
    low: {
      title: "The Reactive Governance Lead",
      interpretation:
        "You function mainly as an approver or reviewer rather than a driver — evaluating RFCs as they're submitted, but rarely initiating a redesign or resolving architectural ambiguity yourself.",
      calibrationTip:
        "Reactive architecture tends to push developers into siloed decisions of their own. Naming the trade-offs yourself, rather than waiting for friction to escalate, closes that gap.",
    },
    "very-low": {
      title: "The Inertial Architect",
      interpretation:
        "Deep systemic friction has built into architectural inertia — disputed system boundaries and complex cross-service dependencies go unaddressed, and technical entropy spreads.",
      calibrationTip:
        "This usually reflects burnout from sustained organizational bureaucracy rather than a lack of ability. Picking one small, contained subsystem for an isolated pilot is a realistic way to break the stalemate.",
    },
  },
  manager: {
    "very-high": {
      title: "The Transformational Champion",
      interpretation:
        "You vigorously clear cross-functional roadblocks, push back on unrealistic timelines, and proactively negotiate dedicated platform-health time with product leadership.",
      calibrationTip:
        "Keep your initiative aimed at organizational unblocking rather than dictating tactical implementation — that's what protects your team's own autonomy.",
    },
    high: {
      title: "The Strategic Unblocker",
      interpretation:
        "You spot inter-team dependency delays weeks ahead of launch, de-escalating team stress during crunch while keeping delivery priorities clear.",
      calibrationTip:
        "Keep cultivating this posture — it's what gives engineering teams the psychological safety to sustain high execution velocity.",
    },
    medium: {
      title: "The Process Coordinator",
      interpretation:
        "You run standard ceremonies, track sprint metrics, and resolve blockers once they're flagged in standup, but rarely push for proactive organizational change.",
      calibrationTip:
        "Shifting from reactive issue-tracking to looking two sprints ahead for third-party and API dependencies is a concrete way to get ahead of the next blocker.",
    },
    low: {
      title: "The Administrative Gatekeeper",
      interpretation:
        "You lean heavily on formal reporting and escalation channels. When cross-team conflict comes up, you tend to defer to top-down direction rather than stepping in directly.",
      calibrationTip:
        "Over-reliance on formal escalation slows delivery down. Taking on one difficult stakeholder conversation directly protects your team's focus more than routing it upward would.",
    },
    "very-low": {
      title: "The Passive Conduit",
      interpretation:
        "Under organizational stress or unclear authority, you've settled into passing client and executive pressure straight down to the team without filtering it.",
      calibrationTip:
        "This is a real signal of leadership strain, not a personal failing. Naming the actual operational blocker to your own leadership and asking for cover is the fastest way to regain room to maneuver.",
    },
  },
};

const PERSEVERANCE_COPY: OperationalCopyTable = {
  engineer: {
    "very-high": {
      title: "The Relentless Finisher",
      interpretation:
        "You see hard debugging loops, tricky concurrency bugs, and edge-case testing through to production readiness without abandoning the task — you don't leave features at the \"half-done proof-of-concept\" stage.",
      calibrationTip:
        "Watch for the sunk-cost trap: if a dependency or algorithmic path is clearly failing after hours of effort, a smart pivot (see your Adaptability score) usually yields more than stubborn grinding.",
    },
    high: {
      title: "The Steady Finisher",
      interpretation:
        "You have solid, reliable follow-through — you push past initial syntax friction and environment setup hurdles to deliver stable, well-tested code.",
      calibrationTip:
        "This is the optimal zone for individual contributors — dependable velocity without the burnout risk that comes with obsessive over-commitment.",
    },
    medium: {
      title: "The Pragmatic Finisher",
      interpretation:
        "You persevere well when tasks are clearly defined and milestones are tangible. When an obscure bug or a failing pipeline drags on without clear progress, though, your stamina starts to taper.",
      calibrationTip:
        "When you hit a prolonged roadblock, slice it into smaller, measurable sub-tasks — quick, visible wins tend to replenish stamina faster than grinding on the whole problem at once.",
    },
    low: {
      title: "The Sprint Explorer",
      interpretation:
        "You thrive in early-stage ideation, spiking solutions, and quick prototypes, but your energy drops noticeably during repetitive debugging, test coverage, and documentation work.",
      calibrationTip:
        "Pairing with a detail-oriented teammate for cleanup sprints, or working in strict short focus intervals, tends to carry mundane delivery work over the finish line without draining you.",
    },
    "very-low": {
      title: "The Fragmented Executor",
      interpretation:
        "Sustaining energy on projects that span multiple sprints is genuinely difficult — obstacles often lead to a stalled pull request or attention shifting to a different, less demanding task.",
      calibrationTip:
        "This usually points to cognitive fatigue or too much context-switching rather than a lack of capability. Cutting your active work-in-progress down to a single ticket at a time is the fastest way to rebuild follow-through.",
    },
  },
  architect: {
    "very-high": {
      title: "The Tenacious Custodian",
      interpretation:
        "You have the stamina to shepherd multi-quarter migrations, domain-driven refactoring, and enterprise architectural standards through, even as priorities shift underneath them.",
      calibrationTip:
        "Watch for \"ivory tower\" dogmatism — check that you're not stubbornly defending an idealized design the development teams find impractical to actually build.",
    },
    high: {
      title: "The Structural Anchor",
      interpretation:
        "You maintain strong technical focus, making sure non-functional requirements — latency, security, scalability — aren't quietly bargained away during a crunch.",
      calibrationTip:
        "This level is the right balance of structural discipline and pragmatism for sustaining a technical roadmap over the long horizon.",
    },
    medium: {
      title: "The Flexible Architect",
      interpretation:
        "You advocate for sound design patterns, but under sustained pressure from product timelines you'll often concede compromises and take on technical debt.",
      calibrationTip:
        "When you do make a compromise, log an ADR and a tech-debt repayment ticket in the same moment — it keeps the long-term design intent from getting permanently lost.",
    },
    low: {
      title: "The Conceptual Designer",
      interpretation:
        "You produce strong initial conceptual blueprints and system sketches, but staying embedded through the operational rollout is harder to sustain, which can leave room for implementation drift.",
      calibrationTip:
        "Partnering closely with a senior developer who enjoys execution governance helps make sure your architectural vision actually lands in production code.",
    },
    "very-low": {
      title: "The Compromised Architect",
      interpretation:
        "Sustained organizational friction and conflicting requirements have worn down your appetite to defend the architecture, so teams end up building ad-hoc solutions without systemic guidance.",
      calibrationTip:
        "This points to structural fatigue rather than a lack of vision. Reclaiming agency over one critical interface or system boundary — and firmly establishing standards there first — is a realistic place to start.",
    },
  },
  manager: {
    "very-high": {
      title: "The Indomitable Driver",
      interpretation:
        "You relentlessly shield your team's long-term commitments, working to clear cross-team friction and push critical deliverables across the line.",
      calibrationTip:
        "Don't project your own endurance threshold onto your squad — relentless drive without built-in recovery time for the team is a fast path to attrition.",
    },
    high: {
      title: "The Resilient Lead",
      interpretation:
        "You reliably navigate your team through high-pressure sprints, restructuring, and delivery crunches, keeping organizational focus without panic.",
      calibrationTip:
        "Keep this steady tempo — it's what gives your team the psychological safety and stability to sustain predictable velocity.",
    },
    medium: {
      title: "The Adaptive Coordinator",
      interpretation:
        "You maintain steady operational follow-through during standard cycles, but when a project runs into prolonged resistance or complex cross-functional blocks, your momentum starts to slow.",
      calibrationTip:
        "Escalating cross-team dependency blockers earlier — rather than absorbing the friction quietly — tends to keep momentum from stalling out.",
    },
    low: {
      title: "The Reactive Manager",
      interpretation:
        "Multi-sprint strategic initiatives — team tooling, tech-debt cleanup — tend to slide in favor of whatever is making the most immediate noise.",
      calibrationTip:
        "Blocking out a recurring weekly \"operational health\" review protects strategic backlog items from being fully swallowed by daily firefighting.",
    },
    "very-low": {
      title: "The Depleted Lead",
      interpretation:
        "Recurring roadblocks and shifting directives have left you running on empty, which shows up as passive oversight — milestones slip with little active intervention.",
      calibrationTip:
        "This is a classic sign of organizational burnout, not a personal shortfall. Stepping back to audit your team's commitments and renegotiating realistic delivery dates with your own leadership is the direct fix.",
    },
  },
};

const STEADFASTNESS_COPY: OperationalCopyTable = {
  engineer: {
    "very-high": {
      title: "The Unyielding Builder",
      interpretation:
        "Critical pull-request rejections, failed sprint demos, or an abandoned feature branch don't shake your sense of competence — you read setbacks as a standard feedback loop, not a personal failure.",
      calibrationTip:
        "Watch for the flip side of staying this unshaken — make sure it doesn't stop valid technical feedback from actually landing and changing your approach.",
    },
    high: {
      title: "The Resilient Coder",
      interpretation:
        "When a production deploy breaks or a favorite implementation gets scrapped by a scope change, you absorb the disappointment quickly and redirect your energy into the new path.",
      calibrationTip:
        "This is an optimal engineering state — it gives you staying power through high-pressure releases without calcifying into stubborn rigidity.",
    },
    medium: {
      title: "The Grounded Executor",
      interpretation:
        "You handle everyday bugs and routine code review comments well, but a severe regression or having weeks of work deprioritized causes a noticeable, temporary dip in morale.",
      calibrationTip:
        "Anchoring your sense of progress to engineering fundamentals — what you actually learned or built — rather than whether one specific PR ships tends to steady that dip faster.",
    },
    low: {
      title: "The Sensitive Developer",
      interpretation:
        "A harsh code review, a failed interview, or a production bug can leave a lingering emotional toll, showing up as hesitation and risk-aversion on the tasks that follow.",
      calibrationTip:
        "Treating a critique as an objective read on system constraints, rather than a read on you, is the mental move that tends to shorten that lingering effect.",
    },
    "very-low": {
      title: "The Defeated Contributor",
      interpretation:
        "Technical adversity can feel overwhelming — a single major deployment failure or an architectural rejection is enough to trigger real demotivation and withdrawal.",
      calibrationTip:
        "This is a sign of psychological depletion, not a capability gap. Working with your lead to take on smaller, more predictable tasks for a stretch is a realistic way to rebuild a sense of safety.",
    },
  },
  architect: {
    "very-high": {
      title: "The Indomitable Visionary",
      interpretation:
        "You hold unwavering conviction in your system principles — when executive sponsors push back or a delivery squad resists a modernization roadmap, you keep the vision steady.",
      calibrationTip:
        "Balance that steadfastness with stakeholder empathy — holding a vision too rigidly through a genuine business pivot can alienate the delivery teams who bear the cost of implementing it.",
    },
    high: {
      title: "The Pragmatic Anchor",
      interpretation:
        "You absorb conflicting organizational demands, a failed pilot, or a vendor deprecation with calm composure, recalibrating the technical strategy without losing sight of the core target.",
      calibrationTip:
        "This is the ideal tier for architects — it keeps the enterprise architecture stable across quarters while staying genuinely open to necessary trade-offs.",
    },
    medium: {
      title: "The Adaptive Lead",
      interpretation:
        "You stay steadfast when business leadership is aligned, but a prolonged governance battle or a string of architectural compromises can start to wear at your conviction.",
      calibrationTip:
        "Formalizing ADRs early keeps your design rationale on record and resilient, even as the political weather around it changes.",
    },
    low: {
      title: "The Conceding Architect",
      interpretation:
        "Continuous pushback from delivery squads and business stakeholders can lead you to compromise on system standards sooner than you'd like, leaving the design more fragmented than intended.",
      calibrationTip:
        "Building a core coalition of senior engineers to co-own and defend the architectural standards takes the weight off fighting every governance battle alone.",
    },
    "very-low": {
      title: "The Disillusioned Lead",
      interpretation:
        "Sustained technical debt, thin executive air cover, and repeated project cancellations have worn down your belief that architectural elegance is even reachable here.",
      calibrationTip:
        "This reflects real organizational fatigue, not a loss of vision. Narrowing your focus to stabilizing one critical boundary, rather than the whole legacy estate, is a realistic place to rebuild.",
    },
  },
  manager: {
    "very-high": {
      title: "The Bedrock Leader",
      interpretation:
        "You act as an unshakeable shield for your squad — missed quarterly targets, budget freezes, or sudden organizational churn get absorbed without projecting panic downward.",
      calibrationTip:
        "Make sure that emotional durability doesn't lead you to underestimate the genuine distress and exhaustion your team members feel at their own, lower thresholds.",
    },
    high: {
      title: "The Steady Captain",
      interpretation:
        "You navigate delivery road bumps, escalations, and tough client conversations with grounded resolve, keeping your squad's morale and direction cohesive.",
      calibrationTip:
        "This baseline is what gives an engineering pod the psychological containment it needs to maintain velocity through a crunch period.",
    },
    medium: {
      title: "The Contextual Lead",
      interpretation:
        "You keep your squad motivated through standard sprint pressure, but a compound crisis — a client escalation landing alongside key attrition — can shake your composure.",
      calibrationTip:
        "Leaning on peer delivery managers for operational support, so the escalation burden is shared, keeps acute adversity from turning into chronic fatigue.",
    },
    low: {
      title: "The Reactive Buffer",
      interpretation:
        "Rejection from leadership or client dissatisfaction can trigger acute anxiety, leading you to rapidly reshuffle team priorities in a way that disrupts developer flow.",
      calibrationTip:
        "A mandatory 24-hour buffer before an executive or client escalation gets passed down as an emergency sprint change gives you room to filter it first.",
    },
    "very-low": {
      title: "The Burned-Out Steward",
      interpretation:
        "Relentless delivery pressure and a lack of organizational control have worn down your belief that you can actually shape outcomes here — the external forces feel like they're winning.",
      calibrationTip:
        "This is acute leadership burnout. Seeking immediate managerial support to reset deliverables, reduce scope, and restore your own boundaries is the direct next step.",
    },
  },
};

/**
 * A role-calibrated read for an already-banded score — not a peer/reference comparison.
 * Takes the band rather than a raw score because different instruments (grit facets on a
 * 1-5 scale, Occupational Self-Efficacy on a 1-6 scale) have their own, independently
 * authored cutoffs; the banding itself happens in scoring.ts (operationalBandForScore,
 * selfEfficacyBandForScore) and this function only does the copy lookup.
 */
function describeOperationalRead(band: OperationalBand, role: string | undefined, table: OperationalCopyTable): OperationalReading {
  const copy = table[operationalRoleFor(role)][band];
  return { band, ...copy };
}

const OPERATIONAL_COPY_BY_FACET: Partial<Record<string, OperationalCopyTable>> = {
  spiritedInitiative: SPIRITED_INITIATIVE_COPY,
  perseveranceOfEffort: PERSEVERANCE_COPY,
  steadfastness: STEADFASTNESS_COPY,
};

/**
 * One graded, always-positive description per facet, in the same order as `facets`.
 * `role` is the participant's own demographics.role: Managers and Designer/Architects get
 * the leadership framing of a dimension where one exists, since their version of the trait
 * plays out through team and roadmap decisions rather than hands-on technical work. An
 * absent or unrecognized role falls back to the individual-contributor copy — that's the
 * general-purpose wording, so it's the safer default when role isn't known.
 */
export function describeGritFacets(facets: GritFacetScore[], role?: string): GritFacetDescription[] {
  const useLeaderCopy = role !== undefined && roleGroupFor(role) === "leader";
  return facets.map((f) => {
    const copy = GRIT_FACET_COPY[f.id];
    const variant = useLeaderCopy ? copy.leader : undefined;
    const tier = tierForRange(f.yourScore, f.referenceRange);
    const operationalTable = OPERATIONAL_COPY_BY_FACET[f.id];
    return {
      id: f.id,
      label: f.label,
      meaning: variant?.meaning ?? copy.meaning,
      tier,
      description: copy.tiers[tier],
      tagline: variant?.tagline ?? copy.tagline,
      whyItMatters: variant?.whyItMatters ?? copy.whyItMatters,
      whyItMattersLabel: variant?.whyItMattersLabel,
      operationalRead: operationalTable ? describeOperationalRead(operationalBandForScore(f.yourScore), role, operationalTable) : undefined,
    };
  });
}

// Adaptability read against Perseverance of Effort — whether persistence is being steered
// or applied flat-out. Grounded in the same critique that motivated the MDGS itself (Credé
// et al., 2017): effort alone predicts performance poorly in fast-changing domains, because
// rigid persistence on an approach that has stopped paying off is indistinguishable from
// effort right up until the deadline. Framed in delivery terms rather than trait terms, and
// every band names a genuine strength first — a high score on either facet is never a
// deficiency, only a different balance point.
const PERSISTENCE_QUALITY_COPY: Record<PersistenceQualityReading["band"], { label: string; text: string }> = {
  "deep-persistence": {
    label: "Deep Persistence",
    text: "Your persistence runs well ahead of your pivot speed — real staying power on the problems most people abandon. The one thing to watch is the sunk-cost trap: hours spent hammering a failing test or brute-forcing a dependency that stepping back would have re-routed in minutes. A deliberate checkpoint partway through long debugging sessions is usually all it takes to keep that persistence pointed at the goal rather than at the approach.",
  },
  "leaning-persistence": {
    label: "Leaning Persistence",
    text: "You lean slightly toward staying with an approach rather than changing it — dependable follow-through on problems that genuinely need time to yield. Adding one explicit \"is this still the right approach?\" checkpoint on long tasks is usually enough to keep that from tipping into sunk cost.",
  },
  "intelligent-persistence": {
    label: "Intelligent Persistence",
    text: "Your persistence and your pivot speed are closely matched. You stay with hard problems, but you re-route rather than brute-force when an approach stops paying off — which is where effort converts most efficiently into shipped work, and the balance point the whole construct is aiming at.",
  },
  "leaning-pivot": {
    label: "Leaning Pivot",
    text: "You lean slightly toward changing approach over staying with one — genuinely useful in a stack that churns, and it keeps you out of dead ends most people sit in far too long. Worth occasionally holding a line one iteration longer on the problems whose payoff is deep rather than quick.",
  },
  "fast-pivot": {
    label: "Fast Pivot",
    text: "Your pivot speed runs well ahead of your persistence — you adapt fast and rarely get stuck in dead ends, which is a real asset against framework churn and shifting requirements. The available upside is on the small number of problems that only yield to sustained depth: deliberately picking one or two a month to stay with longer tends to move this quickly.",
  },
};

/** The Adaptability ÷ Perseverance of Effort ratio, graded into a named band. */
export function describePersistenceQuality(reading: PersistenceQualityReading): PersistenceQualityReading & DiagnosticRatio {
  return { ...reading, ...PERSISTENCE_QUALITY_COPY[reading.band] };
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
export function chooseGritHook(facets: GritFacetScore[], role?: string): GritHook {
  const top = facets[0];
  const facetDescriptions = describeGritFacets(facets, role);

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

// A plain-language "what this actually measures" line for each stress dimension — shown
// above the score bar so the graded read below it (STRESS_ROW_COPY) has context. Without
// this, a participant sees "Uncertainty: 3.2 / 5" with no idea whether that's about their
// tools, their manager, or their job security.
const STRESS_DIMENSION_MEANING: Record<string, string> = {
  Overload: "How much technology forces you to work faster, longer, or juggle more than feels manageable.",
  Complexity: "How hard the technologies you're required to use are to learn and keep up with.",
  Uncertainty: "How often the tools, systems, and platforms around you change without warning.",
  "ai-anxiety": "How much you worry that AI will automate your role or make your current skills obsolete.",
};

/** id: "Overload" | "Complexity" | "Uncertainty" | "ai-anxiety" — a one-line definition of what this dimension measures. */
export function stressDimensionMeaning(id: string): string {
  return STRESS_DIMENSION_MEANING[id] ?? "";
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
  if (orgType === "Service Industry") {
    return "Operating in the global delivery model common to service-based IT companies inherently normalizes boundary-blurring and tight client SLAs. Your high techno-overload is a structural feature of your organization's business model, not a personal time-management failure.";
  }
  return "Whatever your organization's structure, your high techno-overload reads as a feature of how work is currently organized around you — not a personal time-management failure.";
}

function existentialWaitContext(orgType: string | undefined): string {
  if (orgType === "Product") {
    return "In product firms, the pressure isn't usually client hours — it's innovation velocity. Your anxiety likely stems from watching AI get integrated into your core product architecture, forcing a perpetual state of transition even while your day-to-day workload stays manageable.";
  }
  if (orgType === "Service Industry") {
    return "In service-delivery organizations, AI anxiety often centers less on today's ticket queue and more on how AI could reshape the billable-hours model itself — which explains why your day-to-day friction reads low while this concern persists.";
  }
  return "Your anxiety here isn't about today's workload — it's about a longer-term shift in how your kind of work gets done, which explains why your day-to-day friction reads low while this concern persists.";
}

function obsolescenceSpiralContext(ageGroup: string | undefined): string {
  if (ageGroup === "18 to 28") {
    return "As a younger engineer, you're facing a unique paradox: AI is automating the exact routine coding and testing tasks entry-level engineers typically use to build foundational mastery. Your anxiety is valid — the stepping stones of your career path are shifting under you.";
  }
  if (ageGroup === "36 and above") {
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

// Occupational Self-Efficacy's own role-calibrated operational read, alongside the row
// insight above — reuses the same OperationalReading/OperationalCopyTable shape the grit
// facets use, but against OSES-SF's own 1-6 scale (selfEfficacyBandForScore), since the
// cutoffs aren't shared with the 1-5 grit facets.
const SELF_EFFICACY_COPY: OperationalCopyTable = {
  engineer: {
    "very-high": {
      title: "The Unshakeable Master",
      interpretation:
        "You have supreme confidence in your technical execution — dropped into an undocumented legacy codebase or a brand-new AI stack, you know you'll untangle the problems and ship working code.",
      calibrationTip:
        "Watch for the blind spot that comes with this much confidence — it can make peer PR critiques or testing requirements easy to underweight. Treat review feedback as a second signal worth its own attention.",
    },
    high: {
      title: "The Resilient Achiever",
      interpretation:
        "You stay steady and calm through production bugs and complex stories — you trust yourself to find more than one path through a technical blocker.",
      calibrationTip:
        "This is the optimal engineering state — it's what fosters psychological safety, fast learning curves, and steady sprint delivery around you.",
    },
    medium: {
      title: "The Contextual Performer",
      interpretation:
        "Your confidence is solid inside your core framework and domain, but unfamiliar tools, complex distributed systems, or a sudden AI-driven pivot can dent it temporarily.",
      calibrationTip:
        "A small, isolated spike to prove technical feasibility before committing to a whole feature is usually enough to restore your baseline confidence quickly.",
    },
    low: {
      title: "The Vulnerable Operator",
      interpretation:
        "You frequently question your technical depth, especially in a complex debugging session or when comparing yourself to a prolific peer.",
      calibrationTip:
        "Try reframing a bug from a personal shortcoming to environmental complexity — and keep a short log of the ones you've resolved, as a concrete record of the capability you've actually built.",
    },
    "very-low": {
      title: "The Imposter Spiral",
      interpretation:
        "High Techno-Complexity and time pressure have built into something close to imposter syndrome — feeling chronically underprepared, worried about being found out.",
      calibrationTip:
        "This is worth treating as a real signal, not a personal failing. Paired programming or focused mentorship on your current tickets is a safe, direct way to rebuild mastery experiences.",
    },
  },
  architect: {
    "very-high": {
      title: "The Strategic Pillar",
      interpretation:
        "You have real conviction in your architectural judgment, systems trade-offs, and vision — ambiguous, complex constraints energize you rather than intimidating you.",
      calibrationTip:
        "Make sure that confidence leaves room for collaborative input, so architectural decisions land as shared reasoning rather than top-down edicts that leave delivery teams out.",
    },
    high: {
      title: "The Grounded Orchestrator",
      interpretation:
        "You navigate disputed design patterns, conflicting stakeholder demands, and platform upgrades calmly, trusting your own track record to guide the next one.",
      calibrationTip:
        "Channel this confidence into mentoring — helping senior engineers build their own systems-thinking instincts compounds it across the team.",
    },
    medium: {
      title: "The Pragmatic Validator",
      interpretation:
        "You're confident evaluating standard architectural blueprints, but you hesitate when designing for untested, high-scale paradigms or bleeding-edge AI frameworks.",
      calibrationTip:
        "A lightweight sandbox or proof-of-concept to empirically validate a design hypothesis before finalizing a system contract turns that hesitation into evidence.",
    },
    low: {
      title: "The Tentative Lead",
      interpretation:
        "The pace of tech obsolescence is wearing at your architectural authority — you second-guess system decisions, worried about introducing lasting technical debt.",
      calibrationTip:
        "Architecture is about trade-offs, not perfection. Writing a formal ADR to share your rationale distributes the decision and the consensus across the team, rather than leaving it resting on you alone.",
    },
    "very-low": {
      title: "The Paralyzed Architect",
      interpretation:
        "The volume of platform churn and conflicting organizational politics has frozen your decision-making — declaring a standard starts to feel like signing up to take the blame if it fails.",
      calibrationTip:
        "This reflects systemic exhaustion, not a gap in expertise. Stepping back from enterprise-wide mandates to stabilize one single service interface is a realistic place to rebuild.",
    },
  },
  manager: {
    "very-high": {
      title: "The Transformational Anchor",
      interpretation:
        "You have deep belief in your ability to steer a team through reorganization, crisis delivery, and high-stakes client SLAs.",
      calibrationTip:
        "Make sure this resilience doesn't obscure the real strain your team members are under at their own, different thresholds — check in directly rather than assuming your bandwidth is theirs.",
    },
    high: {
      title: "The Capable Facilitator",
      interpretation:
        "You manage team capacity, resolve cross-functional dependencies, and hold delivery stable with calm, grounded confidence.",
      calibrationTip: "Maintain this baseline — it directly projects psychological safety and stability across your whole pod.",
    },
    medium: {
      title: "The Operational Pacer",
      interpretation:
        "You run daily ceremonies and steady delivery smoothly, but aggressive executive pushback or a complex technical escalation can leave you feeling insecure.",
      calibrationTip:
        "Building a strong alliance with your technical architects to co-handle the technical defense in stakeholder negotiations takes that weight off you alone.",
    },
    low: {
      title: "The Anxious Coordinator",
      interpretation:
        "Conflicting managerial expectations — developer well-being against delivery deadlines — often leave you overwhelmed, and a slipped milestone can feel like a personal leadership failure.",
      calibrationTip:
        "Shifting from personal responsibility to process instrumentation — clear sprint data that objectively shows stakeholders your team's real capacity — takes that weight off you personally.",
    },
    "very-low": {
      title: "The Overwhelmed Lead",
      interpretation:
        "You feel unable to affect project outcomes or shield your squad from external pressure, and have largely settled into pure survival mode rather than proactive leadership.",
      calibrationTip:
        "This is leadership burnout, not a personal failing. Seeking peer or managerial support to renegotiate your squad's scope and reset operational boundaries is the direct next step.",
    },
  },
};

/** Occupational Self-Efficacy's role-calibrated operational read, keyed off its own 1-6 scale bands. */
export function describeSelfEfficacyOperationalRead(score: number, role: string | undefined): OperationalReading {
  return describeOperationalRead(selfEfficacyBandForScore(score), role, SELF_EFFICACY_COPY);
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

// Pairs the participant's heaviest demand with the Grit dimension this study's framework
// treats as its specific buffer (see COUNTERWEIGHT_FACET in scoring.ts). This is the one
// place the two halves of the model are named against each other for a single participant,
// so the copy stays specific about the mechanism rather than claiming grit cancels strain.
const COUNTERWEIGHT_MECHANISM: Record<string, string> = {
  Overload:
    "Steadfastness is the dimension that absorbs overload — holding composure and a sense of purpose when the pace and the volume spike at once.",
  Complexity:
    "Spirited Initiative is the dimension that converts complexity into capability — the proactive push to actually master an unfamiliar tool instead of building workarounds for it.",
  Uncertainty:
    "Adaptability is the dimension that absorbs churn — pivoting with the stack rather than being knocked off balance each time it moves.",
  "ai-anxiety":
    "Adaptability is the dimension that steadies this one — every technology transition you've already navigated is the evidence base for navigating the next.",
};

/** The heaviest demand, named alongside the Grit dimension positioned to offset it. */
export function describeCounterweight(reading: CounterweightReading): DiagnosticRatio {
  // The mechanism sentence already names the dimension, so this only carries the number.
  const mechanism = COUNTERWEIGHT_MECHANISM[reading.drain.id] ?? COUNTERWEIGHT_MECHANISM.Uncertainty;
  const facetScore = `Yours sits at ${reading.facetScore.toFixed(2)} / 5`;
  return {
    label: `Heaviest demand: ${reading.drain.label} — ${reading.drain.score.toFixed(2)} / ${reading.drain.max}`,
    text: reading.holding
      ? `${mechanism} ${facetScore}, at or above its typical band — so the counterweight to your heaviest demand is currently in place. That specific pairing is the thing most worth protecting as your load shifts.`
      : `${mechanism} ${facetScore}, below its typical band right now — which makes it your highest-leverage place to invest, because it's the dimension pointed directly at the demand you're carrying most of.`,
  };
}

// Measured confidence against measured output. Both sides are self-reported, so a gap
// reads as a calibration signal, never as proof that one of the two figures is wrong —
// and neither direction is written as a failure.
const EFFICACY_DELIVERY_COPY: Record<EfficacyDeliveryReading["band"], DiagnosticRatio> = {
  "delivery-ahead": {
    label: "Your delivery is running ahead of your self-read",
    text: "You're shipping and supporting your team at a level your own confidence rating hasn't caught up to. That gap is extremely common in engineering — it usually reflects how the work gets recorded rather than how capable you are, since finished tickets disappear from view the moment they close while open problems stay visible all day. Keeping a running log of what you actually shipped tends to close it faster than producing more work does.",
  },
  aligned: {
    label: "Your confidence and your delivery are tracking together",
    text: "Your self-assessment is well-calibrated against what you're actually producing — the two readings agree. That makes your own read on your capacity a reliable input for decisions about what to take on next, which is a genuinely useful position to be in.",
  },
  "confidence-ahead": {
    label: "Your confidence is running ahead of your current output",
    text: "You trust your capability more than your recent delivery numbers reflect. That self-trust is a real resource, and this pattern much more often points at the environment than at the person — under-stretched assignments, blocked dependencies, or a stretch of work that hasn't asked much of you. Worth asking what would actually put your capability to use.",
  },
};

/** Measured Occupational Self-Efficacy read against measured Task + Contextual Performance. */
export function describeEfficacyDelivery(reading: EfficacyDeliveryReading): DiagnosticRatio {
  return EFFICACY_DELIVERY_COPY[reading.band];
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
