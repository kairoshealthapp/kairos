"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, FileText } from "lucide-react";
import { BP_THRESHOLDS } from "@/lib/clinical/bpTrend";

const DEFAULT_VISIBLE = 8;

function sbpClasses(sbp) {
  if (sbp >= BP_THRESHOLDS.SEVERE_SBP) {
    return "text-[color:var(--color-flag-high)]";
  }
  if (sbp >= BP_THRESHOLDS.ELEVATED_SBP) {
    return "text-[color:var(--color-flag-low)]";
  }
  if (sbp >= BP_THRESHOLDS.STAGE_2_SBP) {
    return "text-fg";
  }
  return "text-fg-muted";
}

function pctClasses(pct, thresholdAmber, thresholdRed) {
  if (pct >= thresholdRed) return "text-[color:var(--color-flag-high)]";
  if (pct >= thresholdAmber) return "text-[color:var(--color-flag-low)]";
  return "text-fg";
}

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

function formatReadingDate(date) {
  if (!date) return "";
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return date;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(d);
}

function trendLabel(t) {
  if (t === "rising") return "↑ rising";
  if (t === "falling") return "↓ falling";
  return "→ stable";
}

export default function BPLogTable({ readings, summary, capturedFrom, capturedAt }) {
  const [expanded, setExpanded] = useState(false);

  if (!readings?.length) return null;

  const chronologicalDesc = [...readings].sort((a, b) => {
    const ka = `${a.date}T${a.time || "00:00"}`;
    const kb = `${b.date}T${b.time || "00:00"}`;
    return kb.localeCompare(ka);
  });
  const visible = expanded ? chronologicalDesc : chronologicalDesc.slice(0, DEFAULT_VISIBLE);
  const hiddenCount = chronologicalDesc.length - DEFAULT_VISIBLE;

  return (
    <article className="rounded-card border border-line-faint bg-surface">
      <header className="flex items-baseline justify-between gap-4 border-b border-line-faint p-5">
        <div className="space-y-1">
          <h2 className="text-[15px] font-medium text-fg">Home BP Log</h2>
          <p className="text-[13px] text-fg-faint">
            {summary?.count || readings.length} readings
            {summary?.dateRange && (
              <>
                <span className="mx-1.5 text-fg-faint/60">·</span>
                {summary.dateRange}
              </>
            )}
            {summary?.trend && (
              <>
                <span className="mx-1.5 text-fg-faint/60">·</span>
                {trendLabel(summary.trend)}
              </>
            )}
          </p>
        </div>
      </header>

      {summary && (
        <div className="grid grid-cols-3 divide-x divide-line-faint border-b border-line-faint">
          <Stat label="Avg SBP" value={summary.avgSBP} unit="mmHg" />
          <Stat
            label="≥ 140"
            value={`${summary.pctAbove140}%`}
            valueClass={pctClasses(summary.pctAbove140, 25, 50)}
          />
          <Stat
            label="≥ 150"
            value={`${summary.pctAbove150}%`}
            valueClass={pctClasses(summary.pctAbove150, 25, 40)}
          />
        </div>
      )}

      <div className="px-5">
        <div className="grid grid-cols-[auto_auto_minmax(0,1fr)_auto] gap-x-4 border-b border-line-faint py-2 text-[11px] font-medium uppercase tracking-[0.05em] text-fg-faint">
          <span>Date</span>
          <span>Time</span>
          <span>SBP / DBP</span>
          <span>Note</span>
        </div>
        <ul>
          {visible.map((r, i) => (
            <li
              key={`${r.date}-${r.time}-${i}`}
              className="grid grid-cols-[auto_auto_minmax(0,1fr)_auto] items-center gap-x-4 border-b border-line-faint/60 py-2 text-[13px] last:border-b-0 hover:bg-muted/40"
            >
              <span className="text-fg-muted">{formatReadingDate(r.date)}</span>
              <span className="font-mono text-fg-faint">{r.time}</span>
              <span className="font-mono">
                <span className={`font-medium ${sbpClasses(r.sbp)}`}>{r.sbp}</span>
                <span className="text-fg-faint"> / {r.dbp}</span>
              </span>
              <span className="text-[12px] text-fg-faint">
                {r.note ? r.note : ""}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {hiddenCount > 0 && (
        <div className="border-t border-line-faint px-5 py-2">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-button px-2 py-1 text-[12px] font-medium text-fg-muted transition-colors duration-100 hover:bg-muted hover:text-fg"
          >
            {expanded ? (
              <>
                <ChevronUp size={14} strokeWidth={1.75} />
                Show fewer
              </>
            ) : (
              <>
                <ChevronDown size={14} strokeWidth={1.75} />
                Show all {chronologicalDesc.length} readings
              </>
            )}
          </button>
        </div>
      )}

      <footer className="flex items-center gap-1.5 border-t border-line-faint px-5 py-2.5 text-[12px] text-fg-faint">
        <FileText size={12} strokeWidth={1.75} />
        Captured from {capturedFrom === "paper_log" ? "paper log" : capturedFrom || "log"}
        {capturedAt && (
          <>
            <span className="mx-1 text-fg-faint/60">·</span>
            {formatDate(capturedAt)}
          </>
        )}
      </footer>
    </article>
  );
}

function Stat({ label, value, unit, valueClass = "text-fg" }) {
  return (
    <div className="px-5 py-4">
      <div className="text-[11px] font-medium uppercase tracking-[0.05em] text-fg-faint">
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className={`text-[22px] font-semibold tracking-[-0.01em] ${valueClass}`}>
          {value}
        </span>
        {unit && <span className="text-[12px] text-fg-faint">{unit}</span>}
      </div>
    </div>
  );
}
