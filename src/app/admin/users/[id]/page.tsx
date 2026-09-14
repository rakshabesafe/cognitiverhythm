import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { DEMOGRAPHICS, LIKERT_MODULES, SCALES } from "@/lib/survey/schema";
import { AdminLogoutButton } from "@/components/ui/AdminLogoutButton";

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const user = await db.getUserById(id);
  if (!user) notFound();
  const responses = await db.getResponses(id);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <Link href="/admin/dashboard" className="text-sm text-muted underline underline-offset-2">
          ← Admin dashboard
        </Link>
        <AdminLogoutButton />
      </div>

      <div>
        <h1 className="text-xl font-semibold text-foreground">{user.email}</h1>
        <p className="mt-1 text-sm text-muted">
          Registered {new Date(user.createdAt).toLocaleString()}
          {user.consentAt ? ` · Consented ${new Date(user.consentAt).toLocaleString()}` : " · Not consented"}
          {user.lastLoginAt ? ` · Last login ${new Date(user.lastLoginAt).toLocaleString()}` : ""}
        </p>
        <p className="mt-1 text-sm text-muted">
          {responses.completedAt
            ? `Completed ${new Date(responses.completedAt).toLocaleString()}`
            : `In progress — ${responses.completedModules.length}/${LIKERT_MODULES.length} modules complete`}
        </p>
      </div>

      <section className="rounded-2xl border border-border bg-surface p-4">
        <h2 className="mb-3 font-medium text-foreground">About You</h2>
        <div className="flex flex-col gap-2">
          {DEMOGRAPHICS.fields.map((field) => (
            <div key={field.code} className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted">{field.label}</span>
              <span className="text-right text-foreground">{responses.demographics[field.code] || "—"}</span>
            </div>
          ))}
        </div>
      </section>

      {LIKERT_MODULES.map((mod) => {
        const labels = SCALES[mod.scale].labels;
        return (
          <section key={mod.id} className="rounded-2xl border border-border bg-surface p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-medium text-foreground">{mod.title}</h2>
              {responses.completedModules.includes(mod.id) && (
                <span className="text-xs text-accent">Complete</span>
              )}
            </div>
            <div className="flex flex-col gap-3">
              {mod.items.map((item) => {
                const value = responses.answers[item.code];
                return (
                  <div key={item.code} className="border-b border-border/50 pb-2 last:border-0 last:pb-0">
                    <p className="text-xs text-muted">
                      {item.code}
                      {item.section ? ` · ${item.section}` : ""}
                    </p>
                    <p className="text-sm text-foreground/90">{item.text}</p>
                    <p className="mt-1 text-sm font-medium text-accent">
                      {typeof value === "number" ? `${value} — ${labels[value - 1] ?? "?"}` : "Not answered"}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </main>
  );
}
