"use client";

import { useMemo, useState } from "react";
import type { QuestionStat } from "@/lib/survey/scoring";

export function QuestionStats({ stats }: { stats: QuestionStat[] }) {
  const [code, setCode] = useState(stats[0]?.code ?? "");
  const stat = useMemo(() => stats.find((s) => s.code === code) ?? stats[0], [stats, code]);

  const moduleGroups = useMemo(() => {
    const seen = new Set<string>();
    const groups: { moduleTitle: string; items: QuestionStat[] }[] = [];
    for (const s of stats) {
      if (!seen.has(s.moduleId)) {
        seen.add(s.moduleId);
        groups.push({ moduleTitle: s.moduleTitle, items: [] });
      }
      groups.find((g) => g.moduleTitle === s.moduleTitle)!.items.push(s);
    }
    return groups;
  }, [stats]);

  if (!stat) return <p className="text-sm text-muted">No questions available.</p>;

  const maxCount = Math.max(1, ...stat.distribution);

  return (
    <div className="flex flex-col gap-4">
      <select
        value={stat.code}
        onChange={(e) => setCode(e.target.value)}
        className="min-h-12 rounded-xl border border-border bg-surface px-3 text-sm text-foreground"
      >
        {moduleGroups.map((group) => (
          <optgroup key={group.moduleTitle} label={group.moduleTitle}>
            {group.items.map((item) => (
              <option key={item.code} value={item.code}>
                {item.code}: {item.text}
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      <div className="rounded-2xl border border-border bg-surface p-4">
        <p className="text-xs text-muted">
          {stat.code}
          {stat.section ? ` · ${stat.section}` : ""} · {stat.moduleTitle}
        </p>
        <p className="mt-1 text-sm text-foreground/90">{stat.text}</p>

        <div className="mt-3 flex items-center gap-4">
          <div>
            <p className="text-2xl font-semibold text-foreground">
              {stat.average !== null ? stat.average.toFixed(2) : "—"}
            </p>
            <p className="text-xs text-muted">average score</p>
          </div>
          <div>
            <p className="text-2xl font-semibold text-foreground">{stat.count}</p>
            <p className="text-xs text-muted">{stat.count === 1 ? "response" : "responses"}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          {stat.labels.map((label, idx) => {
            const count = stat.distribution[idx];
            const pct = stat.count > 0 ? Math.round((count / stat.count) * 100) : 0;
            return (
              <div key={label}>
                <div className="mb-1 flex items-center justify-between text-xs text-muted">
                  <span>
                    {idx + 1}. {label}
                  </span>
                  <span>
                    {count} ({pct}%)
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${(count / maxCount) * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
