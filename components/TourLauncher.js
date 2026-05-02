// Phase 3.3 Tour Mode — launcher pills on the dashboard nav row.
// Two equal-weight options: Quick Tour and Deep Tour.
//
// Runtime claims (e.g. "~13 min") were removed in the cinematic-pacing
// pass — cinematic camera holds and reveal-queue read times changed the
// total runtime, and pinning a number to the button risks stale claims
// when narration is edited or audio is regenerated. The buttons now
// communicate depth ("Quick" vs "Deep") without committing to a clock.

"use client";

function startTour(mode) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("kairos-tour:start", { detail: { mode } })
  );
}

export default function TourLauncher({ hidden }) {
  if (hidden) return null;
  return (
    <span className="inline-flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => startTour("quick")}
        className="text-[12px] font-semibold text-graphite bg-amber hover:bg-amber/90 px-3 py-1.5 rounded-full transition-colors whitespace-nowrap"
        title="Guided 9-card Quick Tour"
      >
        ✨ Quick Tour
      </button>
      <button
        type="button"
        onClick={() => startTour("deep")}
        className="text-[12px] font-semibold text-bone hover:text-bone bg-graphite/60 hover:bg-graphite/80 border border-amber/60 px-3 py-1.5 rounded-full transition-colors whitespace-nowrap"
        title="Deep narration of all 9 cards"
      >
        Deep Tour
      </button>
    </span>
  );
}
