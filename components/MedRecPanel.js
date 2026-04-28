"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  CornerDownRight,
} from "lucide-react";
import {
  countUnresolved,
  discrepancyComparator,
  discrepancyKindLabel,
} from "@/lib/types/preVisitTask";

const SEVERITY_TONE = {
  high:
    "bg-[color:var(--color-flag-high-soft)] text-[color:var(--color-flag-high)]",
  medium:
    "bg-[color:var(--color-flag-low-soft)] text-[color:var(--color-flag-low)]",
  low: "bg-muted text-fg-muted",
};

const ACTION_LABEL = {
  dismissed: "Dismissed",
  escalated: "Escalated to nurse",
  updated: "Epic updated",
};

const CAPTURE_METHOD_LABEL = {
  mychart_form: "MyChart pre-visit form",
  kiosk_tablet: "Rooming kiosk tablet",
  paper_ocr: "Paper intake (OCR)",
  phone_intake: "Phone intake",
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

function isMedInDiscrepancy(med, discrepancies) {
  const text = (med.medicationCodeableConcept?.text || "").toLowerCase();
  return (discrepancies || []).some((d) => {
    if (d.resolution) return false;
    if (!d.epicMedDescription) return false;
    return text && d.epicMedDescription.toLowerCase().includes(text.slice(0, 18));
  });
}

function SeverityPill({ severity }) {
  return (
    <span
      className={`inline-flex items-center rounded-pill px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.04em] ${SEVERITY_TONE[severity] || SEVERITY_TONE.low}`}
    >
      {severity}
    </span>
  );
}

function DiscrepancyCard({ discrepancy, onResolve }) {
  const [pendingAction, setPendingAction] = useState(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const resolved = !!discrepancy.resolution;

  if (resolved) {
    return (
      <li className="flex items-start gap-2 rounded-button border border-line-faint bg-muted/30 px-3 py-2 text-[12px] text-fg-muted">
        <CheckCircle2
          size={13}
          strokeWidth={1.75}
          className="mt-0.5 shrink-0 text-[color:var(--color-flag-success)]"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-medium text-fg">
              {discrepancyKindLabel(discrepancy.kind)}
            </span>
            <span className="text-fg-faint">
              · {ACTION_LABEL[discrepancy.resolution.action] || discrepancy.resolution.action}
            </span>
            <span className="text-fg-faint">
              · {discrepancy.resolution.actor}
            </span>
            <span className="text-fg-faint">
              · {relativeTime(discrepancy.resolution.timestamp)}
            </span>
          </div>
          {discrepancy.resolution.reason && (
            <div className="mt-0.5 text-fg-muted">
              <CornerDownRight size={11} strokeWidth={1.75} className="mr-1 inline-block text-fg-faint" />
              {discrepancy.resolution.reason}
            </div>
          )}
        </div>
      </li>
    );
  }

  async function confirm() {
    if (!pendingAction) return;
    if (!reason.trim()) return;
    setSubmitting(true);
    await onResolve(discrepancy.id, {
      action: pendingAction,
      reason: reason.trim(),
    });
    setSubmitting(false);
    setPendingAction(null);
    setReason("");
  }

  return (
    <li className="space-y-2 rounded-card border border-line-faint bg-surface p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <SeverityPill severity={discrepancy.severity} />
          <span className="text-[13px] font-medium text-fg">
            {discrepancyKindLabel(discrepancy.kind)}
          </span>
        </div>
      </div>
      <div className="space-y-1 text-[13px] leading-snug">
        {discrepancy.epicMedDescription && (
          <div className="text-fg-muted">
            <span className="text-[11px] uppercase tracking-[0.05em] text-fg-faint">Epic:</span>{" "}
            {discrepancy.epicMedDescription}
          </div>
        )}
        {discrepancy.patientReportedDescription && (
          <div className="text-fg-muted">
            <span className="text-[11px] uppercase tracking-[0.05em] text-fg-faint">Patient:</span>{" "}
            {discrepancy.patientReportedDescription}
          </div>
        )}
      </div>
      {discrepancy.clinicalNote && (
        <div className="text-[12px] leading-relaxed text-fg-muted">{discrepancy.clinicalNote}</div>
      )}
      {pendingAction ? (
        <div className="space-y-2 border-t border-line-faint pt-2">
          <label className="block text-[11px] uppercase tracking-[0.05em] text-fg-faint">
            Reason ({ACTION_LABEL[pendingAction]})
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={
              pendingAction === "updated"
                ? "Describe the change made to Epic"
                : pendingAction === "escalated"
                ? "Why does this need a nurse?"
                : "Why is this not actionable?"
            }
            className="block w-full rounded-button border border-line-faint bg-surface p-2 text-[13px] text-fg focus:border-[color:var(--color-accent)] focus:outline-none"
            rows={2}
          />
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setPendingAction(null);
                setReason("");
              }}
              className="rounded-button px-2 py-1 text-[12px] text-fg-muted hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirm}
              disabled={!reason.trim() || submitting}
              className="rounded-button bg-[color:var(--color-accent)] px-3 py-1 text-[12px] font-medium text-white transition-colors hover:bg-[color:var(--color-accent-hover)] disabled:opacity-40"
            >
              {submitting ? "Saving" : "Confirm"}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-end gap-1 border-t border-line-faint pt-2">
          <button
            type="button"
            onClick={() => setPendingAction("dismissed")}
            className="rounded-button px-2 py-1 text-[12px] text-fg-muted hover:bg-muted hover:text-fg"
          >
            Dismiss
          </button>
          <button
            type="button"
            onClick={() => setPendingAction("escalated")}
            className="rounded-button px-2 py-1 text-[12px] font-medium text-[color:var(--color-flag-low)] hover:bg-[color:var(--color-flag-low-soft)]"
          >
            Escalate to nurse
          </button>
          <button
            type="button"
            onClick={() => setPendingAction("updated")}
            className="rounded-button bg-[color:var(--color-accent)] px-2 py-1 text-[12px] font-medium text-white transition-colors hover:bg-[color:var(--color-accent-hover)]"
          >
            Update Epic
          </button>
        </div>
      )}
    </li>
  );
}

function EpicMedColumn({ epicMeds, discrepancies }) {
  return (
    <section className="space-y-2">
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.05em] text-fg-muted">
        Epic med list
        <span className="ml-2 font-normal text-fg-faint">{epicMeds.length} active</span>
      </h3>
      <ul className="space-y-1">
        {epicMeds.map((m) => {
          const flagged = isMedInDiscrepancy(m, discrepancies);
          return (
            <li
              key={m.id}
              className={`rounded-button border px-2 py-1.5 text-[12px] leading-snug ${flagged ? "border-[color:var(--color-flag-low-soft)] bg-[color:var(--color-flag-low-soft)]/40 text-fg" : "border-line-faint bg-surface text-fg-muted"}`}
            >
              {m.medicationCodeableConcept?.text || "Unknown"}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function PatientReportedColumn({ task }) {
  return (
    <section className="space-y-2">
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.05em] text-fg-muted">
        Patient reported
        <span className="ml-2 font-normal text-fg-faint">
          {task.patientReportedMeds.length} entries
        </span>
      </h3>
      <div className="text-[11px] text-fg-faint">
        {CAPTURE_METHOD_LABEL[task.captureMethod] || task.captureMethod} ·{" "}
        captured {relativeTime(task.capturedAt)}
      </div>
      <ul className="space-y-1">
        {task.patientReportedMeds.map((m) => (
          <li
            key={m.id}
            className="rounded-button border border-line-faint bg-surface px-2 py-1.5 text-[12px] leading-snug text-fg-muted"
          >
            <div className="text-fg">{m.reportedName}</div>
            <div className="text-fg-faint">
              {m.reportedDose ? `${m.reportedDose} · ` : ""}
              {m.reportedFrequency}
            </div>
            {m.reportedReason && (
              <div className="text-fg-faint">"{m.reportedReason}"</div>
            )}
          </li>
        ))}
      </ul>
      {task.patientNotes && (
        <p className="rounded-button border border-line-faint bg-muted/30 p-2 text-[12px] italic leading-relaxed text-fg-muted">
          “{task.patientNotes}”
        </p>
      )}
    </section>
  );
}

export default function MedRecPanel({
  task,
  encounterId,
  patientId,
  patientName,
  epicMeds,
  initialDiscrepancies,
  initialResolutions,
}) {
  const [resolutions, setResolutions] = useState(initialResolutions || {});
  const [attestStatus, setAttestStatus] = useState("idle");
  const [attestMessage, setAttestMessage] = useState(null);
  const [pendingClickType, setPendingClickType] = useState(null);
  const [confirmingUnresolved, setConfirmingUnresolved] = useState(false);

  const discrepancies = useMemo(() => {
    return (initialDiscrepancies || []).map((d) =>
      resolutions[d.id] ? { ...d, resolution: resolutions[d.id] } : d
    );
  }, [initialDiscrepancies, resolutions]);

  const sorted = useMemo(
    () => [...discrepancies].sort(discrepancyComparator),
    [discrepancies]
  );

  const unresolvedCount = countUnresolved(discrepancies);
  const totalCount = discrepancies.length;

  async function handleResolve(discrepancyId, { action, reason }) {
    const res = await fetch("/api/med-rec/resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        taskId: task.id,
        discrepancyId,
        action,
        reason,
        actor: "ma_demo",
        actorRole: "MA",
      }),
    });
    const json = await res.json();
    if (json.resolution) {
      setResolutions((prev) => ({ ...prev, [discrepancyId]: json.resolution }));
    }
  }

  async function postAttestation(clickType) {
    setAttestStatus("loading");
    const res = await fetch("/api/med-rec/attest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        taskId: task.id,
        encounterId,
        patientId,
        patientName,
        clickType,
        discrepancyCount: totalCount,
        unresolvedCount,
        actor: "ma_demo",
        actorRole: "MA",
      }),
    });
    const json = await res.json();
    if (json.entry) {
      setAttestStatus("done");
      setAttestMessage(json.entry);
    } else {
      setAttestStatus("error");
      setAttestMessage({ error: json.error || "Attestation failed" });
    }
  }

  function clickAttest() {
    if (unresolvedCount > 0 && !confirmingUnresolved) {
      setPendingClickType("medications_reviewed");
      setConfirmingUnresolved(true);
      return;
    }
    setConfirmingUnresolved(false);
    setPendingClickType(null);
    postAttestation("medications_reviewed");
  }

  return (
    <article className="rounded-card border border-line-faint bg-surface">
      <header
        className={`flex items-start justify-between gap-4 border-b p-5 ${unresolvedCount > 0 ? "border-[color:var(--color-flag-low-soft)] bg-[color:var(--color-flag-low-soft)]/30" : "border-line-faint"}`}
      >
        <div className="space-y-1">
          <h2 className="text-[15px] font-medium text-fg">
            Pre-Visit Medication Reconciliation
          </h2>
          <p className="text-[13px] text-fg-muted">
            {totalCount} discrepanc{totalCount === 1 ? "y" : "ies"}
            <span className="text-fg-faint/60"> · </span>
            <span className={unresolvedCount > 0 ? "text-[color:var(--color-flag-low)]" : "text-[color:var(--color-flag-success)]"}>
              {unresolvedCount} unresolved
            </span>
          </p>
        </div>
        {unresolvedCount > 0 ? (
          <ShieldAlert size={18} strokeWidth={1.5} className="text-[color:var(--color-flag-low)]" />
        ) : (
          <CheckCircle2 size={18} strokeWidth={1.5} className="text-[color:var(--color-flag-success)]" />
        )}
      </header>

      <div className="grid grid-cols-1 gap-5 p-5 lg:grid-cols-3">
        <EpicMedColumn epicMeds={epicMeds} discrepancies={discrepancies} />
        <PatientReportedColumn task={task} />
        <section className="space-y-2">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.05em] text-fg-muted">
            Discrepancies
          </h3>
          {sorted.length === 0 ? (
            <p className="rounded-button border border-line-faint bg-muted/30 p-3 text-[12px] text-fg-muted">
              No discrepancies detected.
            </p>
          ) : (
            <ul className="space-y-2">
              {sorted.map((d) => (
                <DiscrepancyCard key={d.id} discrepancy={d} onResolve={handleResolve} />
              ))}
            </ul>
          )}
        </section>
      </div>

      <footer className="space-y-2 border-t border-line-faint p-5">
        {confirmingUnresolved && (
          <div className="rounded-button border border-[color:var(--color-flag-low-soft)] bg-[color:var(--color-flag-low-soft)]/40 p-3 text-[13px]">
            <div className="flex items-start gap-2">
              <AlertTriangle
                size={14}
                strokeWidth={1.75}
                className="mt-0.5 shrink-0 text-[color:var(--color-flag-low)]"
              />
              <div className="space-y-2">
                <p className="text-fg">
                  {unresolvedCount} discrepanc{unresolvedCount === 1 ? "y" : "ies"} remain unresolved.
                  Are you sure you want to attest as reviewed without resolving?
                </p>
                <p className="text-[12px] text-fg-muted">
                  Kairos will record this as an unearned attestation in your personal integrity log.
                  Epic still receives the click — Kairos does not block the workflow.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmingUnresolved(false);
                      setPendingClickType(null);
                    }}
                    className="rounded-button px-3 py-1 text-[12px] text-fg-muted hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => postAttestation(pendingClickType || "medications_reviewed")}
                    className="rounded-button bg-[color:var(--color-flag-low)] px-3 py-1 text-[12px] font-medium text-white hover:opacity-90"
                  >
                    Attest anyway
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {attestStatus === "done" && attestMessage && (
          <div className="rounded-button border border-line-faint bg-muted/30 p-3 text-[13px] text-fg-muted">
            <div className="flex items-center gap-2">
              {attestMessage.earned ? (
                <CheckCircle2
                  size={14}
                  strokeWidth={1.75}
                  className="text-[color:var(--color-flag-success)]"
                />
              ) : (
                <ShieldAlert
                  size={14}
                  strokeWidth={1.75}
                  className="text-[color:var(--color-flag-low)]"
                />
              )}
              <span>
                {attestMessage.earned ? "Earned" : "Unearned"} attestation logged at{" "}
                {new Date(attestMessage.clickedAt).toLocaleTimeString()}
                {attestMessage.unresolvedCount > 0 && (
                  <> · {attestMessage.unresolvedCount} unresolved at click time</>
                )}
              </span>
            </div>
          </div>
        )}
        <div className="flex items-center justify-between gap-3">
          <p className="text-[12px] text-fg-muted">
            Personal integrity log records both earned and unearned attestations.
            Visible only to you.
          </p>
          <button
            type="button"
            onClick={clickAttest}
            disabled={attestStatus === "loading"}
            className="rounded-button bg-[color:var(--color-accent)] px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[color:var(--color-accent-hover)] disabled:opacity-40"
          >
            Mark Medications as Reviewed
          </button>
        </div>
      </footer>
    </article>
  );
}
