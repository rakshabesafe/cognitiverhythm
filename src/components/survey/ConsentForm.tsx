"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ConsentForm() {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleContinue() {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/consent", { method: "POST" });
      if (res.status === 401) {
        router.push("/login");
        router.refresh();
        return;
      }
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError("Something went wrong. Please try again.");
        return;
      }
      router.push(data?.nextRoute ?? "/dashboard");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <label className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-1 h-5 w-5 shrink-0 accent-accent"
        />
        <span className="text-sm text-foreground">I agree to participate in this study.</span>
      </label>
      {error && <p className="text-sm text-danger">{error}</p>}
      <button
        type="button"
        disabled={!agreed || submitting}
        onClick={handleContinue}
        className="min-h-14 rounded-xl bg-accent px-4 py-3 font-medium text-background disabled:opacity-40"
      >
        {submitting ? "Please wait…" : "Continue"}
      </button>
    </div>
  );
}
