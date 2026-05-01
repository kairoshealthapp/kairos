// Phase-3.6 — Referral Packet Panel. The MOAT panel for the Sellman fixture.
// Renders a structured preview of the auto-assembled referral packet:
// destination + cover letter, auto-included items grouped (face sheet,
// clinical docs, media), and a collapsible "excluded by default" group.
// Each item has an inline checkbox the nurse can toggle (local state only
// for the May 5 demo — no propagation).

"use client";

import { useMemo, useState } from "react";

function CheckRow({ id, name, source, rationale, checked, onToggle, glyph, glyphClass }) {
  return (
    <li className="flex items-start gap-2 py-1">
      <input
        type="checkbox"
        checked={checked}
        onChange={() => onToggle(id)}
        className="mt-[3px] accent-sage"
      />
      <span className={`text-[12px] leading-4 ${glyphClass}`} aria-hidden>
        {glyph}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-[12px] text-bone leading-snug" title={rationale || ""}>
          {name}
        </div>
        {source ? (
          <div className="text-[11px] text-bone-muted/80 leading-snug">{source}</div>
        ) : null}
        {rationale ? (
          <div className="text-[11px] text-bone-muted/70 italic leading-snug">
            {rationale}
          </div>
        ) : null}
      </div>
    </li>
  );
}

export default function ReferralPacketPanel({ packet }) {
  if (!packet) return null;

  // Build a flat id-keyed inclusion map from the fixture defaults.
  const initial = useMemo(() => {
    const map = {};
    if (packet.items?.faceSheet) map["faceSheet"] = packet.items.faceSheet.included !== false;
    (packet.items?.clinicalDocumentation || []).forEach((d, i) => {
      map[`doc-${i}`] = d.included !== false;
    });
    (packet.items?.media || []).forEach((m, i) => {
      map[`media-${i}`] = m.included !== false;
    });
    (packet.items?.excludedByDefault || []).forEach((e, i) => {
      map[`exc-${i}`] = false;
    });
    return map;
  }, [packet]);

  const [included, setIncluded] = useState(initial);
  const [showExcluded, setShowExcluded] = useState(false);

  const toggle = (id) => setIncluded((prev) => ({ ...prev, [id]: !prev[id] }));

  const cl = packet.coverLetter || {};
  const coverTitle = cl.template
    ? `${cl.template}${cl.generatedAt ? ` · generated ${cl.generatedAt}` : ""}${
        cl.preview ? `\n\n${cl.preview}` : ""
      }`
    : "";

  const excluded = packet.items?.excludedByDefault || [];

  return (
    <section className="kairos-card p-4 h-full flex flex-col overflow-hidden">
      <header className="flex items-center justify-between mb-2">
        <span className="kairos-kicker text-sage/90">REFERRAL PACKET</span>
        <span className="text-[11px] text-bone-muted">{packet.submissionMethod}</span>
      </header>

      <div className="text-[12px] text-bone-muted mb-3">
        <strong className="text-bone">{packet.destination}</strong>
        {cl.template ? (
          <span
            className="ml-2 inline-flex items-center gap-1 px-2 py-[2px] rounded border border-sage/40 bg-sage/10 text-sage cursor-help"
            title={coverTitle}
          >
            cover letter ✓
          </span>
        ) : null}
      </div>

      <div className="flex-1 overflow-auto pr-1">
        {/* Auto-included */}
        <div className="mb-3">
          <div className="kairos-kicker text-bone-muted mb-1">AUTO-INCLUDED</div>

          {packet.items?.faceSheet ? (
            <ul className="mb-2">
              <CheckRow
                id="faceSheet"
                name="Face Sheet"
                source={packet.items.faceSheet.source}
                rationale="Standard registration packet — auto-built from chart"
                checked={!!included["faceSheet"]}
                onToggle={toggle}
                glyph="✓"
                glyphClass="text-sage"
              />
            </ul>
          ) : null}

          {packet.items?.clinicalDocumentation?.length ? (
            <div className="mb-2">
              <div className="text-[11px] text-bone-muted/80 mb-1">
                Clinical Documentation
              </div>
              <ul>
                {packet.items.clinicalDocumentation.map((d, i) => (
                  <CheckRow
                    key={`doc-${i}`}
                    id={`doc-${i}`}
                    name={d.name}
                    source={d.source}
                    rationale={d.rationale}
                    checked={!!included[`doc-${i}`]}
                    onToggle={toggle}
                    glyph="✓"
                    glyphClass="text-sage"
                  />
                ))}
              </ul>
            </div>
          ) : null}

          {packet.items?.media?.length ? (
            <div className="mb-2">
              <div className="text-[11px] text-bone-muted/80 mb-1">Media</div>
              <ul>
                {packet.items.media.map((m, i) => (
                  <CheckRow
                    key={`media-${i}`}
                    id={`media-${i}`}
                    name={m.name}
                    source={m.source}
                    rationale={m.rationale}
                    checked={!!included[`media-${i}`]}
                    onToggle={toggle}
                    glyph="✓"
                    glyphClass="text-sage"
                  />
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        {/* Excluded by default — collapsed */}
        {excluded.length ? (
          <div className="mt-3 border-t border-mist/40 pt-3">
            <button
              type="button"
              onClick={() => setShowExcluded((v) => !v)}
              className="kairos-kicker text-bone-muted hover:text-bone"
            >
              {showExcluded ? "Hide" : `Show ${excluded.length} excluded items`}
            </button>
            {showExcluded ? (
              <ul className="mt-2">
                {excluded.map((e, i) => (
                  <CheckRow
                    key={`exc-${i}`}
                    id={`exc-${i}`}
                    name={e.name}
                    source={e.source}
                    rationale={e.rationale}
                    checked={!!included[`exc-${i}`]}
                    onToggle={toggle}
                    glyph="⊘"
                    glyphClass="text-bone-muted"
                  />
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
