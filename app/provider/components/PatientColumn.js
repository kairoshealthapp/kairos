// Clinic-specific column for the 4-column /provider layout. Each
// column has its own header (label + tour button) and renders a
// vertical stack of PatientCard items. Each card runs the cross-clinic
// rule engine against the patient bundle and surfaces firing rule
// summaries as compact finding chips. Clicking a card opens the
// briefing drawer.
//
// Mobile: each column header is tap-to-collapse. Tour anchors are
// preserved on the column-level elements so the per-clinic tour can
// drive cursor + highlight.

"use client";

import { useMemo } from "react";
import buildBundle from "../lib/buildBundle";
import runAllRules from "../lib/runAllRules";

function severityChipClasses(severity) {
  switch (severity) {
    case "critical":
      return "border-red-400/60 bg-red-900/15 text-red-200";
    case "warning":
      return "border-amber/60 bg-amber/10 text-amber";
    case "info":
      return "border-teal/60 bg-teal/10 text-teal";
    case "gap":
    default:
      return "border-mist/60 bg-platinum/30 text-bone-muted";
  }
}

function PatientCard({ visit, clinicKey, onSelect }) {
  const findings = useMemo(() => {
    const bundle = buildBundle(visit);
    return runAllRules(bundle);
  }, [visit]);

  const isPostHospital = visit.isPostHospital;
  const visible = findings.slice(0, 4);
  const extra = Math.max(0, findings.length - visible.length);

  return (
    <button
      type="button"
      data-encounter-id={visit.id}
      data-tour-card={visit.id}
      data-post-hospital={isPostHospital ? "true" : "false"}
      onClick={() => onSelect(visit, clinicKey)}
      className={
        "group relative w-full text-left flex flex-col gap-1.5 px-3 py-2.5 " +
        "bg-platinum/20 hover:bg-platinum/40 border border-mist/40 rounded " +
        "transition-colors focus:outline-none focus:bg-platinum/40"
      }
    >
      {isPostHospital && (
        <span
          aria-hidden="true"
          className="absolute left-0 top-0 bottom-0 w-[2px] bg-amber rounded-l"
        />
      )}
      <div className="flex items-baseline gap-2">
        <span className="kairos-data text-[12px] text-bone font-medium tabular-nums shrink-0">
          {visit.time}
        </span>
        <span className="text-[13px] text-bone font-medium truncate">
          {visit.name}
        </span>
        <span className="text-[11px] text-bone-muted ml-auto shrink-0">
          {visit.age}{visit.sex}
        </span>
      </div>
      <div className="text-[11px] text-bone-muted truncate">
        {visit.context ? `${visit.visitType} · ${visit.context}` : visit.visitType}
      </div>
      {findings.length > 0 && (
        <ul className="flex flex-wrap gap-1 mt-1">
          {visible.map((f, idx) => (
            <li
              key={f.ruleId + ":" + idx}
              title={f.summary}
              className={
                "text-[10.5px] leading-tight px-1.5 py-0.5 border rounded-sm uppercase tracking-wider " +
                severityChipClasses(f.severity)
              }
            >
              {f.subcategory || f.ruleId}
            </li>
          ))}
          {extra > 0 && (
            <li className="text-[10.5px] leading-tight px-1.5 py-0.5 border border-mist/40 rounded-sm text-bone-muted">
              +{extra}
            </li>
          )}
        </ul>
      )}
    </button>
  );
}

function ChevronIcon({ open }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={"transition-transform " + (open ? "rotate-180" : "")}
    >
      <polyline points="2,4 6,8 10,4" />
    </svg>
  );
}

export default function PatientColumn({
  clinicKey,
  label,
  schedule,
  highlighted,
  collapsed,
  onToggleCollapse,
  onVisitOpen,
  onTourStart,
  tourMinutes,
}) {
  return (
    <section
      data-tour-anchor={`clinic-column-${clinicKey}`}
      data-clinic={clinicKey}
      className={
        "flex-1 min-w-0 flex flex-col " +
        (highlighted ? "ring-1 ring-amber/40 rounded-md" : "")
      }
    >
      <header
        className={
          "flex items-center justify-between gap-2 px-3 py-2 rounded-t-md " +
          (highlighted
            ? "bg-amber/15 border border-amber/40"
            : "bg-platinum/30 border border-mist/40")
        }
      >
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-expanded={!collapsed}
          aria-controls={`clinic-column-body-${clinicKey}`}
          className="flex items-center gap-1.5 text-bone text-[13px] font-medium cursor-pointer"
        >
          <ChevronIcon open={!collapsed} />
          <span>{label}</span>
        </button>
        <button
          type="button"
          data-tour-anchor={`tour-button-${clinicKey}`}
          onClick={() => onTourStart(clinicKey)}
          title={`Guided tour — ~${tourMinutes} min`}
          className="text-[11px] font-semibold text-graphite bg-amber hover:bg-amber/90 px-2 py-1 rounded-full transition-colors whitespace-nowrap"
        >
          ✨ Tour · ~{tourMinutes} min
        </button>
      </header>
      <div
        id={`clinic-column-body-${clinicKey}`}
        className={
          "flex-1 flex flex-col gap-1.5 p-2 border-x border-b border-mist/40 rounded-b-md " +
          (collapsed ? "hidden" : "")
        }
      >
        {schedule.map((visit) => (
          <PatientCard
            key={visit.id}
            visit={visit}
            clinicKey={clinicKey}
            onSelect={onVisitOpen}
          />
        ))}
      </div>
    </section>
  );
}
