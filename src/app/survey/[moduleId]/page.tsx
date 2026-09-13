import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireParticipant } from "@/lib/auth/session";
import { getLikertModule, SCALES } from "@/lib/survey/schema";
import { tierEndingWith } from "@/lib/survey/tiers";
import { SurveyRunner } from "@/components/survey/SurveyRunner";
import { UnlockFlow } from "@/components/survey/UnlockFlow";

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

  // Finishing the last module of a tier unlocks that tier's report — hold on a brief
  // "analyzing" beat before revealing it, rather than snapping to the next section.
  const tier = tierEndingWith(mod.id);
  if (tier) {
    return <UnlockFlow {...runnerProps} analyzingLabel={tier.analyzingLabel} />;
  }

  return <SurveyRunner {...runnerProps} />;
}
