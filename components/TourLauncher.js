// Phase 3.3 Tour Mode — launcher pills on the dashboard nav row.
// Two equal-weight options: Quick Tour (~12 min) and Deep Tour (~22 min).

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
        title="Guided 9-card tour, ~12 minutes"
      >
        ✨ Quick Tour
      </button>
      <button
        type="button"
        onClick={() => startTour("deep")}
        className="text-[12px] font-semibold text-bone hover:text-bone bg-graphite/60 hover:bg-graphite/80 border border-amber/60 px-3 py-1.5 rounded-full transition-colors whitespace-nowrap"
        title="Deep narration of all 9 cards, ~22 minutes"
      >
        Deep Tour
      </button>
    </span>
  );
}
