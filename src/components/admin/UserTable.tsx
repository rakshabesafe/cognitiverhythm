"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export interface AdminUserRow {
  id: string;
  email: string;
  createdAt: string;
  completedAt?: string;
  completedModules: number;
  totalModules: number;
}

export function UserTable({ rows }: { rows: AdminUserRow[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allSelected = rows.length > 0 && selected.size === rows.length;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.id)));
  }

  const selectedEmails = useMemo(
    () => rows.filter((r) => selected.has(r.id)).map((r) => r.email),
    [rows, selected]
  );

  async function handleDelete() {
    if (selected.size === 0) return;
    const confirmed = window.confirm(
      `Delete ${selected.size} participant${selected.size === 1 ? "" : "s"}?\n\n${selectedEmails.join(
        "\n"
      )}\n\nThis permanently removes their account and all survey responses.`
    );
    if (!confirmed) return;

    setDeleting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: Array.from(selected) }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Delete failed.");
      }
      setSelected(new Set());
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-medium text-foreground">Participants</h2>
        <button
          type="button"
          onClick={handleDelete}
          disabled={selected.size === 0 || deleting}
          className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          {deleting ? "Deleting…" : `Delete selected (${selected.size})`}
        </button>
      </div>

      {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

      {rows.length === 0 ? (
        <p className="text-sm text-muted">No participants yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-muted">
                <th className="w-8 py-2">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all" />
                </th>
                <th className="py-2 pr-2">Email</th>
                <th className="py-2 pr-2">Registered</th>
                <th className="py-2 pr-2">Progress</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-border/50">
                  <td className="py-2">
                    <input
                      type="checkbox"
                      checked={selected.has(row.id)}
                      onChange={() => toggle(row.id)}
                      aria-label={`Select ${row.email}`}
                    />
                  </td>
                  <td className="py-2 pr-2 text-foreground">{row.email}</td>
                  <td className="py-2 pr-2 text-muted">
                    {new Date(row.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-2 pr-2 text-muted">
                    {row.completedAt ? "Complete" : `${row.completedModules}/${row.totalModules}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
