"use client";

import { useMemo, useState } from "react";
import {
  Sparkles,
  RefreshCw,
  FileText,
  Send,
  CornerDownRight,
} from "lucide-react";
import {
  PA_DISPLAY_ORDER,
  allowedNextStages,
  stageLabel,
  stageTone,
  summarizeStageHistory,
} from "@/lib/types/priorAuth";

const TONE_PILL = {
  amber:
    "bg-[color:var(--color-flag-low-soft)] text-[color:var(--color-flag-low)]",
  green:
    "bg-[color:var(--color-flag-success-soft)] text-[color:var(--color-flag-success)]",
  red:
    "bg-[color:var(--color-flag-high-soft)] text-[color:var(--color-flag-high)]",
  purple:
    "bg-[color:var(--color-source-clinician-soft)] text-[color:var(--color-source-clinician)]",
  neutral: "bg-muted text-fg-muted",
};

const ARTIFACT_LABEL = {
  pa_form: "PA form",
  denial_letter: "Denial letter",
  appeal_letter: "Appeal letter",
  insurance_response: "Insurance response",
};

const ACTION_LABEL = {
  insurance_review: "Resubmit for review",
  approved: "Confirm approval received",
  denied: "Confirm denial",
  appealing: "Submit appeal",
  info_requested: "Request additional info",
  medication_dispensed: "Confirm dispensed",
  closed: "Close PA",
};

function relativeTime(iso) {
  if (!iso) return "";
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 0) return "now";
  const min = Math.round(ms / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} hr ago`;
  const days = Math.round(hr / 24);
  return `${days} d ago`;
}

function StagePill({ stage }) {
  const tone = stageTone(stage);
  return (
    <span
      className={`inline-flex items-center rounded-pill px-2 py-0.5 text-[11px] font-medium ${TONE_PILL[tone] || TONE_PILL.neutral}`}
    >
      {stageLabel(stage)}
    </span>
  );
}

function ProgressBar({ pa }) {
  const visited = new Set(pa.stageHistory.map((s) => s.stage));
  return (
    <ol className="flex flex-wrap items-center gap-x-2 gap-y-2 text-[12px]">
      {PA_DISPLAY_ORDER.map((stage, i) => {
        const isCurrent = pa.currentStage === stage;
        const isVisited = visited.has(stage);
        return (
          <li key={stage} className="flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-pill px-2 py-0.5 text-[11px] font-medium ${
                isCurrent
                  ? TONE_PILL[stageTone(stage)] + " ring-1 ring-current"
                  : isVisited
                  ? "bg-muted text-fg-muted"
                  : "bg-transparent text-fg-faint"
              }`}
            >
              {stageLabel(stage)}
            </span>
            {i < PA_DISPLAY_ORDER.length - 1 && (
              <span className="text-fg-faint/60">→</span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function StageHistory({ pa }) {
  const sorted = useMemo(
    () =>
      [...pa.stageHistory].sort(
        (a, b) => new Date(a.enteredAt).getTime() - new Date(b.enteredAt).getTime()
      ),
    [pa]
  );
  return (
    <ol className="space-y-3">
      {sorted.map((entry, i) => (
        <li key={entry.id} className="flex gap-3">
          <span className="mt-1 flex h-2 w-2 shrink-0 rounded-full bg-[color:var(--color-accent-soft)]" />
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <StagePill stage={entry.stage} />
              <span className="text-[12px] text-fg-faint">
                {entry.actor}
              </span>
              <span className="text-[12px] text-fg-faint">
                · {relativeTime(entry.enteredAt)}
              </span>
            </div>
            {entry.note && (
              <p className="text-[13px] leading-snug text-fg-muted">{entry.note}</p>
            )}
            {entry.artifacts?.length > 0 && (
              <ul className="space-y-0.5">
                {entry.artifacts.map((a, j) => (
                  <li
                    key={j}
                    className="inline-flex items-center gap-1.5 text-[12px] text-fg-faint"
                  >
                    <FileText size={11} strokeWidth={1.75} />
                    <span className="font-medium text-fg-muted">
                      {ARTIFACT_LABEL[a.type] || a.type}:
                    </span>
                    <span>{a.summary}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

function ContextActions({ pa, onAdvance }) {
  const next = allowedNextStages(pa.currentStage);
  if (next.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {next.map((stage) => (
        <button
          key={stage}
          type="button"
          onClick={() => onAdvance(stage)}
          className="inline-flex items-center gap-1.5 rounded-button border border-line-faint bg-surface px-3 py-1.5 text-[12px] font-medium text-fg transition-colors hover:bg-muted"
        >
          {ACTION_LABEL[stage] || stageLabel(stage)}
        </button>
      ))}
    </div>
  );
}

function MessageDraft({ draft }) {
  if (!draft) return null;
  return (
    <article className="space-y-4 rounded-card border border-line-faint bg-muted/30 p-4">
      <header className="text-[11px] font-semibold uppercase tracking-[0.05em] text-fg-muted">
        Patient update — draft
      </header>
      <section className="space-y-2">
        <div className="text-[11px] font-medium uppercase tracking-[0.05em] text-[color:var(--color-accent)]">
          MyChart message
        </div>
        {draft.mychartMessage.subject && (
          <div className="text-[13px] font-medium text-fg">
            {draft.mychartMessage.subject}
          </div>
        )}
        <p className="whitespace-pre-line text-[14px] leading-relaxed text-fg">
          {draft.mychartMessage.body}
        </p>
      </section>
      <section className="space-y-2 border-t border-line-faint pt-4">
        <div className="text-[11px] font-medium uppercase tracking-[0.05em] text-fg-muted">
          Nurse note
        </div>
        {draft.nurseNote.sections.map((s, i) => (
          <div key={i} className="space-y-0.5">
            <div className="text-[12px] font-medium text-fg">{s.heading}</div>
            <p className="whitespace-pre-line text-[13px] leading-relaxed text-fg-muted">
              {s.body}
            </p>
          </div>
        ))}
      </section>
      {draft.verifyFlags?.length > 0 && (
        <section className="space-y-1 rounded-button border border-[color:var(--color-flag-low-soft)] bg-[color:var(--color-flag-low-soft)]/40 p-3 text-[12px]">
          <div className="text-[11px] font-medium uppercase tracking-[0.05em] text-[color:var(--color-flag-low)]">
            Verify flags
          </div>
          <ul className="space-y-0.5 text-fg-muted">
            {draft.verifyFlags.map((f, i) => (
              <li key={i} className="flex items-start gap-1">
                <CornerDownRight
                  size={11}
                  strokeWidth={1.75}
                  className="mt-0.5 shrink-0 text-fg-faint"
                />
                {f}
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}

export default function PriorAuthTracker({ priorAuth, chartContext }) {
  const [pa] = useState(priorAuth);
  const [draft, setDraft] = useState(null);
  const [draftStatus, setDraftStatus] = useState("idle");
  const [error, setError] = useState(null);
  const [pendingAdvance, setPendingAdvance] = useState(null);

  const summary = summarizeStageHistory(pa);

  async function generateDraft() {
    setDraftStatus("loading");
    setError(null);
    try {
      const res = await fetch("/api/pa-status-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priorAuthId: pa.id, chartContext }),
      });
      const json = await res.json();
      if (!res.ok) {
        setDraftStatus("error");
        setError(json.error || `HTTP ${res.status}`);
        return;
      }
      setDraft(json.draft);
      setDraftStatus("idle");
    } catch (err) {
      setDraftStatus("error");
      setError(err.message);
    }
  }

  const isLoading = draftStatus === "loading";

  return (
    <article className="rounded-card border border-line-faint bg-surface">
      <header className="space-y-3 border-b border-line-faint p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-[16px] font-medium text-fg">{pa.medicationName}</h2>
            <p className="text-[13px] text-fg-muted">{pa.indication}</p>
            <div className="text-[12px] text-fg-faint">
              {pa.prescribingProvider} · {pa.insurancePlan} · {pa.pharmacy}
            </div>
          </div>
          <StagePill stage={pa.currentStage} />
        </div>
        <ProgressBar pa={pa} />
      </header>

      <div className="space-y-5 p-5">
        <section className="space-y-2">
          <div className="flex items-baseline justify-between">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.05em] text-fg-muted">
              Stage history
            </h3>
            <span className="text-[11px] text-fg-faint">
              {summary.totalStages} transitions · {summary.daysActive} days active
            </span>
          </div>
          <StageHistory pa={pa} />
        </section>

        <section className="space-y-2 border-t border-line-faint pt-4">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.05em] text-fg-muted">
            Next steps
          </h3>
          <ContextActions
            pa={pa}
            onAdvance={(stage) => setPendingAdvance(stage)}
          />
          {pendingAdvance && (
            <p className="text-[12px] text-fg-faint">
              {ACTION_LABEL[pendingAdvance]} — wiring deferred to a later phase. The
              transition would advance the PA to{" "}
              <code className="font-mono text-fg-muted">{pendingAdvance}</code>.{" "}
              <button
                type="button"
                onClick={() => setPendingAdvance(null)}
                className="text-[color:var(--color-accent)] hover:underline"
              >
                Dismiss
              </button>
            </p>
          )}
        </section>

        <section className="space-y-3 border-t border-line-faint pt-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.05em] text-fg-muted">
              Patient communication
            </h3>
            <button
              type="button"
              onClick={generateDraft}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 rounded-button bg-[color:var(--color-accent)] px-3 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-[color:var(--color-accent-hover)] disabled:opacity-40"
            >
              {draft ? (
                <RefreshCw
                  size={14}
                  strokeWidth={1.75}
                  className={isLoading ? "animate-spin" : ""}
                />
              ) : (
                <Sparkles size={14} strokeWidth={1.75} />
              )}
              {isLoading
                ? "Drafting"
                : draft
                ? "Regenerate update"
                : "Send patient update"}
            </button>
          </div>
          {error && (
            <p className="rounded-button border border-[color:var(--color-flag-high-soft)] bg-[color:var(--color-flag-high-soft)] p-3 text-[12px] text-[color:var(--color-flag-high)]">
              {error}
            </p>
          )}
          <MessageDraft draft={draft} />
          {draft && (
            <div className="flex items-center justify-end">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-button border border-line-faint bg-surface px-3 py-1.5 text-[12px] font-medium text-fg-muted hover:bg-muted hover:text-fg"
              >
                <Send size={12} strokeWidth={1.75} />
                Approve & send (mocked)
              </button>
            </div>
          )}
        </section>
      </div>
    </article>
  );
}
