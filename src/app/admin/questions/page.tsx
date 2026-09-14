import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { computeQuestionStats } from "@/lib/survey/scoring";
import { AdminLogoutButton } from "@/components/ui/AdminLogoutButton";
import { QuestionStats } from "@/components/admin/QuestionStats";

export default async function AdminQuestionsPage() {
  await requireAdmin();

  const responses = await db.listAllResponses();
  const stats = computeQuestionStats(responses.map((r) => r.answers));

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <Link href="/admin/dashboard" className="text-sm text-muted underline underline-offset-2">
          ← Admin dashboard
        </Link>
        <AdminLogoutButton />
      </div>

      <div>
        <h1 className="text-xl font-semibold text-foreground">Question breakdown</h1>
        <p className="mt-1 text-sm text-muted">
          Pick a question to see how every participant who has answered it responded so far.
        </p>
      </div>

      <QuestionStats stats={stats} />
    </main>
  );
}
