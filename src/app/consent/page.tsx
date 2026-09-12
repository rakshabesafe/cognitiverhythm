import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireParticipant } from "@/lib/auth/session";
import { getNextRoute } from "@/lib/survey/scoring";
import { ConsentForm } from "@/components/survey/ConsentForm";

export default async function ConsentPage() {
  const userId = await requireParticipant();
  const user = await db.getUserById(userId);
  if (user?.consentAt) {
    const responses = await db.getResponses(userId);
    redirect(getNextRoute(responses));
  }

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center gap-6 px-6 py-16">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Before we begin</h1>
        <p className="mt-1 text-sm text-muted">
          This quick reflection feeds an ongoing research study on the Indian IT workforce — and
          in exchange, you&apos;ll get your own personalized Cognitive Rhythm &amp; Resilience
          Report at the end.
        </p>
      </div>
      <div className="rounded-xl border border-border bg-surface p-4 text-sm text-muted">
        <p className="mb-2 text-foreground">By participating, I acknowledge that:</p>
        <ul className="list-inside list-disc space-y-1">
          <li>My participation is voluntary.</li>
          <li>My responses will remain confidential and anonymous.</li>
          <li>Data will be used only for academic purposes.</li>
        </ul>
      </div>
      <ConsentForm />
    </main>
  );
}
