"use client";

import { useEffect, useState } from "react";
import {
  Sparkles,
  RefreshCw,
  Send,
  PhoneCall,
  ClipboardCheck,
  Check,
  Copy,
} from "lucide-react";

const FLAG_LABELS = {
  overdue: "Lab is overdue",
  drift: "INR is trending out of range",
  unseen: "No clinic contact in over 90 days",
  stable: "In range, on schedule",
};

const FLAG_TONES = {
  overdue: "bg-[color:var(--color-flag-low-soft)] text-[color:var(--color-flag-low)]",
  drift: "bg-[color:var(--color-flag-low-soft)] text-[color:var(--color-flag-low)]",
  unseen: "bg-[color:var(--color-flag-high-soft)] text-[color:var(--color-flag-high)]",
  stable: "bg-muted text-fg-muted",
};

function formatStamp(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(d);
}

function inrTone(value, goalRange) {
  // goalRange like "2.0–3.0" — be lenient about the dash type
  const m = String(goalRange || "").match(/([\d.]+)\s*[–-]\s*([\d.]+)/);
  if (!m) return "text-fg";
  const low = parseFloat(m[1]);
  const high = parseFloat(m[2]);
  if (value < low) return "text-[color:var(--color-flag-low)]";
  if (value > high) return "text-[color:var(--color-flag-high)]";
  return "text-[color:var(--color-flag-success)]";
}

function INRSparkline({ values, goalRange }) {
  if (!values?.length) return null;
  const w = 120;
  const h = 32;
  const min = Math.min(...values, 1.5);
  const max = Math.max(...values, 4.0);
  const span = Math.max(0.1, max - min);
  const stepX = w / Math.max(1, values.length - 1);
  const points = values
    .map((v, i) => `${i * stepX},${h - ((v - min) / span) * h}`)
    .join(" ");

  // Goal range shaded band
  const m = String(goalRange || "").match(/([\d.]+)\s*[–-]\s*([\d.]+)/);
  let bandY = 0;
  let bandH = 0;
  if (m) {
    const lo = parseFloat(m[1]);
    const hi = parseFloat(m[2]);
    bandY = h - ((hi - min) / span) * h;
    bandH = ((hi - lo) / span) * h;
  }

  return (
    <svg width={w} height={h} className="overflow-visible">
      {bandH > 0 && (
        <rect
          x={0}
          y={bandY}
          width={w}
          height={bandH}
          fill="var(--color-flag-success-soft)"
        />
      )}
      <polyline
        points={points}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth="1.5"
      />
      {values.map((v, i) => (
        <circle
          key={i}
          cx={i * stepX}
          cy={h - ((v - min) / span) * h}
          r={2}
          fill="var(--color-accent)"
        />
      ))}
    </svg>
  );
}

function INRHistoryTable({ trend, goalRange, lastINRDate }) {
  if (!trend?.length) return null;
  // Synthesize a simple history table from trend; oldest at top.
  return (
    <div>
      <div className="grid grid-cols-[auto_1fr_auto] gap-x-4 border-b border-line-faint py-2 text-[11px] font-medium uppercase tracking-[0.05em] text-fg-faint">
        <span>#</span>
        <span>INR</span>
        <span>Goal</span>
      </div>
      <ul>
        {trend.map((v, i) => {
          const tone = inrTone(v, goalRange);
          const label = i === trend.length - 1 ? "latest" : `prior ${trend.length - 1 - i}`;
          return (
            <li
              key={i}
              className="grid grid-cols-[auto_1fr_auto] items-center gap-x-4 border-b border-line-faint/60 py-2 text-[13px] last:border-b-0"
            >
              <span className="text-fg-faint">{label}</span>
              <span className={`font-mono ${tone}`}>{v.toFixed(1)}</span>
              <span className="font-mono text-fg-faint">{goalRange}</span>
            </li>
          );
        })}
      </ul>
      <div className="pt-2 text-[12px] text-fg-faint">
        Latest draw: {formatStamp(lastINRDate)}
      </div>
    </div>
  );
}

function FlashButton({ onClick, idleIcon: IdleIcon, idleLabel, doneLabel, tone = "primary", title }) {
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => setDone(false), 2000);
    return () => clearTimeout(t);
  }, [done]);
  const cls =
    tone === "primary"
      ? "bg-[color:var(--color-accent)] text-white hover:bg-[color:var(--color-accent-hover)]"
      : tone === "success"
      ? "bg-[color:var(--color-flag-success)] text-white hover:opacity-90"
      : "border border-line-faint bg-surface text-fg-muted hover:bg-muted hover:text-fg";
  return (
    <button
      type="button"
      title={title}
      onClick={() => {
        onClick();
        setDone(true);
      }}
      className={`inline-flex w-full items-center justify-center gap-1.5 rounded-button px-3 py-2 text-[13px] font-medium transition-colors duration-100 ${cls}`}
    >
      {done ? (
        <>
          <Check size={14} strokeWidth={2} />
          {doneLabel}
        </>
      ) : (
        <>
          <IdleIcon size={14} strokeWidth={1.75} />
          {idleLabel}
        </>
      )}
    </button>
  );
}

export default function CohortDrillIn({ cohortMember, cohortDefinition }) {
  const [draft, setDraft] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  const k = cohortMember.keyData || {};
  const flags = cohortMember.flags || [];

  async function generateOutreach() {
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch("/api/cohort-outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cohortMember, cohortDefinition }),
      });
      const json = await res.json();
      if (!res.ok) {
        setStatus("error");
        setError(json.error ? `${json.error}: ${json.message || ""}` : `HTTP ${res.status}`);
        return;
      }
      setDraft(json.draft);
      setStatus("idle");
    } catch (err) {
      setStatus("error");
      setError(err.message);
    }
  }

  async function copyDraft() {
    if (!draft) return;
    const text = [
      `Subject: ${draft.mychartMessage.subject}`,
      "",
      draft.mychartMessage.body,
      "",
      "---",
      `Internal note: ${draft.internalNote.summary}`,
      `Action: ${draft.internalNote.action}`,
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch (err) {
      setError(`Copy failed: ${err.message}`);
    }
  }

  const isLoading = status === "loading";

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <div className="space-y-6">
        <article className="rounded-card border border-line-faint bg-surface">
          <header className="border-b border-line-faint p-5">
            <h2 className="text-[15px] font-medium text-fg">INR history</h2>
            <p className="mt-1 text-[13px] text-fg-faint">
              {k.indication}
              <span className="mx-1.5 text-fg-faint/60">·</span>
              Goal {k.goalRange}
            </p>
          </header>
          <div className="space-y-4 p-5">
            <INRSparkline values={k.last3Trend} goalRange={k.goalRange} />
            <INRHistoryTable
              trend={k.last3Trend}
              goalRange={k.goalRange}
              lastINRDate={k.lastINRDate}
            />
          </div>
        </article>

        <article className="rounded-card border border-line-faint bg-surface">
          <header className="border-b border-line-faint p-5">
            <h2 className="text-[15px] font-medium text-fg">Current regimen</h2>
          </header>
          <div className="space-y-2 p-5 text-[13px] text-fg">
            <div>
              <span className="font-medium">Dose:</span> {k.currentDose || "unknown"}
            </div>
            <div className="text-fg-muted">
              {k.daysSinceClinicContact} days since last clinic contact
            </div>
            {k.note && (
              <div className="rounded-button border border-[color:var(--color-flag-low-soft)] bg-[color:var(--color-flag-low-soft)] p-3 text-[12px] text-[color:var(--color-flag-low)]">
                {k.note}
              </div>
            )}
          </div>
        </article>
      </div>

      <div className="space-y-6">
        <article className="rounded-card border border-line-faint bg-surface">
          <header className="border-b border-line-faint p-5">
            <h2 className="text-[15px] font-medium text-fg">Why this patient is here</h2>
          </header>
          <div className="space-y-3 p-5">
            {flags.map((f) => (
              <div key={f} className="space-y-1">
                <span
                  className={`inline-flex items-center rounded-pill px-2 py-0.5 text-[11px] font-medium ${FLAG_TONES[f] || FLAG_TONES.stable}`}
                >
                  {f}
                </span>
                <p className="text-[13px] text-fg-muted">{FLAG_LABELS[f] || f}</p>
              </div>
            ))}
            <div className="pt-2 text-[12px] text-fg-faint">
              Priority score: <span className="font-mono">{cohortMember.priorityScore}</span>
            </div>
          </div>
        </article>

        <article className="rounded-card border border-line-faint bg-surface">
          <header className="border-b border-line-faint p-5">
            <h2 className="text-[15px] font-medium text-fg">Quick actions</h2>
          </header>
          <div className="space-y-2 p-5">
            <button
              type="button"
              onClick={generateOutreach}
              disabled={isLoading}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-button bg-[color:var(--color-accent)] px-3 py-2 text-[13px] font-medium text-white transition-colors duration-100 hover:bg-[color:var(--color-accent-hover)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {draft ? (
                <RefreshCw size={14} strokeWidth={1.75} className={isLoading ? "animate-spin" : ""} />
              ) : (
                <Sparkles size={14} strokeWidth={1.75} />
              )}
              {isLoading ? "Generating" : draft ? "Regenerate outreach" : "Generate INR recheck outreach"}
            </button>
            <FlashButton
              onClick={() => console.log("[stub] add to Patient Call basket", cohortMember.patientId)}
              idleIcon={PhoneCall}
              idleLabel="Add to Patient Call basket"
              doneLabel="Added"
              tone="ghost"
            />
            <FlashButton
              onClick={() => console.log("[stub] order recheck via provider", cohortMember.patientId)}
              idleIcon={Send}
              idleLabel="Order recheck via provider"
              doneLabel="Routed to Dr. Ballinger"
              tone="ghost"
            />
            <FlashButton
              onClick={() => console.log("[stub] mark reviewed", cohortMember.patientId)}
              idleIcon={ClipboardCheck}
              idleLabel="Mark reviewed without action"
              doneLabel="Marked reviewed"
              tone="ghost"
            />
          </div>
        </article>

        {status === "error" && (
          <div className="rounded-button border border-[color:var(--color-flag-high-soft)] bg-[color:var(--color-flag-high-soft)] p-4 text-[13px] text-[color:var(--color-flag-high)]">
            <div className="font-medium">Outreach generation failed</div>
            <div className="mt-1 font-mono text-[12px]">{error}</div>
          </div>
        )}

        {draft && (
          <article className="rounded-card border border-line-faint bg-surface">
            <header className="flex items-center justify-between border-b border-line-faint p-5">
              <h2 className="text-[15px] font-medium text-fg">Outreach draft</h2>
              <button
                type="button"
                onClick={copyDraft}
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
            <div className="space-y-4 p-5">
              <section>
                <div className="text-[11px] font-semibold uppercase tracking-[0.05em] text-fg-muted">
                  MyChart message
                </div>
                {draft.mychartMessage.subject && (
                  <div className="mt-1 text-[13px] font-medium text-fg">
                    {draft.mychartMessage.subject}
                  </div>
                )}
                <div className="mt-2 whitespace-pre-wrap text-[14px] leading-relaxed text-fg">
                  {draft.mychartMessage.body}
                </div>
              </section>
              <section className="space-y-2 border-t border-line-faint pt-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.05em] text-fg-muted">
                  Internal note
                </div>
                <div className="text-[13px] leading-relaxed text-fg">
                  {draft.internalNote.summary}
                </div>
                {draft.internalNote.action && (
                  <div className="text-[12px] text-fg-muted">
                    Action: {draft.internalNote.action}
                  </div>
                )}
              </section>
            </div>
          </article>
        )}
      </div>
    </div>
  );
}
