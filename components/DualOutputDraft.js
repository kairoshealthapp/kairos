"use client";

import { useEffect, useState } from "react";
import { Sparkles, RefreshCw, Check, Send, FileCheck } from "lucide-react";

const VERIFY_RE = /\[verify:\s*([^\]]+)\]/gi;

function renderWithVerifyFlags(text) {
  if (!text) return null;
  const parts = [];
  let last = 0;
  let key = 0;
  let m;
  VERIFY_RE.lastIndex = 0;
  while ((m = VERIFY_RE.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push(
      <span
        key={key++}
        className="mx-0.5 inline-flex items-center rounded-pill bg-[color:var(--color-flag-low-soft)] px-1.5 py-0 align-middle text-[10px] font-medium text-[color:var(--color-flag-low)]"
      >
        verify: {m[1]}
      </span>
    );
    last = VERIFY_RE.lastIndex;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export default function DualOutputDraft({
  chartContext,
  resultNote,
  evidence,
  draft,
  onDraftGenerated,
}) {
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const [mychartSent, setMychartSent] = useState(false);
  const [noteFiled, setNoteFiled] = useState(false);

  useEffect(() => {
    if (!mychartSent) return;
    const t = setTimeout(() => setMychartSent(false), 2000);
    return () => clearTimeout(t);
  }, [mychartSent]);

  useEffect(() => {
    if (!noteFiled) return;
    const t = setTimeout(() => setNoteFiled(false), 2000);
    return () => clearTimeout(t);
  }, [noteFiled]);

  async function generate() {
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch("/api/dual-output", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chartContext, resultNote, evidence }),
      });
      const json = await res.json();
      if (!res.ok) {
        setStatus("error");
        setError(json.error ? `${json.error}: ${json.message || ""}` : `HTTP ${res.status}`);
        return;
      }
      if (onDraftGenerated) onDraftGenerated(json.draft);
      setStatus("idle");
    } catch (err) {
      setStatus("error");
      setError(err.message);
    }
  }

  const isLoading = status === "loading";
  const verifyCount = draft?.verifyFlags?.length || 0;

  return (
    <article className="rounded-card border border-line-faint bg-surface">
      <header className="flex items-start justify-between gap-4 border-b border-line-faint p-5">
        <div className="space-y-1">
          <h2 className="text-[15px] font-medium text-fg">Dual Output Draft</h2>
          {draft && (
            <p className="text-[12px] text-fg-faint">
              {verifyCount > 0
                ? `${verifyCount} verify flag${verifyCount === 1 ? "" : "s"}`
                : "No verify flags"}
              <span className="mx-1.5 text-fg-faint/60">·</span>
              {new Date(draft.generatedAt).toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={generate}
          disabled={isLoading || !resultNote?.body}
          className="inline-flex items-center gap-1.5 rounded-button bg-[color:var(--color-accent)] px-3 py-1.5 text-[13px] font-medium text-white transition-colors duration-100 hover:bg-[color:var(--color-accent-hover)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {draft ? (
            <RefreshCw size={14} strokeWidth={1.75} className={isLoading ? "animate-spin" : ""} />
          ) : (
            <Sparkles size={14} strokeWidth={1.75} />
          )}
          {isLoading ? "Generating" : draft ? "Regenerate" : "Generate"}
        </button>
      </header>

      <div className="p-5">
        {!draft && status !== "error" && (
          <p className="text-[13px] text-fg-muted">
            Generate to draft a patient MyChart message and a clinical Nurse Note from the
            same source material.
          </p>
        )}

        {status === "error" && (
          <div className="rounded-button border border-[color:var(--color-flag-high-soft)] bg-[color:var(--color-flag-high-soft)] p-4 text-[13px] text-[color:var(--color-flag-high)]">
            <div className="font-medium">Dual-output generation failed</div>
            <div className="mt-1 font-mono text-[12px]">{error}</div>
          </div>
        )}

        {draft && (
          <div
            className={`grid grid-cols-1 gap-6 transition-opacity duration-150 lg:grid-cols-2 ${
              isLoading ? "opacity-50" : ""
            }`}
          >
            <section className="space-y-3 rounded-card border border-line-faint bg-muted/30 p-4">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-fg-muted">
                <Send size={12} strokeWidth={1.75} />
                MyChart Message
              </div>
              {draft.mychartMessage.subject && (
                <div className="text-[13px] font-medium text-fg">
                  Subject: {draft.mychartMessage.subject}
                </div>
              )}
              <div className="whitespace-pre-wrap text-[14px] leading-relaxed text-fg">
                {draft.mychartMessage.body}
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setMychartSent(true)}
                  className="inline-flex items-center gap-1.5 rounded-button bg-[color:var(--color-accent)] px-3 py-1.5 text-[13px] font-medium text-white transition-colors duration-100 hover:bg-[color:var(--color-accent-hover)]"
                >
                  {mychartSent ? (
                    <>
                      <Check size={14} strokeWidth={2} />
                      Sent
                    </>
                  ) : (
                    <>
                      <Send size={14} strokeWidth={1.75} />
                      Approve &amp; Send MyChart
                    </>
                  )}
                </button>
              </div>
            </section>

            <section className="space-y-3 rounded-card border border-line-faint bg-muted/30 p-4">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-fg-muted">
                <FileCheck size={12} strokeWidth={1.75} />
                Nurse Note
              </div>
              <div className="space-y-3">
                {draft.nurseNote.sections.map((s, i) => (
                  <div key={i} className="space-y-1">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.05em] text-fg-muted">
                      {s.heading}
                    </div>
                    <div className="whitespace-pre-wrap text-[13px] leading-relaxed text-fg">
                      {renderWithVerifyFlags(s.body)}
                    </div>
                  </div>
                ))}
              </div>
              {verifyCount > 0 && (
                <div className="rounded-button border border-[color:var(--color-flag-low-soft)] bg-[color:var(--color-flag-low-soft)] p-2 text-[12px] text-[color:var(--color-flag-low)]">
                  <div className="font-medium">Verify before signing:</div>
                  <ul className="mt-1 list-disc pl-5">
                    {draft.verifyFlags.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setNoteFiled(true)}
                  className="inline-flex items-center gap-1.5 rounded-button bg-[color:var(--color-flag-success)] px-3 py-1.5 text-[13px] font-medium text-white transition-opacity duration-100 hover:opacity-90"
                >
                  {noteFiled ? (
                    <>
                      <Check size={14} strokeWidth={2} />
                      Filed
                    </>
                  ) : (
                    <>
                      <FileCheck size={14} strokeWidth={1.75} />
                      Approve &amp; File Nurse Note
                    </>
                  )}
                </button>
              </div>
            </section>
          </div>
        )}
      </div>
    </article>
  );
}
