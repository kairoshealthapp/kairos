// Phase 3.2-fix6 + Phase 3.3 — adapted from firekraker-monorepo/kairos.
//
// Phase 3.3 changes:
//   • Click → router.push('/encounter/{id}?tab={tab}'). Replaces the
//     fix5/fix6 in-place selection toggle: the card itself is now a
//     navigation affordance, per docs/PHASE-3.3-DESIGN.md Section 11.
//   • `kind` / `isSelected` props removed from required surface (safe to
//     omit at the call site).

"use client";

import { useRouter } from "next/navigation";

const SEV_CLASS = {
  red: "severity-red",
  amber: "severity-amber",
  green: "severity-green",
};

export default function PatientCard({ patient, label, fromTab }) {
  const router = useRouter();
  const dot = SEV_CLASS[patient.severity] || "severity-amber";

  function handleClick() {
    const q = fromTab ? `?tab=${encodeURIComponent(fromTab)}` : "";
    router.push(`/encounter/${patient.id}${q}`);
  }
  function handleKey(e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  }

  return (
    <button
      type="button"
      className="block w-full text-left h-full"
      onClick={handleClick}
      onKeyDown={handleKey}
      aria-label={`Open encounter for ${patient.name}`}
    >
      <div className="kairos-card kairos-card-hover p-4 h-full flex flex-col">
        <div className="flex items-start gap-2">
          <span className={`severity-dot ${dot} mt-1.5`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="kairos-display text-bone text-[18px] font-medium leading-tight truncate">
                {patient.name}
              </h3>
              <span className="kairos-data text-[11px] text-bone-muted shrink-0">
                {patient.age}
                {patient.sex}
              </span>
            </div>
            {label && (
              <div className="kairos-kicker text-amber/80 mt-1">{label}</div>
            )}
            <p className="text-[13px] text-bone-muted mt-2 leading-relaxed line-clamp-2">
              {patient.reasonForColumn || patient.issueLine}
            </p>
          </div>
        </div>
      </div>
    </button>
  );
}
