// Phase 3.3 Tour Mode — Spotlight overlay.
// Outlines the active anchor element with a soft amber border + glow and
// floats a bubble next to it. Anchor is found by data-tour-anchor="<id>".
//
// Phase-3.4 quality fix: previously this component dimmed every other
// panel via an SVG cutout mask. That was too aggressive — viewers couldn't
// re-read previous panels while the next beat played. Now nothing is
// dimmed; only the active anchor gets visual emphasis.
//
// Re-measures the anchor's bounding rect on mount + window resize so the
// outline stays aligned even if the page reflows during typing.

"use client";

import { useEffect, useRef, useState } from "react";
import { isCinematicMode } from "@/lib/featureFlags";

const PADDING = 12;
const BUBBLE_W = 340;
const BUBBLE_H_EST = 200; // rough bubble height for edge-detection
const BUBBLE_M = 16; // gap between cutout and bubble
// Cinematic Pass A — Fix 3 uses a slightly larger gap so the bubble
// sits visually clear of the amber outline before the collision-aware
// picker runs.
const CINEMATIC_GAP = 24;

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

// Edge-detect: if the chosen position would push the bubble off-screen,
// flip to the opposite side. Returns the (possibly flipped) position.
function pickPosition(rect, position, vw, vh) {
  if (position === "right" && rect.x + rect.w + BUBBLE_M + BUBBLE_W > vw - 16) return "left";
  if (position === "left" && rect.x - BUBBLE_M - BUBBLE_W < 16) return "right";
  if (position === "bottom" && rect.y + rect.h + BUBBLE_M + BUBBLE_H_EST > vh - 16) return "top";
  if (position === "top" && rect.y - BUBBLE_M - BUBBLE_H_EST < 16) return "bottom";
  return position;
}

// Cinematic Pass A — Fix 3: collision-aware tooltip placement.
// Cinematic Pass D — Fix 3 v2: score against ALL visible content panes,
// not just the spotlit element. Brandon's smoke-test confirmed Pass A
// still failed on Cards 3, 8, 9 because a candidate could have zero
// overlap with the spotlit anchor and still cover the Order Pad / Nurse
// Note / Secure Chat thread. v2 reads every [data-tour-anchor] rect on
// the page and sums overlap area across all of them, with a +500px²
// penalty if the candidate also overlaps the target itself.
//
// Tiebreaker priority (when overlap scores tie): right > bottom > top >
// left. Right beats bottom because cards usually have rightward whitespace
// next to a primary spotlit pane.

const TIEBREAK_ORDER = { right: 0, bottom: 1, top: 2, left: 3 };
const TARGET_OVERLAP_PENALTY = 500;

function getContentPaneRects(activeAnchorName) {
  if (typeof document === "undefined") return [];
  const nodes = document.querySelectorAll("[data-tour-anchor]");
  const out = [];
  nodes.forEach((node) => {
    const name = node.getAttribute("data-tour-anchor");
    // Skip the active anchor — it's the spotlit element, scored separately
    // via the +500 penalty so the picker still avoids landing on top of
    // the very thing the bubble is narrating.
    if (name === activeAnchorName) return;
    const r = node.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return;
    out.push({ left: r.left, top: r.top, right: r.right, bottom: r.bottom, name });
  });
  return out;
}

function rectIntersection(a, b) {
  const x = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
  const y = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
  return x * y;
}

function pickCinematicPlacement(rectWithPadding, vw, vh, w, h, activeAnchorName) {
  const target = {
    left: rectWithPadding.x,
    top: rectWithPadding.y,
    right: rectWithPadding.x + rectWithPadding.w,
    bottom: rectWithPadding.y + rectWithPadding.h,
  };
  const candidates = [
    { name: "right",  left: target.right + CINEMATIC_GAP, top: target.top },
    { name: "left",   left: target.left - CINEMATIC_GAP - w, top: target.top },
    { name: "bottom", left: target.left, top: target.bottom + CINEMATIC_GAP },
    { name: "top",    left: target.left, top: target.top - CINEMATIC_GAP - h },
  ];
  const margin = 16;
  const otherPanes = getContentPaneRects(activeAnchorName);
  const scored = candidates.map((c) => {
    const r = { left: c.left, top: c.top, right: c.left + w, bottom: c.top + h };
    const fits =
      r.left >= margin &&
      r.top >= margin &&
      r.right <= vw - margin &&
      r.bottom <= vh - margin;
    // Sum overlap with every other content pane.
    let paneOverlap = 0;
    for (const pane of otherPanes) {
      paneOverlap += rectIntersection(r, pane);
    }
    // Penalty for sitting on top of the spotlit target itself.
    const targetOverlap = rectIntersection(r, target);
    const score = paneOverlap + (targetOverlap > 0 ? TARGET_OVERLAP_PENALTY + targetOverlap : 0);
    return { ...c, rect: r, fits, score, paneOverlap, targetOverlap };
  });
  const fitting = scored.filter((c) => c.fits);
  if (fitting.length > 0) {
    fitting.sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score;
      return TIEBREAK_ORDER[a.name] - TIEBREAK_ORDER[b.name];
    });
    const winner = fitting[0];
    return { left: winner.left, top: winner.top, name: winner.name };
  }
  // No candidate fits the viewport — fall back to the lowest-score
  // candidate even with edge clipping, then clamp into viewport.
  scored.sort((a, b) => {
    if (a.score !== b.score) return a.score - b.score;
    return TIEBREAK_ORDER[a.name] - TIEBREAK_ORDER[b.name];
  });
  const fallback = scored[0];
  return {
    left: clamp(fallback.left, margin, vw - w - margin),
    top: clamp(fallback.top, margin, vh - h - margin),
    name: fallback.name + "-clamp",
  };
}

export default function SpotlightOverlay({ anchor, position, title, body, onDismiss }) {
  const [rect, setRect] = useState(null);
  const [resolvedPosition, setResolvedPosition] = useState(position || "right");
  const rafRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    let intervalId = null;

    function findAnchor() {
      if (!anchor || anchor === "global") return null;
      return document.querySelector(`[data-tour-anchor="${anchor}"]`);
    }

    function measure() {
      const el = findAnchor();
      if (!el) {
        setRect(null);
        return;
      }
      const r = el.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      setRect({
        x: r.left - PADDING,
        y: r.top - PADDING,
        w: r.width + PADDING * 2,
        h: r.height + PADDING * 2,
      });
      setResolvedPosition(
        pickPosition(
          { x: r.left, y: r.top, w: r.width, h: r.height },
          position || "right",
          vw,
          vh
        )
      );
    }

    // Initial pass: scroll the anchor into view so both bubble + pane are
    // visible, then wait ~450ms for smooth-scroll to settle, then measure.
    async function initialize() {
      const el = findAnchor();
      if (el && typeof el.scrollIntoView === "function") {
        try {
          el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
        } catch {
          el.scrollIntoView();
        }
      }
      // Wait for scroll-settle. 450ms covers most smooth-scroll durations.
      await new Promise((r) => setTimeout(r, 450));
      if (cancelled) return;
      measure();
      // Re-measure periodically while typing animations may grow the anchor.
      // We do NOT re-scroll — only re-measure + re-flip — to avoid jitter.
      intervalId = setInterval(measure, 250);
    }

    initialize();

    function onResize() {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(measure);
    }
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);

    return () => {
      cancelled = true;
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
      if (intervalId) clearInterval(intervalId);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [anchor, position]);

  // Bubble placement.
  // Default until rect resolves keeps the legacy top-left until measure
  // completes — bubble is held at opacity 0 anyway in that window.
  let bubbleStyle = { left: 24, top: 24 };
  if (rect) {
    const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
    const vh = typeof window !== "undefined" ? window.innerHeight : 800;
    if (isCinematicMode()) {
      // Pass A Fix 3 + Pass D Fix 3 v2: collision-aware placement scored
      // against ALL visible content panes (not just the spotlit
      // anchor). The active anchor name is passed so it gets excluded
      // from the per-pane sum and scored via the +500 target-overlap
      // penalty instead.
      const placement = pickCinematicPlacement(rect, vw, vh, BUBBLE_W, BUBBLE_H_EST, anchor);
      bubbleStyle = { left: placement.left, top: placement.top };
    } else {
      // Legacy edge-flip placement preserved for cinematicMode=off.
      const pos = resolvedPosition;
      if (pos === "right") {
        bubbleStyle = {
          left: clamp(rect.x + rect.w + BUBBLE_M, 16, vw - BUBBLE_W - 16),
          top: clamp(rect.y, 16, vh - BUBBLE_H_EST),
        };
      } else if (pos === "left") {
        bubbleStyle = {
          left: clamp(rect.x - BUBBLE_W - BUBBLE_M, 16, vw - BUBBLE_W - 16),
          top: clamp(rect.y, 16, vh - BUBBLE_H_EST),
        };
      } else if (pos === "bottom") {
        bubbleStyle = {
          left: clamp(rect.x, 16, vw - BUBBLE_W - 16),
          top: clamp(rect.y + rect.h + BUBBLE_M, 16, vh - BUBBLE_H_EST),
        };
      } else {
        // top
        bubbleStyle = {
          left: clamp(rect.x, 16, vw - BUBBLE_W - 16),
          top: clamp(rect.y - BUBBLE_M - BUBBLE_H_EST, 16, vh - BUBBLE_H_EST),
        };
      }
    }
  }

  return (
    <div className="fixed inset-0 z-[60] pointer-events-none">
      {/* Highlight layer — no dimming. Just an amber outline + soft glow on
          the active anchor. Other panels stay at full opacity so the viewer
          can keep reading what was just typed. */}
      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
        {rect && (
          <rect
            x={rect.x}
            y={rect.y}
            width={rect.w}
            height={rect.h}
            rx="6"
            ry="6"
            fill="none"
            stroke="rgba(245, 158, 11, 0.85)"
            strokeWidth="2"
            style={{ filter: "drop-shadow(0 0 12px rgba(245, 158, 11, 0.45))" }}
          />
        )}
      </svg>

      {/* Bubble — held at opacity 0 until anchor rect resolves so the bubble
          never flashes at the default (24,24) position before the page has
          finished scrolling the anchor into view. The container above is
          pointer-events-none so HUD clicks pass through; the bubble itself
          re-enables pointer events for its Continue button. */}
      <div
        className="absolute kairos-card p-4 shadow-2xl pointer-events-auto"
        style={{
          width: BUBBLE_W,
          left: bubbleStyle.left,
          top: bubbleStyle.top,
          opacity: rect ? 1 : 0,
          transition: "opacity 180ms ease-out",
          background: "var(--color-platinum)",
          borderColor: "var(--color-amber)",
          borderWidth: 1,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {title ? (
          <h3 className="kairos-display text-bone text-[16px] font-medium leading-snug mb-2">
            {title}
          </h3>
        ) : null}
        <p className="text-[13px] text-bone leading-relaxed">{body}</p>
        {onDismiss ? (
          <div className="flex justify-end mt-3">
            <button
              type="button"
              onClick={onDismiss}
              className="text-[12px] font-semibold text-graphite bg-amber hover:bg-amber/90 px-3 py-1.5 rounded-full transition-colors"
            >
              Got it →
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
