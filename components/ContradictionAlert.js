// Pass D Phase 5 — Chart-contradiction alert banner.
// Renders above the Nurse Note pane on encounters where the patient
// statement contradicts the active chart (currently only Card 6 Foster
// — driven by fixture.contradictionHold === true). Brandon's smoke-test
// flagged the prior implementation that put the flag inline as the
// first line of the Nurse Note body — that mixed metadata with nurse
// documentation. This alert lifts it out as a structurally-separate
// red-bordered banner above the note.

"use client";

export default function ContradictionAlert() {
  return (
    <div
      data-tour-anchor="contradiction-alert"
      className="kairos-card border-l-4 border-l-oxblood mb-3 px-4 py-3"
      role="alert"
      aria-live="polite"
      style={{
        background: "rgba(110, 22, 28, 0.18)",
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="text-oxblood shrink-0"
        >
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <span className="kairos-kicker kairos-kicker-strong text-oxblood">
          CHART CONTRADICTION FLAG — DO NOT REPLY AUTONOMOUSLY
        </span>
      </div>
      <p className="text-[12px] text-bone-muted leading-relaxed">
        The patient statement disagrees with the active chart. Kairos has held
        all autonomous patient-facing output and forwarded the encounter to the
        provider for clarification before any reply.
      </p>
    </div>
  );
}
