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

const PADDING = 12;
const BUBBLE_W = 340;
const BUBBLE_H_EST = 200; // rough bubble height for edge-detection
const BUBBLE_M = 16; // gap between cutout and bubble

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

  // Bubble placement uses the resolved (edge-flipped) position.
  let bubbleStyle = { left: 24, top: 24 };
  if (rect) {
    const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
    const vh = typeof window !== "undefined" ? window.innerHeight : 800;
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
