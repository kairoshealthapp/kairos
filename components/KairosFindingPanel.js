// Phase-3.6 — Kairos Finding Panel. Used by the Pelc already-resolved
// fixture. Renders the auto-search result as a high-confidence sage banner
// with a "pulled from" sources list. Reads as "the answer is already in
// the chart, here's where Kairos found it."

"use client";

export default function KairosFindingPanel({ finding }) {
  if (!finding) return null;
  const sources = Array.isArray(finding.sources) ? finding.sources : [];

  return (
    <section className="kairos-card p-4 h-full flex flex-col overflow-hidden">
      <header className="flex items-center justify-between mb-2">
        <span className="kairos-kicker text-sage/90">KAIROS FINDING</span>
      </header>

      {/* Headline banner */}
      <div className="mb-3 rounded border border-sage/50 bg-sage/10 px-3 py-2">
        <div className="text-[13px] text-sage font-medium leading-snug">
          ✓ {finding.headline}
        </div>
        {finding.summary ? (
          <div className="text-[12px] text-bone leading-relaxed mt-1">
            {finding.summary}
          </div>
        ) : null}
      </div>

      {/* Auth + status chips */}
      {(finding.authTracking || finding.status) ? (
        <div className="flex flex-wrap gap-2 mb-3">
          {finding.authTracking ? (
            <span className="text-[11px] px-2 py-[2px] rounded border border-mist/60 bg-mist/10 text-bone-muted">
              Auth: <span className="text-bone">{finding.authTracking}</span>
            </span>
          ) : null}
          {finding.status ? (
            <span className="text-[11px] px-2 py-[2px] rounded border border-amber/40 bg-amber/10 text-amber">
              {finding.status}
            </span>
          ) : null}
        </div>
      ) : null}

      {/* Sources */}
      {sources.length ? (
        <div className="flex-1 overflow-auto">
          <div className="kairos-kicker text-bone-muted mb-1">PULLED FROM</div>
          <ul className="space-y-1">
            {sources.map((s, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-[12px] text-bone leading-snug"
              >
                <span className="text-bone-muted" aria-hidden>📄</span>
                <div className="flex-1 min-w-0">
                  <div>{s.name}</div>
                  <div className="text-[11px] text-bone-muted/80">{s.source}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
