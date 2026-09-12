import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireParticipant } from "@/lib/auth/session";
import { getLikertModule, SCALES } from "@/lib/survey/schema";
import { SurveyRunner } from "@/components/survey/SurveyRunner";
import { InsightFlow } from "@/components/survey/InsightFlow";

// Modules that get a mid-flow "insight" screen after their last question, to build
// momentum into whatever comes next instead of just dropping the participant onward.
const INSIGHT_HOOKS: Record<string, { endpoint: string; analyzingLabel: string }> = {
  grit: { endpoint: "/api/survey/grit-hook", analyzingLabel: "Analyzing your operating rhythm…" },
  "contextual-performance": {
    endpoint: "/api/survey/performance-hook",
    analyzingLabel: "Analyzing your impact assessment…",
  },
};

export default async function SurveyModulePage({
  params,
}: {
  params: Promise<{ moduleId: string }>;
}) {
  const { moduleId } = await params;
  const mod = getLikertModule(moduleId);
  if (!mod) notFound();

  const userId = await requireParticipant();
  const responses = await db.getResponses(userId);

  const runnerProps = {
    title: mod.title,
    intro: mod.intro,
    labels: SCALES[mod.scale].labels,
    items: mod.items,
    initialAnswers: responses.answers,
  };

  const hook = INSIGHT_HOOKS[mod.id];
  if (hook) {
    return <InsightFlow {...runnerProps} hookEndpoint={hook.endpoint} analyzingLabel={hook.analyzingLabel} />;
  }

  return <SurveyRunner {...runnerProps} />;
}
