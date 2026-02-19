 "use client";

import * as React from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthContext";

export default function LoginPage() {
  const { user, loading, signIn, signUp } = useAuth();
  const [mode, setMode] = React.useState<"signin" | "signup">("signin");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }
    setSubmitting(true);
    try {
      if (mode === "signin") {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Authentication failed. Try again.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-linear-to-b from-zinc-950 via-zinc-950 to-black px-4 py-10 text-zinc-50">
      <main className="mx-auto flex max-w-md flex-col gap-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-500">
            Account
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            {mode === "signin" ? "Sign in" : "Create your account"}
          </h1>
          <p className="mt-2 text-xs text-zinc-400">
            Save your review history and, soon, project-level insights tied to
            your account.
          </p>
        </div>

        {user && !loading && (
          <p className="rounded-xl border border-emerald-600/40 bg-emerald-950/40 px-3 py-2 text-xs text-emerald-200">
            You are already signed in as{" "}
            <span className="font-medium">{user.email}</span>. You can go back to{" "}
            <Link href="/" className="underline">
              the assistant
            </Link>
            .
          </p>
        )}

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4 text-sm shadow-[0_0_0_1px_rgba(24,24,27,0.9),0_18px_45px_rgba(0,0,0,0.9)]"
        >
          <div className="mb-4 inline-flex rounded-full border border-zinc-800 bg-zinc-900 p-1 text-[11px]">
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={`rounded-full px-3 py-1 transition ${
                mode === "signin"
                  ? "bg-zinc-50 text-zinc-950 shadow-sm"
                  : "text-zinc-300 hover:bg-zinc-800/80"
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`rounded-full px-3 py-1 transition ${
                mode === "signup"
                  ? "bg-zinc-50 text-zinc-950 shadow-sm"
                  : "text-zinc-300 hover:bg-zinc-800/80"
              }`}
            >
              Sign up
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-zinc-200">
                Email
              </label>
              <input
                type="email"
                className="h-9 rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 text-sm text-zinc-50 outline-none transition focus:border-zinc-500 focus:bg-zinc-950 focus:ring-2 focus:ring-emerald-500/40"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-zinc-200">
                Password
              </label>
              <input
                type="password"
                className="h-9 rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 text-sm text-zinc-50 outline-none transition focus:border-zinc-500 focus:bg-zinc-950 focus:ring-2 focus:ring-emerald-500/40"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
              />
            </div>
          </div>

          {error && (
            <p className="mt-3 text-xs text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-medium text-emerald-950 shadow-sm transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting && (
              <span className="h-3 w-3 animate-spin rounded-full border border-emerald-900 border-t-transparent" />
            )}
            {mode === "signin" ? "Sign in" : "Create account"}
          </button>

          <p className="mt-3 text-[11px] text-zinc-500">
            By continuing you agree that this is an experimental prototype and
            you should not paste secrets or proprietary code.
          </p>
        </form>

        <p className="text-xs text-zinc-500">
          Or go back to{" "}
          <Link href="/" className="underline">
            the assistant
          </Link>
          .
        </p>
      </main>
    </div>
  );
}

