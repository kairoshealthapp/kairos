// Phase 3.6 — SBAR Provider Note panel.
// Renders the four SBAR sections (Situation, Background, Assessment,
// Recommendation) synthesized from chart context + patient responses.

"use client";

const SECTIONS = [
  { key: "s", label: "S — SITUATION" },
  { key: "b", label: "B — BACKGROUND" },
  { key: "a", label: "A — ASSESSMENT" },
  { key: "r", label: "R — RECOMMENDATION" },
];

export default function SBARNotePanel({ sbar }) {
  const data = sbar || {};
  return (
    <section className="kairos-card p-4 flex flex-col overflow-hidden">
      <header className="flex items-center justify-between mb-3">
        <span className="kairos-kicker kairos-kicker-strong text-amber/80">
          SBAR PROVIDER NOTE
        </span>
        <span className="text-[11px] text-bone-muted">Synthesized</span>
      </header>
      <div className="space-y-3">
        {SECTIONS.map((s) => (
          <div key={s.key}>
            <div className="kairos-kicker text-bone-muted/80 mb-1">{s.label}</div>
            <div className="text-[13px] text-bone leading-relaxed whitespace-pre-wrap">
              {data[s.key] || (
                <span className="text-bone-muted/60 italic">Pending provider review</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
