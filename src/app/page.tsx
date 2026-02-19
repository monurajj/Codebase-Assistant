 "use client";

import * as React from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthContext";
import { getDb, addDoc, collection, serverTimestamp } from "@/lib/firebaseClient";

export default function Home() {
  const { user, loading } = useAuth();

  return (
    <div className="relative min-h-screen overflow-hidden bg-linear-to-b from-zinc-950 via-zinc-950 to-black px-4 py-10 font-sans text-zinc-50">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(244,244,245,0.16),transparent_55%)]" />
      <main className="relative mx-auto flex max-w-5xl flex-col gap-8">
        <header className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-500">
              Codebase Intelligence
            </p>
            <h1 className="mt-2 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              Understand any codebase with AI-assisted review.
            </h1>
            <p className="mt-3 max-w-xl text-sm text-zinc-400">
              Start with a single snippet today. Soon, you&apos;ll drop in a GitHub repo
              and get architecture maps, request flows, and dependency insights.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {!loading && (
              <span className="hidden text-xs text-zinc-500 sm:inline">
                {user
                  ? `Signed in as ${user.email ?? "anonymous"}`
                  : "You are not signed in."}
              </span>
            )}
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-full border border-zinc-800/80 bg-zinc-900/70 px-3 py-1 text-[11px] text-zinc-300 shadow-sm backdrop-blur"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {user ? "Manage account" : "Sign in to save history"}
            </Link>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)]">
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/70 p-4 shadow-[0_0_0_1px_rgba(24,24,27,0.9),0_18px_45px_rgba(0,0,0,0.9)] backdrop-blur-sm sm:p-6">
            <CodeQualityForm />
          </div>
          <aside className="hidden flex-col gap-4 rounded-2xl border border-zinc-800/80 bg-zinc-950/70 p-4 text-xs text-zinc-400 shadow-[0_0_0_1px_rgba(24,24,27,0.9),0_18px_45px_rgba(0,0,0,0.9)] backdrop-blur-sm lg:flex">
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Coming soon
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-zinc-100">GitHub project ingest</p>
                <p className="mt-1 text-xs text-zinc-400">
                  Point at any public or connected private repository and get a structured
                  view of modules, routes, and services.
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-100">Request flow tracing</p>
                <p className="mt-1 text-xs text-zinc-400">
                  Ask how a request moves from endpoint to database, with hop-by-hop
                  explanations and file path citations.
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-100">Auth &amp; security lens</p>
                <p className="mt-1 text-xs text-zinc-400">
                  Automatically surface authentication, authorization, and sensitive data
                  handling across the codebase.
                </p>
              </div>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}

function CodeQualityForm() {
  const [mode, setMode] = React.useState<"snippet" | "github">("snippet");
  const [code, setCode] = React.useState("");
  const [githubUrl, setGithubUrl] = React.useState("");
  const [language, setLanguage] = React.useState("");
  const [focus, setFocus] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<{
    overallSummary: string;
    issues: { severity: string; title: string; description: string; suggestion?: string }[];
  } | null>(null);
  const { user } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (mode === "snippet") {
      if (!code.trim()) {
        setError("Please paste some code to review.");
        return;
      }
    } else {
      if (!githubUrl.trim()) {
        setError("Please enter a GitHub repository URL.");
        return;
      }

      // Placeholder: GitHub ingestion will be wired to a dedicated API.
      setError(
        "GitHub repo ingestion is not implemented yet in this build. We will connect this to full-project analysis next."
      );
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/quality", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language: language || undefined, focus: focus || undefined }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed with status ${res.status}`);
      }

      const json = await res.json();
      setResult(json);

      // Persist history for authenticated users.
      if (user) {
        try {
          const db = getDb();
          await addDoc(collection(db, "qualityRuns"), {
            uid: user.uid,
            email: user.email ?? null,
            mode,
            code,
            githubUrl: githubUrl || null,
            language: language || null,
            focus: focus || null,
            result: json,
            createdAt: serverTimestamp(),
          });
        } catch {
          // Non-fatal; ignore history save errors in the UI.
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to review code.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
      <div className="inline-flex self-start rounded-full border border-zinc-800 bg-zinc-900 p-1 text-[11px]">
        <button
          type="button"
          onClick={() => setMode("snippet")}
          className={`rounded-full px-3 py-1 transition ${
            mode === "snippet"
              ? "bg-zinc-50 text-zinc-950 shadow-sm"
              : "text-zinc-300 hover:bg-zinc-800/80"
          }`}
        >
          Paste snippet
        </button>
        <button
          type="button"
          onClick={() => setMode("github")}
          className={`rounded-full px-3 py-1 transition ${
            mode === "github"
              ? "bg-zinc-50 text-zinc-950 shadow-sm"
              : "text-zinc-300 hover:bg-zinc-800/80"
          }`}
        >
          GitHub repo URL
        </button>
      </div>

      {mode === "snippet" ? (
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-2">
            <label className="text-sm font-medium text-zinc-100">
              Code snippet
            </label>
            <span className="text-[11px] text-zinc-500">
              Paste any file, function, or handler.
            </span>
          </div>
          <textarea
            className="min-h-[200px] w-full resize-y rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm font-mono text-zinc-50 outline-none ring-0 ring-offset-0 transition focus:border-zinc-500 focus:bg-zinc-950 focus:ring-2 focus:ring-emerald-500/40"
            placeholder="Paste any function, file, or snippet here…"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-100">
            GitHub repository URL
          </label>
          <input
            className="h-10 rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 text-sm text-zinc-50 outline-none ring-0 ring-offset-0 transition focus:border-zinc-500 focus:bg-zinc-950 focus:ring-2 focus:ring-emerald-500/40"
            placeholder="e.g. https://github.com/owner/repo"
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
          />
          <p className="text-xs text-zinc-500">
            This will soon trigger full-project ingestion and analysis for the
            given repository.
          </p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-100">
            Language (optional)
          </label>
          <input
            className="h-9 rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 text-sm text-zinc-50 outline-none ring-0 ring-offset-0 transition focus:border-zinc-500 focus:bg-zinc-950 focus:ring-2 focus:ring-emerald-500/40"
            placeholder="e.g. TypeScript, Python"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-100">
            Focus (optional)
          </label>
          <input
            className="h-9 rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 text-sm text-zinc-50 outline-none ring-0 ring-offset-0 transition focus:border-zinc-500 focus:bg-zinc-950 focus:ring-2 focus:ring-emerald-500/40"
            placeholder="e.g. security, performance, readability"
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-medium text-emerald-950 shadow-sm transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading && (
            <span className="h-3 w-3 animate-spin rounded-full border border-emerald-900 border-t-transparent" />
          )}
          {loading ? "Reviewing snippet…" : "Run code quality check"}
        </button>
        {error && (
          <p className="flex-1 text-right text-xs text-red-400 line-clamp-2">
            {error}
          </p>
        )}
      </div>

      {result && (
        <div className="mt-4 space-y-3 rounded-xl border border-zinc-800 bg-zinc-950/80 p-3 text-sm">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Summary
            </p>
            <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-[10px] text-zinc-400">
              {result.issues.length} issues
            </span>
          </div>
          <p className="text-sm text-zinc-200">{result.overallSummary}</p>
          <div className="mt-2 space-y-2">
            {result.issues.map((issue, idx) => (
              <div
                key={idx}
                className="group rounded-lg border border-zinc-800 bg-zinc-950/80 p-2.5 text-xs transition hover:border-emerald-500/60 hover:bg-zinc-950"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-zinc-50">{issue.title}</p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide ${
                      issue.severity.toLowerCase() === "high"
                        ? "bg-red-500/20 text-red-300"
                        : issue.severity.toLowerCase() === "medium"
                        ? "bg-amber-500/20 text-amber-200"
                        : "bg-emerald-500/15 text-emerald-200"
                    }`}
                  >
                    {issue.severity}
                  </span>
                </div>
                <p className="mt-1 text-zinc-300">{issue.description}</p>
                {issue.suggestion && (
                  <p className="mt-1 text-zinc-300">
                    <span className="font-semibold text-zinc-100">
                      Suggestion:{" "}
                    </span>
                    {issue.suggestion}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </form>
  );
}
