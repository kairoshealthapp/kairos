"use client";

import { useMemo, useState } from "react";
import { Plus, X, MessageSquare } from "lucide-react";
import { SOURCE_META, SOURCE_VALUES } from "@/lib/types/evidence";

const FREEFORM_ID = "freeform";

function formatCapturedAt(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const sec = Math.round(diffMs / 1000);
  if (sec < 5) return "just now";
  if (sec < 60) return `${sec}s ago`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const time = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
  return time;
}

function SourcePill({ source, sourceDetail, size = "md" }) {
  const meta = SOURCE_META[source];
  if (!meta) return null;
  const sizeClass = size === "sm" ? "text-[11px] px-1.5 py-0.5" : "text-[12px] px-2 py-0.5";
  const label =
    source === "outside_clinician" && sourceDetail
      ? `${meta.label} · ${sourceDetail}`
      : meta.label;
  return (
    <span
      className={`inline-flex items-center rounded-pill font-medium ${meta.bg} ${meta.fg} ${sizeClass}`}
    >
      {label}
    </span>
  );
}

export default function EvidenceCapture({
  questions = [],
  evidence = [],
  defaultSource = "patient",
  onAddEvidence,
  onRemoveEvidence,
}) {
  const [mode, setMode] = useState("question"); // "question" | "freeform"
  const [questionId, setQuestionId] = useState("");
  const [answer, setAnswer] = useState("");
  const [source, setSource] = useState(defaultSource);
  const [sourceDetail, setSourceDetail] = useState("");
  const [freeformQuestion, setFreeformQuestion] = useState("");

  const answeredQuestionIds = useMemo(
    () => new Set(evidence.map((e) => e.questionId).filter((id) => id && id !== FREEFORM_ID)),
    [evidence]
  );

  const orderedQuestions = useMemo(() => {
    const unanswered = questions.filter((q) => !answeredQuestionIds.has(q.id));
    const answered = questions.filter((q) => answeredQuestionIds.has(q.id));
    return [...unanswered, ...answered];
  }, [questions, answeredQuestionIds]);

  const effectiveQuestionId =
    questionId || (orderedQuestions[0] && orderedQuestions[0].id) || "";

  const selectedQuestion = questions.find((q) => q.id === effectiveQuestionId);

  function reset() {
    setAnswer("");
    setSourceDetail("");
    setFreeformQuestion("");
    setQuestionId("");
  }

  function handleAdd() {
    const trimmedAnswer = answer.trim();
    if (!trimmedAnswer) return;

    if (mode === "freeform") {
      const qText = freeformQuestion.trim() || "Freeform observation";
      onAddEvidence({
        id: crypto.randomUUID(),
        questionId: FREEFORM_ID,
        questionText: qText,
        answer: trimmedAnswer,
        source,
        sourceDetail: sourceDetail.trim(),
        capturedAt: new Date().toISOString(),
      });
    } else {
      if (!selectedQuestion) return;
      onAddEvidence({
        id: crypto.randomUUID(),
        questionId: selectedQuestion.id,
        questionText: selectedQuestion.question,
        answer: trimmedAnswer,
        source,
        sourceDetail: sourceDetail.trim(),
        capturedAt: new Date().toISOString(),
      });
    }
    reset();
  }

  const noQuestions = questions.length === 0;
  const canAdd =
    answer.trim().length > 0 &&
    (mode === "freeform" || !!selectedQuestion);

  return (
    <article className="rounded-card border border-line-faint bg-surface">
      <header className="flex items-baseline justify-between gap-4 border-b border-line-faint p-5">
        <h2 className="text-[15px] font-medium text-fg">Evidence Capture</h2>
        <span className="text-[13px] text-fg-faint">
          {evidence.length} captured
        </span>
      </header>

      <div className="space-y-5 p-5">
        {noQuestions && mode === "question" ? (
          <p className="text-[13px] text-fg-muted">
            Generate triage questions first to capture answers.
          </p>
        ) : (
          <div className="space-y-3 rounded-button border border-line-faint bg-muted/40 p-4">
            {mode === "question" ? (
              <div className="space-y-2">
                <label className="block text-[11px] font-medium uppercase tracking-[0.05em] text-fg-faint">
                  Question
                </label>
                <select
                  value={effectiveQuestionId}
                  onChange={(e) => setQuestionId(e.target.value)}
                  className="w-full rounded-button border border-line-faint bg-surface px-3 py-2 text-[13px] text-fg"
                >
                  {orderedQuestions.map((q) => {
                    const answered = answeredQuestionIds.has(q.id);
                    return (
                      <option key={q.id} value={q.id}>
                        {answered ? "[answered] " : ""}
                        {q.id} · {q.question}
                      </option>
                    );
                  })}
                </select>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="block text-[11px] font-medium uppercase tracking-[0.05em] text-fg-faint">
                  Freeform observation
                </label>
                <input
                  type="text"
                  value={freeformQuestion}
                  onChange={(e) => setFreeformQuestion(e.target.value)}
                  placeholder="Optional: brief label (e.g. 'work of breathing')"
                  className="w-full rounded-button border border-line-faint bg-surface px-3 py-2 text-[13px] text-fg placeholder:text-fg-faint"
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-[11px] font-medium uppercase tracking-[0.05em] text-fg-faint">
                Answer
              </label>
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                rows={3}
                placeholder="Type the answer or observation"
                className="w-full resize-y rounded-button border border-line-faint bg-surface px-3 py-2 text-[13px] text-fg placeholder:text-fg-faint"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] font-medium uppercase tracking-[0.05em] text-fg-faint">
                Source
              </label>
              <div className="flex flex-wrap gap-1.5">
                {SOURCE_VALUES.map((s) => {
                  const meta = SOURCE_META[s];
                  const selected = source === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSource(s)}
                      aria-pressed={selected}
                      className={`inline-flex items-center rounded-pill px-2.5 py-1 text-[12px] font-medium transition-colors duration-100 ${
                        selected
                          ? `${meta.bg} ${meta.fg}`
                          : "bg-transparent text-fg-faint hover:bg-muted hover:text-fg-muted"
                      }`}
                    >
                      {meta.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] font-medium uppercase tracking-[0.05em] text-fg-faint">
                Source detail
                <span className="ml-1 normal-case tracking-normal text-fg-faint/70">(optional)</span>
              </label>
              <input
                type="text"
                value={sourceDetail}
                onChange={(e) => setSourceDetail(e.target.value)}
                placeholder="e.g. Renee, VA cardiology RN"
                className="w-full rounded-button border border-line-faint bg-surface px-3 py-2 text-[13px] text-fg placeholder:text-fg-faint"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => {
                  setMode((m) => (m === "freeform" ? "question" : "freeform"));
                  reset();
                  if (mode !== "freeform") setSource("nurse_observation");
                  else setSource(defaultSource);
                }}
                className="inline-flex items-center gap-1.5 rounded-button px-2 py-1 text-[12px] font-medium text-fg-muted transition-colors duration-100 hover:bg-muted hover:text-fg"
              >
                <MessageSquare size={13} strokeWidth={1.75} />
                {mode === "freeform" ? "Use question picker" : "Add freeform observation"}
              </button>
              <button
                type="button"
                onClick={handleAdd}
                disabled={!canAdd}
                className="inline-flex items-center gap-1.5 rounded-button bg-[color:var(--color-accent)] px-3 py-1.5 text-[13px] font-medium text-white transition-colors duration-100 hover:bg-[color:var(--color-accent-hover)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Plus size={14} strokeWidth={2} />
                Add
              </button>
            </div>
          </div>
        )}

        {evidence.length > 0 && (
          <ul className="space-y-2.5">
            {evidence.map((e) => (
              <li
                key={e.id}
                className="group rounded-button border border-line-faint bg-surface p-3.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="text-[13px] font-medium text-fg-muted">
                      {e.questionText}
                    </div>
                    <div className="text-[14px] leading-snug text-fg">{e.answer}</div>
                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      <SourcePill source={e.source} sourceDetail={e.sourceDetail} size="sm" />
                      <span className="text-[11px] text-fg-faint">
                        {formatCapturedAt(e.capturedAt)}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveEvidence(e.id)}
                    aria-label="Remove evidence"
                    className="shrink-0 rounded-button p-1 text-fg-faint opacity-0 transition-opacity duration-100 hover:bg-muted hover:text-fg group-hover:opacity-100 focus-visible:opacity-100"
                  >
                    <X size={14} strokeWidth={1.75} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}
