// Phase 3.3 Tour Mode — launcher pills on the dashboard nav row.
// Two equal-weight options: Quick Tour and Deep Tour.
//
// Pass E §5 — runtime estimate restored on each button. Computed from
// total narration character count via estimateTourMinutes() in
// lib/tourScript.js (same method used pre-cinematic-pass). Keeps the
// estimate in sync with narration edits automatically — no hardcoded
// clock to go stale.

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
        title={`Guided 10-card Quick Tour — ~${quickMin} min`}
      >
        ✨ Quick Tour <span className="opacity-80 font-normal">· ~{quickMin} min</span>
      </button>
      <button
        type="button"
        onClick={() => startTour("deep")}
        className="text-[12px] font-semibold text-bone hover:text-bone bg-graphite/60 hover:bg-graphite/80 border border-amber/60 px-3 py-1.5 rounded-full transition-colors whitespace-nowrap"
        title={`Deep narration of all 10 cards — ~${deepMin} min`}
      >
        Deep Tour <span className="opacity-80 font-normal">· ~{deepMin} min</span>
      </button>
    </span>
  );
}
