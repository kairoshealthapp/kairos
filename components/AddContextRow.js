// Phase 3.3 — `+ Add context` row. Visible but DISABLED tonight; wired
// in 3.4 alongside HVC chat plumbing.

"use client";

const QUICK_ACTIONS = [
  "I have forwarded the results to PCP as requested",
  "I have called the patient and reviewed results",
  "Patient agreed to plan via phone",
  "Patient declined Option 1, going with Option 2",
];

export default function AddContextRow() {
  return (
    <div
      className="kairos-card p-3 mt-4 flex items-center gap-3 flex-wrap opacity-60 cursor-not-allowed"
      title="wired in 3.4"
      aria-disabled="true"
    >
      <span className="kairos-kicker text-bone-muted">+ ADD CONTEXT</span>
      {QUICK_ACTIONS.map((q, i) => (
        <span
          key={i}
          className="text-[11px] text-bone-muted bg-platinum/40 border border-mist/60 rounded-pill px-3 py-1"
          title="wired in 3.4"
        >
          {q}
        </span>
      ))}
      <span className="kairos-data text-[11px] text-bone-muted/70 ml-auto">
        wired in 3.4
      </span>
    </div>
  );
}
