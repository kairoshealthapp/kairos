// Phase 3.3 Tour Mode — closing modal.
// Pass D Phase 1 — adds a card-navigation pill row so the user can jump
// back into any card from the end-of-tour dialog without restarting the
// whole tour.

"use client";

export default function TourEndModal({ onFreeExplore, onEnd, onJumpToCard, total }) {
  const pillCount = typeof total === "number" && total > 0 ? total : 0;
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
        {pillCount > 0 && onJumpToCard ? (
          <div className="mb-5">
            <span className="kairos-kicker text-amber/80 block mb-2">Jump back to a card</span>
            <div className="flex items-center gap-1 flex-wrap">
              {Array.from({ length: pillCount }, (_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onJumpToCard(idx)}
                  className="inline-flex items-center justify-center text-[12px] font-semibold rounded-full border min-w-[26px] h-[26px] px-2 text-bone-muted hover:text-bone bg-graphite/40 border-mist/60 hover:bg-graphite/70 transition-colors"
                  title={`Jump to Card ${idx + 1}`}
                  aria-label={`Jump to Card ${idx + 1}`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>
        ) : null}
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
