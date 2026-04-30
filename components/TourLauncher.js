// Phase 3.3 Tour Mode — launcher button on the dashboard nav row.

"use client";

export default function TourLauncher({ onStart, hidden }) {
  if (hidden) return null;
  return (
    <button
      type="button"
      onClick={onStart}
      className="text-[12px] font-semibold text-graphite bg-amber hover:bg-amber/90 px-3 py-1.5 rounded-full transition-colors whitespace-nowrap"
      title="Guided 7-card tour, ~3 minutes"
    >
      ✨ Take a tour
    </button>
  );
}
