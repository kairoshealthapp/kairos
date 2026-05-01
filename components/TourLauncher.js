// Phase 3.3 Tour Mode — launcher pills on the dashboard nav row.
// Two equal-weight options: Quick Tour and Deep Tour.
//
// Phase-3.4 polish: durations are no longer hardcoded. They are computed
// from estimateTourMinutes() in lib/tourScript.js, which sums every
// bubble's narration character count and divides by an empirical TTS-1
// onyx rate. The pill labels stay in sync any time narration is edited.

"use client";

import { estimateTourMinutes } from "@/lib/tourScript";

function startTour(mode) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("kairos-tour:start", { detail: { mode } })
  );
}

export default function TourLauncher({ hidden }) {
  if (hidden) return null;
  const quickMin = estimateTourMinutes("quick");
  const deepMin = estimateTourMinutes("deep");
  return (
    <span className="inline-flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => startTour("quick")}
        className="text-[12px] font-semibold text-graphite bg-amber hover:bg-amber/90 px-3 py-1.5 rounded-full transition-colors whitespace-nowrap"
        title={`Guided 9-card tour, ~${quickMin} minutes`}
      >
        ✨ Quick Tour · {quickMin} min
      </button>
      <button
        type="button"
        onClick={() => startTour("deep")}
        className="text-[12px] font-semibold text-bone hover:text-bone bg-graphite/60 hover:bg-graphite/80 border border-amber/60 px-3 py-1.5 rounded-full transition-colors whitespace-nowrap"
        title={`Deep narration of all 9 cards, ~${deepMin} minutes`}
      >
        Deep Tour · {deepMin} min
      </button>
    </span>
  );
}
