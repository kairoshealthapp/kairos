"use client";

import { useEffect, useState } from "react";
import {
  Sparkles,
  RefreshCw,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  FileCheck,
} from "lucide-react";

const ACTION_TONE = {
  hold: "bg-[color:var(--color-flag-low-soft)] text-[color:var(--color-flag-low)]",
  continue: "bg-[color:var(--color-flag-success-soft)] text-[color:var(--color-flag-success)]",
};

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

function ScheduleRow({ entry }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <li className="border-b border-line-faint/60 last:border-b-0">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto_auto_auto] items-center gap-x-3 px-1 py-2 text-left text-[13px] hover:bg-muted/50"
      >
        {expanded ? (
          <ChevronDown size={14} strokeWidth={1.75} className="text-fg-faint" />
        ) : (
          <ChevronRight size={14} strokeWidth={1.75} className="text-fg-faint" />
        )}
        <span className="font-medium text-fg">{entry.medication}</span>
        <span
          className={`inline-flex items-center rounded-pill px-2 py-0.5 text-[11px] font-medium ${ACTION_TONE[entry.action] || "bg-muted text-fg-muted"}`}
        >
          {entry.action.toUpperCase()}
        </span>
        <span className="text-[12px] text-fg-muted">{entry.timing}</span>
        <span className="text-[12px] text-fg-faint">resume: {entry.resume}</span>
      </button>
      {expanded && (
        <div className="px-7 pb-3 text-[12px] leading-relaxed text-fg-muted">
          {entry.rationale}
          <div className="mt-1 text-[11px] text-fg-faint">
            Matched rule: <span className="font-mono">{entry.ruleMatched}</span>
          </div>
        </div>
      )}
    </li>
  );
}

function PatientInstructionsBlock({ instructions, onCopy, copied }) {
  return (
    <article className="rounded-card border border-line-faint bg-muted/30 p-4">
      <header className="flex items-center justify-between gap-3 pb-3">
        <h3 className="text-[13px] font-semibold uppercase tracking-[0.05em] text-fg-muted">
          Patient instructions
        </h3>
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex items-center gap-1.5 rounded-button px-2 py-1 text-[12px] font-medium text-[color:var(--color-accent)] transition-colors duration-100 hover:bg-[color:var(--color-accent-soft)]"
        >
          {copied ? (
            <>
              <Check size={12} strokeWidth={2} />
              Copied
            </>
          ) : (
            <>
              <Copy size={12} strokeWidth={1.75} />
              Copy
            </>
          )}
        </button>
      </header>
      <div className="space-y-4">
        {instructions.headerSummary && (
          <p className="text-[14px] leading-relaxed text-fg">
            {instructions.headerSummary}
          </p>
        )}

        {instructions.holdMedications?.length > 0 && (
          <section>
            <div className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[color:var(--color-flag-low)]">
              DO NOT take
            </div>
            <ul className="mt-1 space-y-2 pl-3 text-[14px] text-fg">
              {instructions.holdMedications.map((m, i) => (
                <li key={i}>
                  <div className="font-medium">{m.name}</div>
                  <div className="text-[13px] text-fg-muted">{m.holdInstruction}</div>
                  {m.resumeInstruction && (
                    <div className="text-[13px] text-fg-muted">
                      Resume: {m.resumeInstruction}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {instructions.continueMedications?.length > 0 && (
          <section>
            <div className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[color:var(--color-flag-success)]">
              KEEP taking as usual
            </div>
            <ul className="mt-1 space-y-2 pl-3 text-[14px] text-fg">
              {instructions.continueMedications.map((m, i) => (
                <li key={i}>
                  <div className="font-medium">{m.name}</div>
                  <div className="text-[13px] text-fg-muted">{m.instruction}</div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {instructions.emergencyGuidance && (
          <section className="rounded-button border border-line-faint bg-surface p-3 text-[13px] leading-relaxed text-fg-muted">
            {instructions.emergencyGuidance}
          </section>
        )}
      </div>
    </article>
  );
}

export default function ProtocolApplier({
  patient,
  procedureContext,
  scheduleResult,
  onScheduleGenerated,
}) {
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const [instructions, setInstructions] = useState(null);
  const [instructionsStatus, setInstructionsStatus] = useState("idle");
  const [unmatchedExpanded, setUnmatchedExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  async function generate() {
    if (!patient?.id || !procedureContext?.protocolId) return;
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch("/api/apply-protocol", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          protocolId: procedureContext.protocolId,
          patientId: patient.id,
          scheduledDate: procedureContext.scheduledDate,
          procedureType: procedureContext.type,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setStatus("error");
        setError(json.error || `HTTP ${res.status}`);
        return;
      }
      onScheduleGenerated(json.result);
      setStatus("idle");
      setInstructions(null);
    } catch (err) {
      setStatus("error");
      setError(err.message);
    }
  }

  async function generateInstructions() {
    if (!scheduleResult) return;
    setInstructionsStatus("loading");
    try {
      const res = await fetch("/api/patient-instructions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patient, scheduleResult }),
      });
      const json = await res.json();
      if (!res.ok) {
        setInstructionsStatus("error");
        setError(json.error || `HTTP ${res.status}`);
        return;
      }
      setInstructions(json.instructions);
      setInstructionsStatus("idle");
    } catch (err) {
      setInstructionsStatus("error");
      setError(err.message);
    }
  }

  async function copyInstructions() {
    if (!instructions?.copyableText) return;
    try {
      await navigator.clipboard.writeText(instructions.copyableText);
      setCopied(true);
    } catch (err) {
      setError(`Copy failed: ${err.message}`);
    }
  }

  const isLoading = status === "loading";
  const isInstructionsLoading = instructionsStatus === "loading";
  const protocolName = scheduleResult?.protocolName || "Pre-procedure protocol";

  return (
    <article className="rounded-card border border-line-faint bg-surface">
      <header className="flex items-start justify-between gap-4 border-b border-line-faint p-5">
        <div className="space-y-1">
          <h2 className="text-[15px] font-medium text-fg">Pre-Procedure Med Schedule</h2>
          <p className="text-[12px] text-fg-faint">{protocolName}</p>
        </div>
        <button
          type="button"
          onClick={generate}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 rounded-button bg-[color:var(--color-accent)] px-3 py-1.5 text-[13px] font-medium text-white transition-colors duration-100 hover:bg-[color:var(--color-accent-hover)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {scheduleResult ? (
            <RefreshCw size={14} strokeWidth={1.75} className={isLoading ? "animate-spin" : ""} />
          ) : (
            <Sparkles size={14} strokeWidth={1.75} />
          )}
          {isLoading ? "Generating" : scheduleResult ? "Regenerate" : "Generate Schedule"}
        </button>
      </header>

      <div className="space-y-5 p-5">
        {status === "error" && (
          <div className="rounded-button border border-[color:var(--color-flag-high-soft)] bg-[color:var(--color-flag-high-soft)] p-4 text-[13px] text-[color:var(--color-flag-high)]">
            <div className="font-medium">Schedule generation failed</div>
            <div className="mt-1 font-mono text-[12px]">{error}</div>
          </div>
        )}

        {!scheduleResult && status !== "error" && (
          <p className="text-[13px] text-fg-muted">
            Generate a hold/continue schedule from {protocolName} applied to this patient's
            active medication list.
          </p>
        )}

        {scheduleResult && (
          <>
            <div className="flex flex-wrap items-baseline gap-2 text-[13px] text-fg-muted">
              <span className="font-medium text-fg">Procedure:</span>
              <span>{scheduleResult.procedureType?.replace(/_/g, " ")}</span>
              {scheduleResult.scheduledDate && (
                <>
                  <span className="text-fg-faint/60">·</span>
                  <span>scheduled {formatDate(scheduleResult.scheduledDate)}</span>
                </>
              )}
            </div>

            {scheduleResult.warnings?.length > 0 && (
              <div className="space-y-2 rounded-button border border-[color:var(--color-flag-low-soft)] bg-[color:var(--color-flag-low-soft)] p-4">
                <div className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.05em] text-[color:var(--color-flag-low)]">
                  <AlertTriangle size={12} strokeWidth={1.75} />
                  Safety chain warnings
                </div>
                <ul className="space-y-1 text-[13px] text-[color:var(--color-flag-low)]">
                  {scheduleResult.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.05em] text-fg-muted">
                Schedule
              </div>
              <ul>
                {scheduleResult.schedule.map((entry, i) => (
                  <ScheduleRow key={i} entry={entry} />
                ))}
              </ul>
            </div>

            {scheduleResult.unmatched?.length > 0 && (
              <div>
                <button
                  type="button"
                  onClick={() => setUnmatchedExpanded((v) => !v)}
                  className="inline-flex items-center gap-1.5 rounded-button px-2 py-1 text-[12px] font-medium text-fg-muted transition-colors duration-100 hover:bg-muted hover:text-fg"
                >
                  {unmatchedExpanded ? (
                    <ChevronDown size={12} strokeWidth={1.75} />
                  ) : (
                    <ChevronRight size={12} strokeWidth={1.75} />
                  )}
                  {scheduleResult.unmatched.length} medication
                  {scheduleResult.unmatched.length === 1 ? "" : "s"} not covered by protocol —
                  manual review needed
                </button>
                {unmatchedExpanded && (
                  <ul className="mt-2 space-y-1 pl-5 text-[13px] text-fg-muted">
                    {scheduleResult.unmatched.map((u, i) => (
                      <li key={i}>
                        <span className="font-medium text-fg">{u.medication}:</span>{" "}
                        {u.reason}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="border-t border-line-faint pt-4">
              <button
                type="button"
                onClick={generateInstructions}
                disabled={isInstructionsLoading}
                className="inline-flex items-center gap-1.5 rounded-button bg-[color:var(--color-flag-success)] px-3 py-1.5 text-[13px] font-medium text-white transition-opacity duration-100 hover:opacity-90 disabled:opacity-50"
              >
                <FileCheck size={14} strokeWidth={1.75} />
                {isInstructionsLoading
                  ? "Generating instructions"
                  : instructions
                  ? "Regenerate patient instructions"
                  : "Approve schedule & generate patient instructions"}
              </button>
            </div>

            {instructions && (
              <PatientInstructionsBlock
                instructions={instructions}
                onCopy={copyInstructions}
                copied={copied}
              />
            )}
          </>
        )}
      </div>
    </article>
  );
}
