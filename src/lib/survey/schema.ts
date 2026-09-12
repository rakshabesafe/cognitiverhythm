// Single source of truth for the questionnaire, derived from questionaire.md.
// Every page (survey runner, dashboard, admin export, scoring) reads from here
// so item text/scales are never duplicated.

export type ScaleId = "agree5" | "grit5" | "agree7" | "true6";

export interface ScaleDef {
  id: ScaleId;
  /** index 0 corresponds to response value 1 */
  labels: string[];
}

export const SCALES: Record<ScaleId, ScaleDef> = {
  agree5: {
    id: "agree5",
    labels: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"],
  },
  grit5: {
    id: "grit5",
    labels: [
      "Not like me at all",
      "Not much like me",
      "Somewhat like me",
      "Mostly like me",
      "Very much like me",
    ],
  },
  agree7: {
    id: "agree7",
    labels: [
      "Strongly Disagree",
      "Disagree",
      "Somewhat Disagree",
      "Neither Agree Nor Disagree",
      "Somewhat Agree",
      "Agree",
      "Strongly Agree",
    ],
  },
  true6: {
    id: "true6",
    labels: [
      "Not at all True",
      "Barely True",
      "Moderately True",
      "Exactly True",
      "Very True",
      "Completely True",
    ],
  },
};

export interface LikertItem {
  code: string;
  text: string;
  /** groups items within a module, e.g. Technostress's Overload/Complexity/Uncertainty */
  section?: string;
}

/** The short, motivating "why this matters" screen shown before a section starts. */
export interface SectionIntro {
  emoji: string;
  tagline: string;
  body: string;
}

export interface LikertModule {
  id: string;
  kind: "likert";
  title: string;
  description: string;
  intro: SectionIntro;
  scale: ScaleId;
  items: LikertItem[];
}

export type DemographicField =
  | { code: string; label: string; type: "text"; required: boolean }
  | { code: string; label: string; type: "select"; required: boolean; options: string[] };

export interface DemographicsModule {
  id: "demographics";
  kind: "demographics";
  title: string;
  description: string;
  intro: SectionIntro;
  fields: DemographicField[];
}

export type SurveyModule = LikertModule | DemographicsModule;

export const DEMOGRAPHICS: DemographicsModule = {
  id: "demographics",
  kind: "demographics",
  title: "About You",
  description: "A few quick details before we begin.",
  intro: {
    emoji: "👋",
    tagline: "Let's build your Cognitive Rhythm profile",
    body: "First, a few quick details about you — it takes under a minute. Your answers are 100% private, used only in aggregate for academic research, and never sold, shared, or used for any commercial purpose.",
  },
  fields: [
    { code: "name", label: "Name", type: "text", required: false },
    {
      code: "gender",
      label: "Gender",
      type: "select",
      required: true,
      options: ["Male", "Female", "Other"],
    },
    {
      code: "ageGroup",
      label: "Age Group",
      type: "select",
      required: true,
      options: ["18 to 28", "28 to 35", "35 and above"],
    },
    {
      code: "qualification",
      label: "Highest Qualification",
      type: "select",
      required: true,
      options: [
        "Doctorate",
        "Professional qualification (CA / BE / BTECH)",
        "Postgraduate",
        "Graduate",
        "Other",
      ],
    },
    {
      code: "maritalStatus",
      label: "Marital Status",
      type: "select",
      required: true,
      options: ["Married", "Unmarried"],
    },
    {
      code: "role",
      label: "Role",
      type: "select",
      required: true,
      options: ["Software Engineer", "Designer/Architect", "Manager"],
    },
    {
      code: "experience",
      label: "Years of Experience",
      type: "select",
      required: true,
      options: ["<= 5", "6-10", "10+"],
    },
    {
      code: "orgType",
      label: "Organization Type",
      type: "select",
      required: true,
      options: ["Product", "Service Industry"],
    },
    {
      code: "orgTenure",
      label: "Org Tenure",
      type: "select",
      required: true,
      options: ["<= 5 years", "More than 5 years"],
    },
    {
      code: "location",
      label: "Location",
      type: "select",
      required: true,
      options: ["India", "Outside India"],
    },
  ],
};

export const LIKERT_MODULES: LikertModule[] = [
  {
    id: "grit",
    kind: "likert",
    title: "Grit",
    description: "The following statements are about how you approach your work and goals. Please indicate how much each statement is like you.",
    intro: {
      emoji: "🔥",
      tagline: "First up: Grit",
      body: "Researchers consistently find that grit — passion and perseverance for long-term goals — predicts career success better than raw talent alone. Let's see what your grit profile looks like.",
    },
    scale: "grit5",
    items: [
      { code: "G1", text: "I move out of my comfort zone to achieve my goal." },
      { code: "G2", text: "I take in, blend and construct new ideas to achieve my goals" },
      { code: "G3", text: "I am willing to complete an important journey despite the obstacles I may face" },
      { code: "G4", text: "I am able to monitor and control myself to achieve my goals" },
      { code: "G5", text: "I learn from my mistakes and incorporate them to work towards my goal" },
      { code: "G6", text: "I work hard to achieve my goals" },
      { code: "G7", text: "I am alert and adaptable in situations of distress" },
      { code: "G8", text: "I embrace the frustration I feel during difficult situations and move forward to achieve my goal" },
      { code: "G9", text: "I am able to handle whatever comes my way" },
      { code: "G10", text: "Rejection at any point doesn't deter me from achieving my goal" },
      { code: "G11", text: "I have a sense of purpose in life" },
      { code: "G12", text: "No matter how hopeless the situation is, I do not give up" },
    ],
  },
  {
    id: "task-performance",
    kind: "likert",
    title: "Task Performance",
    description: "Please indicate how often the following statements have applied to your work over the past few months.",
    intro: {
      emoji: "✅",
      tagline: "Your Impact Assessment: Execution",
      body: "This isn't a performance review — think of it as an impact assessment. We want to measure the real energy that goes into your deep technical execution, separate from how visible that work happens to be.",
    },
    scale: "agree5",
    items: [
      { code: "TP1", text: "I complete all the tasks assigned to me" },
      { code: "TP2", text: "I plan my work so that it is done on time" },
      { code: "TP3", text: "I work accurately with few errors" },
      { code: "TP4", text: "I keep my knowledge about my job up-to-date" },
      { code: "TP5", text: "I solve problems that arise in my job independently" },
    ],
  },
  {
    id: "contextual-performance",
    kind: "likert",
    title: "Contextual Performance",
    description: "Please indicate how often the following statements have applied to your work over the past few months.",
    intro: {
      emoji: "🤝",
      tagline: "Your Impact Assessment: Collaboration",
      body: "The second half of your impact assessment: the discretionary work — mentoring, unblocking teammates, improving processes — that never shows up on a sprint board but absolutely shapes how your team performs.",
    },
    scale: "agree5",
    items: [
      { code: "CP1", text: "I take on extra responsibilities voluntarily" },
      { code: "CP2", text: "I help colleagues with difficult work tasks" },
      { code: "CP3", text: "I put myself out to help colleagues who have work difficulties" },
      { code: "CP4", text: "I am a good listener when colleagues need to discuss problems" },
      { code: "CP5", text: "I show initiative in suggesting ideas for improvement" },
      { code: "CP6", text: "I make suggestions to improve work processes" },
      { code: "CP7", text: "I volunteer for challenging new work tasks" },
      { code: "CP8", text: "I am enthusiastic about implementing change" },
    ],
  },
  {
    id: "technostress",
    kind: "likert",
    title: "Technostress",
    description: "The following statements are about your experiences with the technology you use for your job.",
    intro: {
      emoji: "⚡",
      tagline: "Your Relationship with Tech",
      body: "This is the heart of your Cognitive Rhythm report — how the pace, complexity, and constant change of workplace technology is really affecting you.",
    },
    scale: "agree5",
    items: [
      { code: "TO1", text: "I am forced by technology to work much faster", section: "Overload" },
      { code: "TO2", text: "I am forced by technology to do more work than I can handle", section: "Overload" },
      { code: "TO3", text: "I am forced by technology to work with very tight time schedules", section: "Overload" },
      { code: "TO4", text: "I am forced to change my work habits to adapt to new technologies", section: "Overload" },
      { code: "TO5", text: "I have a higher workload because of increased technology complexity", section: "Overload" },
      { code: "TC1", text: "I do not know enough about the technologies I use to handle my job satisfactorily", section: "Complexity" },
      { code: "TC2", text: "I need a long time to understand and use new technologies", section: "Complexity" },
      { code: "TC3", text: "I do not find enough time to study and upgrade my technology skills", section: "Complexity" },
      { code: "TC4", text: "I find new recruits to this organization know more about computer technology than I do", section: "Complexity" },
      { code: "TC5", text: "I often find it too complex for me to understand and use new technologies", section: "Complexity" },
      { code: "TU1", text: "There are always new developments in the technologies we use in our organization", section: "Uncertainty" },
      { code: "TU2", text: "There are constant changes in computer software in our organization", section: "Uncertainty" },
      { code: "TU3", text: "There are constant changes in computer hardware in our organization", section: "Uncertainty" },
      { code: "TU4", text: "There are frequent upgrades in the computer systems and networks in my organization", section: "Uncertainty" },
    ],
  },
  {
    id: "ai-anxiety",
    kind: "likert",
    title: "AI Job Anxiety",
    description: "Please indicate how often the following statements have applied to your work over the past few months.",
    intro: {
      emoji: "🤖",
      tagline: "AI & the Future of Your Job",
      body: "A candid read on how you feel about AI's impact on your career. There are no wrong answers — this is one of the most talked-about, least measured parts of tech work today.",
    },
    scale: "agree7",
    items: [
      { code: "JP1", text: "I am afraid that an AI technique/product may make us dependent" },
      { code: "JP2", text: "I am afraid that an AI technique/product may make us even lazier" },
      { code: "JP3", text: "I am afraid that an AI technique/product may replace humans" },
      {
        code: "JP4",
        text: "I am afraid that widespread use of humanoid robots will take jobs away from people. I think that AI techniques/products will reduce the number of jobs",
      },
      {
        code: "JP5",
        text: "I am afraid that if I begin to use AI techniques/products I will become dependent upon them and lose some of my reasoning skills",
      },
      { code: "JP6", text: "I am afraid that AI techniques/products will replace someone's job" },
    ],
  },
  {
    id: "self-efficacy",
    kind: "likert",
    title: "Self-Efficacy",
    description: "The following statements are about your confidence in your job. Please indicate how true each statement is for you.",
    intro: {
      emoji: "💪",
      tagline: "Your Confidence Under Pressure",
      body: "Last section. This one's about how much you trust your own ability to handle whatever your job throws at you next.",
    },
    scale: "true6",
    items: [
      { code: "SE1", text: "I can remain calm when facing difficulties in my job because I can rely on my abilities" },
      { code: "SE2", text: "When I am confronted with a problem in my job, I can usually find several solutions" },
      { code: "SE3", text: "Whatever comes my way in my job, I can usually handle it" },
      { code: "SE4", text: "My past experiences in my job have prepared me well for my occupational future" },
      { code: "SE5", text: "I meet the goals that I set for myself in my job" },
      { code: "SE6", text: "I feel prepared for most of the demands in my job" },
    ],
  },
];

export const ALL_MODULES: SurveyModule[] = [DEMOGRAPHICS, ...LIKERT_MODULES];

export function getModule(moduleId: string): SurveyModule | undefined {
  return ALL_MODULES.find((m) => m.id === moduleId);
}

export function getLikertModule(moduleId: string): LikertModule | undefined {
  const mod = LIKERT_MODULES.find((m) => m.id === moduleId);
  return mod;
}

/** Maps an item code (e.g. "TP3") to the module that owns it. */
export function findModuleForItemCode(itemCode: string): LikertModule | undefined {
  return LIKERT_MODULES.find((m) => m.items.some((i) => i.code === itemCode));
}

export const TOTAL_LIKERT_ITEMS = LIKERT_MODULES.reduce((sum, m) => sum + m.items.length, 0);
export const TOTAL_REQUIRED_DEMOGRAPHIC_FIELDS = DEMOGRAPHICS.fields.filter((f) => f.required).length;

export function isDemographicsComplete(demographics: Record<string, string>): boolean {
  return DEMOGRAPHICS.fields.every((f) => !f.required || Boolean(demographics[f.code]));
}

export function countAnsweredRequiredDemographics(demographics: Record<string, string>): number {
  return DEMOGRAPHICS.fields.filter((f) => f.required && Boolean(demographics[f.code])).length;
}
