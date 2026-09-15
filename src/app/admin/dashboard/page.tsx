import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { LIKERT_MODULES } from "@/lib/survey/schema";
import type { UserRecord } from "@/lib/db";
import { AdminLogoutButton } from "@/components/ui/AdminLogoutButton";
import { ImportCsv } from "@/components/admin/ImportCsv";
import { UserTable } from "@/components/admin/UserTable";

const ACTIVE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

function countActiveUsers(users: UserRecord[]): number {
  const now = Date.now();
  return users.filter((u) => u.lastLoginAt && now - new Date(u.lastLoginAt).getTime() < ACTIVE_WINDOW_MS)
    .length;
}

export default async function AdminDashboardPage() {
  await requireAdmin();

  const users = await db.listUsers();
  const responses = await db.listAllResponses();
  const responseByUserId = new Map(responses.map((r) => [r.userId, r]));

  const activeUsers = countActiveUsers(users);
  const fullyCompleted = responses.filter((r) => r.completedAt).length;

  const moduleStats = LIKERT_MODULES.map((mod) => {
    const count = users.filter((u) => responseByUserId.get(u.id)?.completedModules.includes(mod.id)).length;
    return { title: mod.title, count };
  });

  const userRows = users
    .map((u) => {
      const record = responseByUserId.get(u.id);
      return {
        id: u.id,
        email: u.email,
        createdAt: u.createdAt,
        completedAt: record?.completedAt,
        completedModules: record?.completedModules.length ?? 0,
        totalModules: LIKERT_MODULES.length,
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Admin dashboard</h1>
        <AdminLogoutButton />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat label="Registered users" value={users.length} />
        <Stat label="Active (7 days)" value={activeUsers} />
        <Stat label="Fully completed" value={fullyCompleted} />
      </div>

      <div className="rounded-2xl border border-border bg-surface p-4">
        <h2 className="mb-3 font-medium text-foreground">Module completion</h2>
        <div className="flex flex-col gap-2">
          {moduleStats.map((m) => (
            <div key={m.title} className="flex items-center justify-between text-sm">
              <span className="text-muted">{m.title}</span>
              <span className="text-foreground">
                {m.count}/{users.length}
              </span>
            </div>
          ))}
        </div>
      </div>

      <UserTable rows={userRows} />

      <Link
        href="/admin/questions"
        className="min-h-14 rounded-xl border border-border bg-surface px-4 py-3 text-center font-medium text-foreground"
      >
        View question breakdown
      </Link>

      <a
        href="/api/admin/export"
        className="min-h-14 rounded-xl bg-accent px-4 py-3 text-center font-medium text-background"
      >
        Download CSV export
      </a>

      <ImportCsv />
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 text-center">
      <p className="text-2xl font-semibold text-foreground">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}
