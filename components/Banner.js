// Phase 3.2-fix5 — verbatim copy of firekraker-monorepo/kairos/components/Banner.js.
export default function Banner() {
  return (
    <div
      className="w-full border-b border-amber/30 text-amber"
      style={{ backgroundColor: 'rgba(217, 161, 75, 0.10)' }}
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-1.5 flex items-center gap-2 text-[11px] tracking-[0.08em] uppercase font-medium">
        <span className="severity-dot severity-amber" />
        <span>DEMONSTRATION DATA</span>
        <span className="opacity-60">·</span>
        {/* Middle reinforcement sentence — desktop only. Removed on mobile to
            keep the banner on a single line at 375 px without overflow. The
            "DEMONSTRATION DATA" + "NO PHI" markers carry the governance
            signal on their own. */}
        <span className="opacity-90 normal-case tracking-normal hidden sm:inline">All patient information is fictional</span>
        <span className="opacity-60 hidden sm:inline">·</span>
        <span>NO PHI</span>
      </div>
    </div>
  );
}
