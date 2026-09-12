import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getParticipantSession } from "@/lib/auth/session";
import { getNextRoute } from "@/lib/survey/scoring";

export default async function HomePage() {
  const userId = await getParticipantSession();
  if (userId) {
    const user = await db.getUserById(userId);
    if (!user?.consentAt) redirect("/consent");
    const responses = await db.getResponses(userId);
    redirect(getNextRoute(responses));
  }

  return (
    <main className="relative mx-auto flex min-h-full w-full max-w-md flex-1 flex-col justify-center gap-10 overflow-hidden px-6 py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-accent/20 blur-3xl"
      />

      <div className="relative text-center">
        <span className="inline-block rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium uppercase tracking-wide text-accent">
          Free personalized report
        </span>
        <h1 className="mt-4 text-3xl font-semibold text-foreground">
          Cognitive Rhythm &amp; Resilience
        </h1>
        <p className="mt-3 text-muted">
          Discover how you actually handle technology, pressure, and change at work — benchmarked
          against your peers in Indian IT, with a personalized action plan at the end. Takes about
          15–20 minutes, and you can pick it up again anytime.
        </p>
      </div>

      <div className="relative flex flex-col gap-2 rounded-2xl border border-border bg-surface p-4 text-sm">
        <p className="flex items-center gap-2 text-foreground">
          <span aria-hidden>📊</span> See your score benchmarked against your peers
        </p>
        <p className="flex items-center gap-2 text-foreground">
          <span aria-hidden>🧭</span> Get your personal operating profile
        </p>
        <p className="flex items-center gap-2 text-foreground">
          <span aria-hidden>✅</span> Walk away with a concrete action plan
        </p>
      </div>

      <div className="relative flex flex-col gap-3">
        <Link
          href="/register"
          className="min-h-14 rounded-xl bg-accent px-4 py-3 text-center font-medium text-background"
        >
          Get my report
        </Link>
        <Link
          href="/login"
          className="min-h-14 rounded-xl border border-border px-4 py-3 text-center font-medium text-foreground hover:bg-surface"
        >
          I already have an account
        </Link>
      </div>
      <p className="relative text-center text-xs text-muted">
        Part of an ongoing academic research study. Your answers are confidential and only used
        in aggregate.
      </p>
    </main>
  );
}
