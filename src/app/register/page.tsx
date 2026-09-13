"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) {
        setError(data?.error ?? "Something went wrong. Please try again.");
        return;
      }
      router.push("/consent");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-1 flex-col justify-center gap-6 px-6 py-16">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Create your account</h1>
        <p className="mt-1 text-sm text-muted">Just an email and password — no verification steps.</p>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-muted">Email</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="min-h-14 rounded-xl border border-border bg-surface px-4 text-foreground outline-none focus:border-accent"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-muted">Password</span>
          <input
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="min-h-14 rounded-xl border border-border bg-surface px-4 text-foreground outline-none focus:border-accent"
          />
        </label>
        {error && <p className="text-sm text-danger">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="min-h-14 rounded-xl bg-accent px-4 py-3 font-medium text-background disabled:opacity-60"
        >
          {submitting ? "Creating account…" : "Create account"}
        </button>
      </form>
      <p className="text-center text-sm text-muted">
        Already registered?{" "}
        <Link href="/login" className="text-accent">
          Log in
        </Link>
      </p>
    </main>
  );
}
