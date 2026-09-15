"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";

interface ImportIssue {
  row: number;
  message: string;
}

interface ImportResult {
  created: number;
  skippedExisting: number;
  generated: number;
  createdEmails: string[];
  issues: ImportIssue[];
  additionalIssues: number;
}

export function ImportCsv() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    // Clear immediately so picking the same file again still fires a change event.
    if (inputRef.current) inputRef.current.value = "";

    const confirmed = window.confirm(
      `Import participants from "${file.name}"?\n\nNew accounts are created with the default password "passwd". Rows whose email already exists are skipped, never overwritten.`
    );
    if (!confirmed) return;

    setImporting(true);
    setError(null);
    setResult(null);
    try {
      const csv = await file.text();
      const res = await fetch("/api/admin/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) {
        throw new Error(data?.error ?? "Import failed.");
      }
      setResult(data as ImportResult);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <h2 className="mb-1 font-medium text-foreground">Import participants</h2>
      <p className="mb-3 text-sm text-muted">
        Upload a CSV in the same format as the export. Accounts are created with the password{" "}
        <span className="font-mono text-foreground">passwd</span>. Existing emails are skipped, and blank emails get a
        generated address.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        onChange={handleFile}
        disabled={importing}
        className="block w-full text-sm text-muted file:mr-3 file:min-h-11 file:cursor-pointer file:rounded-xl file:border-0 file:bg-accent file:px-4 file:py-2 file:font-medium file:text-background disabled:opacity-60"
      />

      {importing && <p className="mt-3 text-sm text-muted">Importing…</p>}
      {error && <p className="mt-3 text-sm text-danger">{error}</p>}

      {result && (
        <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3 text-sm">
          <p className="text-foreground">
            Created <span className="font-medium">{result.created}</span> · skipped{" "}
            <span className="font-medium">{result.skippedExisting}</span> already registered
            {result.generated > 0 && (
              <>
                {" "}
                · generated <span className="font-medium">{result.generated}</span> address
                {result.generated === 1 ? "" : "es"}
              </>
            )}
          </p>

          {result.createdEmails.length > 0 && (
            <p className="text-xs text-muted">
              New accounts: {result.createdEmails.join(", ")}
              {result.created > result.createdEmails.length && ` … and ${result.created - result.createdEmails.length} more`}
            </p>
          )}

          {result.issues.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted">Warnings</p>
              <ul className="flex flex-col gap-1">
                {result.issues.map((issue, i) => (
                  <li key={i} className="text-xs text-muted">
                    Row {issue.row}: {issue.message}
                  </li>
                ))}
              </ul>
              {result.additionalIssues > 0 && (
                <p className="mt-1 text-xs text-muted">…and {result.additionalIssues} more.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
