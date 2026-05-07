// /provider tour launcher button. Top-right of the page chrome. Fires
// kairos-provider-tour:start which is handled by ProviderTour mounted
// in the same page tree.

"use client";

import { estimateProviderTourMinutes } from "../lib/providerTourScript";

function startProviderTour() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("kairos-provider-tour:start"));
}

export default function ProviderTourLauncher() {
  const min = estimateProviderTourMinutes();
  return (
    <button
      type="button"
      onClick={startProviderTour}
      className="text-[12px] font-semibold text-graphite bg-amber hover:bg-amber/90 px-3 py-1.5 rounded-full transition-colors whitespace-nowrap"
      title={`Guided tour — ~${min} min`}
    >
      ✨ Take the tour <span className="opacity-80 font-normal">· ~{min} min</span>
    </button>
  );
}
