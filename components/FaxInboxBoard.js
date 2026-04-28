"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { FileText, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import {
  faxTypeLabel,
  faxStatusLabel,
  fieldLabel,
  matchSignalLabel,
  confidenceTone,
} from "@/lib/types/incomingFax";

const STATUS_TONE = {
  awaiting_review: "bg-[color:var(--color-flag-low-soft)] text-[color:var(--color-flag-low)]",
  auto_matched: "bg-[color:var(--color-flag-success-soft)] text-[color:var(--color-flag-success)]",
  human_matched: "bg-[color:var(--color-flag-success-soft)] text-[color:var(--color-flag-success)]",
  processed: "bg-[color:var(--color-source-clinician-soft)] text-[color:var(--color-source-clinician)]",
  rejected: "bg-muted text-fg-muted",
};

const FAX_TYPE_TONE = {
  home_inr: "bg-[color:var(--color-accent-soft)] text-[color:var(--color-accent)]",
  outside_records: "bg-muted text-fg-muted",
  lab_result: "bg-muted text-fg-muted",
  unknown: "bg-muted text-fg-muted",
};

const CONFIDENCE_DOT = {
  success: "bg-[color:var(--color-flag-success)]",
  low: "bg-[color:var(--color-flag-low)]",
  high: "bg-[color:var(--color-flag-high)]",
  neutral: "bg-fg-faint",
};

function relativeTime(iso) {
  if (!iso) return "";
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 0) return "now";
  const min = Math.round(ms / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h`;
  const days = Math.round(hr / 24);
  return `${days}d`;
}

export default function FaxInboxBoard({ initialFaxes }) {
  const [faxes, setFaxes] = useState(initialFaxes);
  const [selectedId, setSelectedId] = useState(initialFaxes[0]?.id || null);
  const [busy, setBusy] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  const [error, setError] = useState(null);

  const sorted = useMemo(
    () =>
      [...faxes].sort(
        (a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
      ),
    [faxes]
  );
  const selected = faxes.find((f) => f.id === selectedId) || null;

  function applyFaxUpdate(updated) {
    setFaxes((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
  }

  async function handleConfirm(candidate) {
    if (!selected) return;
    setBusy(`confirm_${candidate.patientId}`);
    setError(null);
    setConfirmation(null);
    try {
      const resp = await fetch("/api/fax-resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          faxId: selected.id,
          action: "confirm_match",
          patientId: candidate.patientId,
        }),
      });
      if (!resp.ok) {
        const e = await resp.json().catch(() => ({}));
        throw new Error(e.error || `Confirm failed (${resp.status})`);
      }
      const { fax: updated, encounter } = await resp.json();
      applyFaxUpdate(updated);
      setConfirmation({
        patientName: candidate.patientName,
        encounterId: encounter?.id || null,
        encounterCreated: !!encounter,
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  }

  async function handleReject() {
    if (!selected) return;
    setBusy("reject");
    setError(null);
    setConfirmation(null);
    try {
      const resp = await fetch("/api/fax-resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ faxId: selected.id, action: "reject" }),
      });
      if (!resp.ok) {
        const e = await resp.json().catch(() => ({}));
        throw new Error(e.error || `Reject failed (${resp.status})`);
      }
      const { fax: updated } = await resp.json();
      applyFaxUpdate(updated);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_1fr]">
      <aside className="space-y-1 overflow-hidden rounded-card border border-line-faint bg-surface">
        <div className="border-b border-line-faint px-3 py-2 text-[11px] font-medium uppercase tracking-[0.05em] text-fg-faint">
          Recent faxes
        </div>
        <ul className="divide-y divide-line-faint">
          {sorted.map((f) => (
            <li key={f.id}>
              <button
                type="button"
                onClick={() => {
                  setSelectedId(f.id);
                  setConfirmation(null);
                  setError(null);
                }}
                className={`flex w-full items-start gap-3 px-3 py-2.5 text-left text-[13px] transition-colors ${selectedId === f.id ? "bg-muted" : "hover:bg-muted/40"}`}
              >
                <FileText
                  size={16}
                  strokeWidth={1.5}
                  className="mt-0.5 shrink-0 text-fg-faint"
                />
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="truncate text-[13px] font-medium text-fg">
                    {f.senderHeader.split(" · ")[0]}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={`rounded-pill px-1.5 py-0.5 text-[10px] font-medium ${FAX_TYPE_TONE[f.faxType] || FAX_TYPE_TONE.unknown}`}
                    >
                      {faxTypeLabel(f.faxType)}
                    </span>
                    <span
                      className={`rounded-pill px-1.5 py-0.5 text-[10px] font-medium ${STATUS_TONE[f.status] || STATUS_TONE.rejected}`}
                    >
                      {faxStatusLabel(f.status)}
                    </span>
                  </div>
                  <div className="text-[11px] text-fg-faint">
                    {f.pageCount} page{f.pageCount === 1 ? "" : "s"} · {relativeTime(f.receivedAt)}
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <section className="min-w-0 space-y-4">
        {!selected ? (
          <div className="flex min-h-[40vh] items-center justify-center rounded-card border border-line-faint bg-surface text-[13px] text-fg-muted">
            Select a fax to view details.
          </div>
        ) : (
          <>
            <div className="rounded-card border border-line-faint bg-surface p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-[16px] font-medium text-fg">
                    {selected.senderHeader}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[12px] text-fg-faint">
                    <span
                      className={`rounded-pill px-1.5 py-0.5 text-[10px] font-medium ${FAX_TYPE_TONE[selected.faxType] || FAX_TYPE_TONE.unknown}`}
                    >
                      {faxTypeLabel(selected.faxType)}
                    </span>
                    <span
                      className={`rounded-pill px-1.5 py-0.5 text-[10px] font-medium ${STATUS_TONE[selected.status] || STATUS_TONE.rejected}`}
                    >
                      {faxStatusLabel(selected.status)}
                    </span>
                    <span>{selected.pageCount} page{selected.pageCount === 1 ? "" : "s"}</span>
                    <span>· received {relativeTime(selected.receivedAt)}</span>
                  </div>
                </div>
                <div className="font-mono text-[11px] text-fg-faint">{selected.id}</div>
              </div>

              <div className="mt-4">
                <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.05em] text-fg-faint">
                  Extracted fields
                </div>
                <div className="overflow-hidden rounded-card border border-line-faint">
                  <table className="w-full text-[13px]">
                    <thead className="bg-muted text-[11px] uppercase tracking-[0.05em] text-fg-faint">
                      <tr>
                        <th className="px-3 py-1.5 text-left font-medium">Field</th>
                        <th className="px-3 py-1.5 text-left font-medium">Value</th>
                        <th className="px-3 py-1.5 text-left font-medium">Confidence</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line-faint">
                      {selected.extractedFields.map((f, i) => {
                        const tone = confidenceTone(f.confidence);
                        return (
                          <tr key={i}>
                            <td className="px-3 py-1.5 text-fg-muted">
                              {fieldLabel(f.fieldName)}
                            </td>
                            <td className="px-3 py-1.5 font-mono text-fg">
                              {f.extractedValue}
                            </td>
                            <td className="px-3 py-1.5">
                              <span className="inline-flex items-center gap-1.5">
                                <span
                                  className={`h-2 w-2 rounded-full ${CONFIDENCE_DOT[tone]}`}
                                />
                                <span className="text-fg-muted">
                                  {Math.round(f.confidence * 100)}%
                                </span>
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-[11px] font-medium uppercase tracking-[0.05em] text-fg-faint">
                Match candidates
              </div>
              {selected.matchCandidates.length === 0 ? (
                <div className="rounded-card border border-line-faint bg-surface p-4 text-[13px] text-fg-muted">
                  No automatic match candidates. Use manual entry to look up a patient.
                </div>
              ) : (
                <ul className="space-y-2">
                  {selected.matchCandidates.map((c, i) => (
                    <li
                      key={c.patientId}
                      className="rounded-card border border-line-faint bg-surface p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-2">
                          <div className="flex items-baseline gap-2">
                            <span className="text-[15px] font-medium text-fg">
                              {c.patientName}
                            </span>
                            <span className="text-[12px] text-fg-faint">
                              DOB {c.dob}
                            </span>
                            {c.mrn && (
                              <span className="font-mono text-[11px] text-fg-faint">
                                · {c.mrn}
                              </span>
                            )}
                          </div>
                          <div className="text-[13px] text-fg-muted">
                            Match score:{" "}
                            <span className="font-medium text-fg">
                              {Math.round(c.matchScore * 100)}
                            </span>
                            <span className="text-fg-faint"> / 100</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {c.matchSignals.map((s) => (
                              <span
                                key={s}
                                className="rounded-pill bg-[color:var(--color-flag-success-soft)] px-1.5 py-0.5 text-[10px] font-medium text-[color:var(--color-flag-success)]"
                              >
                                {matchSignalLabel(s)}
                              </span>
                            ))}
                            {c.mismatchSignals.map((s) => (
                              <span
                                key={s}
                                className="rounded-pill bg-[color:var(--color-flag-high-soft)] px-1.5 py-0.5 text-[10px] font-medium text-[color:var(--color-flag-high)]"
                              >
                                {matchSignalLabel(s)}
                              </span>
                            ))}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleConfirm(c)}
                          disabled={
                            busy === `confirm_${c.patientId}` ||
                            selected.status === "processed" ||
                            selected.status === "rejected"
                          }
                          className={`shrink-0 rounded-button px-3 py-1.5 text-[12px] font-medium transition-colors disabled:opacity-50 ${i === 0 ? "bg-[color:var(--color-accent)] text-white hover:bg-[color:var(--color-accent-hover)]" : "border border-line text-fg-muted hover:bg-muted hover:text-fg"}`}
                        >
                          {busy === `confirm_${c.patientId}` ? (
                            <span className="inline-flex items-center gap-1">
                              <Loader2 size={11} className="animate-spin" />
                              Confirming…
                            </span>
                          ) : (
                            "Confirm match"
                          )}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {confirmation && (
              <div className="rounded-card border border-line bg-[color:var(--color-flag-success-soft)] px-4 py-3 text-[13px] text-[color:var(--color-flag-success)]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} strokeWidth={1.75} />
                  <span>
                    Matched to {confirmation.patientName}.
                    {confirmation.encounterCreated &&
                      " Anticoagulation Visit encounter created."}
                  </span>
                </div>
                {confirmation.encounterCreated && confirmation.encounterId && (
                  <div className="mt-1.5 text-[12px]">
                    <Link
                      href="/dashboard"
                      className="underline hover:no-underline"
                    >
                      View encounter →
                    </Link>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="rounded-card border border-line bg-[color:var(--color-flag-high-soft)] px-4 py-2 text-[13px] text-[color:var(--color-flag-high)]">
                {error}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 rounded-card border border-line-faint bg-surface px-4 py-3">
              <button
                type="button"
                disabled
                title="Manual patient lookup not implemented in v6 mock"
                className="rounded-button border border-line px-3 py-1.5 text-[12px] text-fg-muted disabled:opacity-50"
              >
                No match — manual entry
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={
                  busy === "reject" ||
                  selected.status === "rejected" ||
                  selected.status === "processed"
                }
                className="inline-flex items-center gap-1.5 rounded-button border border-[color:var(--color-flag-high)] px-3 py-1.5 text-[12px] text-[color:var(--color-flag-high)] transition-colors hover:bg-[color:var(--color-flag-high-soft)] disabled:opacity-50"
              >
                <XCircle size={12} strokeWidth={1.75} />
                {busy === "reject" ? "Rejecting…" : "Reject fax"}
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
