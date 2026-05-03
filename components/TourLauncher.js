// v3.0 Master Prompt 2 — Tour launcher. Single Tour button (the
// Quick/Deep distinction is dropped: the new tour walks pre-filled
// panels at one focused pace). Runtime estimate computed live from
// lib/tourScript.js so the hint stays in sync with narration edits.

"use client";

import { estimateTourMinutes } from "@/lib/tourScript";

function startTour() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("kairos-tour:start", { detail: { mode: "quick" } })
  );
}

export default function TourLauncher({ hidden }) {
  if (hidden) return null;
  const min = estimateTourMinutes("quick");
  return (
    <button
      type="button"
      onClick={startTour}
      className="text-[12px] font-semibold text-graphite bg-amber hover:bg-amber/90 px-3 py-1.5 rounded-full transition-colors whitespace-nowrap"
      title={`Guided 7-card tour — ~${min} min`}
    >
      ✨ Take the tour <span className="opacity-80 font-normal">· ~{min} min</span>
    </button>
  );
}
