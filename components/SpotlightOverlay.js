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

// Cinematic Pass A → D → G — collision-aware tooltip placement.
//
// Pass A: scored against the spotlit anchor only.
// Pass D: scored against ALL [data-tour-anchor] panes with a +500
//         target-overlap penalty.
// Pass G (v3): the +500 penalty was too small — cards 2/6/7 kept landing
//         on top of the very content the bubble was describing because
//         viewport-clamp fallback could push the tooltip back into the
//         target. v3 promotes target overlap from "small penalty" to a
//         HARD CONSTRAINT (>100 px² target overlap disqualifies a
//         candidate), uses overlap FRACTION (overlap_area / pane_area)
//         instead of raw area so a small banner like the contradiction
//         alert weighs as heavily as a large grid pane, computes the
//         clamp BEFORE scoring (so a candidate's "real" final position
//         drives the verdict), and re-orders the position bias to
//         top > side > bottom per master task ("ABOVE or to the SIDE").
//
// Sort priority among non-target-overlapping candidates:
//   1. In-viewport (no clipping) before clipping
//   2. Lower pane-fraction-overlap before higher
//   3. Smaller off-viewport clip area before larger
//   4. Position bias: top > right > left > bottom
//
// Fallback (all candidates overlap target ≥ 100 px²): pick the one
// with the smallest target overlap.

const POSITION_BIAS = { top: 0, right: 1, left: 2, bottom: 3 };
const TARGET_OVERLAP_HARD_THRESHOLD = 100; // px²
const PANE_FRACTION_TIE_EPSILON = 0.01;

function getContentPaneRects(activeAnchorName) {
  if (typeof document === "undefined") return [];
  const nodes = document.querySelectorAll("[data-tour-anchor]");
  const out = [];
  nodes.forEach((node) => {
    const name = node.getAttribute("data-tour-anchor");
    if (name === activeAnchorName) return;
    const r = node.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return;
    out.push({
      left: r.left,
      top: r.top,
      right: r.right,
      bottom: r.bottom,
      area: r.width * r.height,
      name,
    });
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
    { name: "top",    left: target.left, top: target.top - CINEMATIC_GAP - h },
    { name: "right",  left: target.right + CINEMATIC_GAP, top: target.top },
    { name: "left",   left: target.left - CINEMATIC_GAP - w, top: target.top },
    { name: "bottom", left: target.left, top: target.bottom + CINEMATIC_GAP },
  ];
  const margin = 16;
  const otherPanes = getContentPaneRects(activeAnchorName);

  const scored = candidates.map((c) => {
    // Pre-clamp original position.
    const orig = { left: c.left, top: c.top, right: c.left + w, bottom: c.top + h };
    // Off-viewport clip area (how much of the original tooltip falls
    // outside viewport bounds before clamping). Treated as a soft
    // penalty after pane fraction.
    const overshootLeft = Math.max(0, margin - orig.left);
    const overshootTop = Math.max(0, margin - orig.top);
    const overshootRight = Math.max(0, orig.right - (vw - margin));
    const overshootBottom = Math.max(0, orig.bottom - (vh - margin));
    const clipArea = (overshootLeft + overshootRight) * h + (overshootTop + overshootBottom) * w;
    // Clamped final position. The clamp is what the user actually sees,
    // so all overlap calculations score the clamped rect — not the
    // pre-clamp position.
    const left = clamp(orig.left, margin, vw - w - margin);
    const top = clamp(orig.top, margin, vh - h - margin);
    const r = { left, top, right: left + w, bottom: top + h };
    // Hard rule: post-clamp target overlap must be effectively zero.
    // 100 px² is a 10×10 sliver — anything larger means the tooltip is
    // sitting ON the very content it's narrating, which is the failure
    // mode Pass G fixes.
    const targetOverlap = rectIntersection(r, target);
    const targetInvalid = targetOverlap > TARGET_OVERLAP_HARD_THRESHOLD;
    // Pane overlap as FRACTION of each pane's area, summed. Using
    // fraction (not absolute area) means covering 100% of a small but
    // important banner (like the red CONTRADICTION HOLD alert) costs
    // as much as covering 100% of a large grid pane — they're both
    // 1.0. Prevents the picker from cheerfully obliterating a small
    // critical pane just because its absolute area was small.
    let paneFraction = 0;
    for (const pane of otherPanes) {
      const overlap = rectIntersection(r, pane);
      if (overlap > 0 && pane.area > 0) {
        paneFraction += overlap / pane.area;
      }
    }
    // v3.0 Master Prompt 2 / Fix 2d Bug 4 — when a candidate is
    // significantly clipped, the clamp pushes the bubble far from the
    // target it's meant to describe (Card 4 RN Note: "top" has 0
    // pane-overlap so it won the paneFraction sort, but clipping
    // landed the bubble at viewport y=16, near the patient header,
    // not adjacent to the panel header at y=80+). Treat large clip
    // area as effective pane-overlap so the picker prefers an
    // in-viewport candidate that's actually next to the target.
    const clipPenalty = clipArea > 5000 ? 1.0 : 0;
    return {
      name: c.name,
      rect: r,
      targetOverlap,
      targetInvalid,
      paneFraction: paneFraction + clipPenalty,
      clipArea,
      bias: POSITION_BIAS[c.name] ?? 99,
    };
  });

  // v3.0 Master Prompt 2 / Bug 3 — pane-fraction now wins over the
  // in-viewport/clipped split. Previously a "right" candidate that
  // covered 70% of the next panel still beat a "bottom" candidate that
  // was 100px clipped — because in-viewport sorted first. The new
  // tour anchors source-pane on the left with panels right of it, so
  // "right" ALWAYS overlaps the panel being narrated next. Sorting
  // pane-fraction first promotes the clean "bottom" candidate even if
  // it requires a tiny clamp.
  const valid = scored.filter((c) => !c.targetInvalid);
  if (valid.length > 0) {
    valid.sort((a, b) => {
      // 1. Smaller pane fraction wins (with epsilon to avoid jitter) —
      //    promoted from rule 2 in Pass G v3 because covering an
      //    upcoming pane is worse than a small viewport clip.
      if (Math.abs(a.paneFraction - b.paneFraction) > PANE_FRACTION_TIE_EPSILON) {
        return a.paneFraction - b.paneFraction;
      }
      // 2. In-viewport candidates beat clipping candidates.
      const aClip = a.clipArea > 0;
      const bClip = b.clipArea > 0;
      if (aClip !== bClip) return aClip ? 1 : -1;
      // 3. Smaller clip area wins.
      if (a.clipArea !== b.clipArea) return a.clipArea - b.clipArea;
      // 4. Position bias: top > right > left > bottom.
      return a.bias - b.bias;
    });
    const winner = valid[0];
    return { left: winner.rect.left, top: winner.rect.top, name: winner.name };
  }
  // Every candidate clamps into the target — extreme degenerate case
  // (target nearly covers the viewport). Pick the one with the smallest
  // target overlap so we cover the least content possible.
  scored.sort((a, b) => a.targetOverlap - b.targetOverlap);
  const fallback = scored[0];
  return {
    left: fallback.rect.left,
    top: fallback.rect.top,
    name: fallback.name + "-overlap",
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
    //
    // Pass G-fix #1 — Camera-bounce suppression. If the anchor is
    // already comfortably visible (≥60% of its height on-screen with
    // its center in viewport), skip the scrollIntoView entirely. This
    // is the dominant source of the "seasick" bounce: TourMode now
    // pre-frames the next anchor before showSpotlight, leaving this
    // overlay scroll redundant in the common case. Keeping the call
    // for the off-screen case preserves the safety net.
    async function initialize() {
      const el = findAnchor();
      if (el) {
        // Pass G-fix3 — In cinematic mode, TourMode's preframe runs
        // BEFORE this overlay mounts and is the authoritative camera
        // mover. Don't double-scroll here at all in cinematic mode —
        // even a partial-visibility re-center re-introduces the
        // bounce on Card 3 disposition (action-bar near doc bottom
        // can't truly center, so block:"center" computes a different
        // scroll than preframe's wide framing and the page jumps).
        // Outside cinematic mode the legacy scrollIntoView fallback
        // is preserved.
        if (!isCinematicMode() && typeof el.scrollIntoView === "function") {
          try {
            el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
          } catch {
            el.scrollIntoView();
          }
          await new Promise((r) => setTimeout(r, 450));
        }
      }
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
