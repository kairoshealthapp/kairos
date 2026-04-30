// Phase 3.3 Tour Mode — closing modal.

"use client";

export default function TourEndModal({ onFreeExplore, onEnd }) {
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center" style={{ background: "rgba(11,14,19,0.72)" }}>
      <div
        className="kairos-card p-6 max-w-[520px] mx-4 shadow-2xl"
        style={{ background: "var(--color-platinum)", borderColor: "var(--color-amber)", borderWidth: 1 }}
        onClick={(e) => e.stopPropagation()}
      >
        <span className="kairos-kicker text-amber/80">END OF TOUR</span>
        <h2 className="kairos-display text-bone text-[22px] font-medium leading-tight mt-2 mb-3 tracking-tightest">
          That's Kairos.
        </h2>
        <p className="text-[14px] text-bone leading-relaxed mb-5">
          You already do all of this. Kairos doesn't replace you — it stops making you the database.
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onFreeExplore}
            className="text-[13px] font-semibold text-graphite bg-amber hover:bg-amber/90 px-4 py-2 rounded-full transition-colors"
          >
            Click around yourself
          </button>
          <button
            type="button"
            onClick={onEnd}
            className="text-[13px] font-medium text-bone-muted hover:text-bone bg-graphite/40 border border-mist/60 px-4 py-2 rounded-full transition-colors"
          >
            End tour
          </button>
        </div>
      </div>
    </div>
  );
}
