import { db } from "@/lib/db";
import { requireParticipant } from "@/lib/auth/session";
import { DEMOGRAPHICS } from "@/lib/survey/schema";
import { DemographicsRunner } from "@/components/survey/DemographicsRunner";

export default async function DemographicsPage() {
  const userId = await requireParticipant();
  const responses = await db.getResponses(userId);

  return (
    <DemographicsRunner
      fields={DEMOGRAPHICS.fields}
      initialValues={responses.demographics}
      intro={DEMOGRAPHICS.intro}
    />
  );
}
