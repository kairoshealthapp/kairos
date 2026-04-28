"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";

function groupByCategory(questions) {
  const groups = new Map();
  for (const q of questions) {
    const key = q.category || "uncategorized";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(q);
  }
  return Array.from(groups.entries());
}

function formatCategory(key) {
  return key.replace(/_/g, " ");
}

export default function TriageQuestions({
  patientId,
  encounterId,
  callerContext,
  onQuestionsGenerated,
}) {
  const [state, setState] = useState({ status: "idle", data: null, error: null });

  async function generate() {
    setState({ status: "loading", data: null, error: null });
    try {
      const res = await fetch("/api/chart-aware-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId, encounterId, callerContext }),
      });
      const json = await res.json();
      if (!res.ok) {
        setState({
          status: "error",
          data: null,
          error: json.error || `HTTP ${res.status}`,
        });
        return;
      }
      setState({ status: "ready", data: json, error: null });
      if (onQuestionsGenerated && Array.isArray(json.questions)) {
        onQuestionsGenerated(json.questions);
      }
    } catch (err) {
      setState({ status: "error", data: null, error: err.message });
    }
  }

  const grouped = state.data?.questions ? groupByCategory(state.data.questions) : [];
  const isReady = state.status === "ready" && state.data;
  const isLoading = state.status === "loading";

  return (
    <article className="rounded-card border border-line-faint bg-surface">
      <header className="flex items-start justify-between gap-4 border-b border-line-faint p-5">
        <div className="space-y-1">
          <h2 className="text-[15px] font-medium text-fg">Triage Questions</h2>
          {isReady && (
            <p className="text-[12px] text-fg-faint">
              {state.data.metadata?.questionCount} questions
              <span className="mx-1.5 text-fg-faint/60">·</span>
              <span className="font-mono">{state.data.metadata?.chartContextHash}</span>
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={generate}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 rounded-button px-2.5 py-1.5 text-[13px] font-medium text-[color:var(--color-accent)] transition-colors duration-100 hover:bg-[color:var(--color-accent-soft)] disabled:opacity-50"
        >
          <RefreshCw size={14} strokeWidth={1.75} className={isLoading ? "animate-spin" : ""} />
          {isLoading ? "Generating" : isReady ? "Regenerate" : "Generate"}
        </button>
      </header>

      <div className="p-5">
        {state.status === "idle" && (
          <p className="text-[13px] text-fg-muted">
            Generate chart-aware triage questions for this encounter.
          </p>
        )}

        {state.status === "error" && (
          <div className="rounded-button border border-[color:var(--color-flag-high-soft)] bg-[color:var(--color-flag-high-soft)] p-4 text-[13px] text-[color:var(--color-flag-high)]">
            <div className="font-medium">Generation failed</div>
            <div className="mt-1 font-mono text-[12px]">{state.error}</div>
            <div className="mt-2 text-[12px] text-fg-muted">
              If this is the first run, confirm <code className="font-mono">KAIROS_ANTHROPIC_KEY</code>{" "}
              is set in <code className="font-mono">.env.local</code> and the dev server has been
              restarted.
            </div>
          </div>
        )}

        {isReady && (
          <div className="space-y-7">
            {grouped.map(([category, questions]) => (
              <section key={category} className="space-y-3">
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.05em] text-fg-muted">
                  {formatCategory(category)}
                </h3>
                <ol className="space-y-2.5">
                  {questions.map((q) => (
                    <li
                      key={q.id}
                      className="space-y-2.5 rounded-button bg-muted p-3.5"
                    >
                      <div className="text-[14px] font-medium leading-snug text-fg">
                        {q.question}
                      </div>
                      <div className="text-[12px] italic text-fg-muted">
                        <span className="not-italic font-medium text-fg-faint">Why: </span>
                        {q.rationale}
                      </div>
                      <div className="text-[11px] font-mono text-fg-faint">
                        {q.id}
                        <span className="mx-1.5 text-fg-faint/60">·</span>
                        {q.answerType}
                        {q.expectedRange && (
                          <>
                            <span className="mx-1.5 text-fg-faint/60">·</span>
                            {q.expectedRange}
                          </>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
