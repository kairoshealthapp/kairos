// Phase 3.5 — CursorGhost. A single SVG cursor that animates between
// targets during tour playback so the viewer can see *where* the workflow
// is happening before the click resolves. Mounts once at the AppChrome
// layer; reacts to kairos-tour:beat-start / :beat-end / :pause / :resume /
// :end window events. Pure visual — pointer-events: none, never intercepts.
//
// Beat schema (lib/tourScript.js):
//   cursor: {
//     target: "#some-selector",   // CSS selector (id or [data-encounter-id])
//     startTime: 300,             // ms after beat start to begin moving
//     arriveTime: 1800,           // ms after beat start when arrival completes
//     clickTime: 3300,            // ms after beat start to play click ripple
//                                 // (null/undefined = no auto-click)
//     easing: "...",              // optional, defaults to material standard
//   }
//
// If the target element isn't in the DOM yet (e.g. cursor wants the
// Authorize button while still on /rn), we silently skip the move. No
// errors, no half-states.

"use client";

import { useEffect, useRef, useState } from "react";

const DEFAULT_EASING = "cubic-bezier(0.4, 0, 0.2, 1)";

export default function CursorGhost() {
  // Position is committed to the inline `style` so CSS transitions can
  // interpolate it. We keep a ref of the latest pos so we can re-anchor
  // ripples at the right place after a move completes.
  const cursorRef = useRef(null);
  const posRef = useRef({ x: 0, y: 0 });
  const timeoutsRef = useRef([]);

  const [visible, setVisible] = useState(false);
  const [paused, setPaused] = useState(false);
  const [bouncing, setBouncing] = useState(false);
  const [transition, setTransition] = useState("none");
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [ripples, setRipples] = useState([]); // {id, x, y}

  // Initial spawn position — bottom-right of viewport, where a real user's
  // hand would rest. Set once on mount.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const x = window.innerWidth - 40;
    const y = window.innerHeight - 40;
    posRef.current = { x, y };
    setPos({ x, y });
  }, []);

  // Helper: clear all pending scheduled steps from the previous beat.
  function clearPendingTimers() {
    for (const t of timeoutsRef.current) clearTimeout(t);
    timeoutsRef.current = [];
  }

  // Helper: schedule a callback and remember its handle.
  function scheduleStep(fn, delayMs) {
    const handle = setTimeout(() => {
      // Drop self from the pending list so we don't try to clear an
      // already-fired timer later.
      timeoutsRef.current = timeoutsRef.current.filter((t) => t !== handle);
      fn();
    }, Math.max(0, delayMs));
    timeoutsRef.current.push(handle);
  }

  useEffect(() => {
    if (typeof window === "undefined") return;

    function onBeatStart(e) {
      const cfg = e && e.detail && e.detail.cursor;
      clearPendingTimers();
      if (!cfg || !cfg.target) {
        // Nothing to do for this beat. Don't toggle visibility — leave the
        // cursor wherever it last sat (cleanly off-stage on first beat).
        return;
      }

      const startTime = typeof cfg.startTime === "number" ? cfg.startTime : 0;
      const arriveTime =
        typeof cfg.arriveTime === "number" ? cfg.arriveTime : startTime + 1500;
      const clickTime = typeof cfg.clickTime === "number" ? cfg.clickTime : null;
      const easing = cfg.easing || DEFAULT_EASING;
      const moveDuration = Math.max(0, arriveTime - startTime);

      // Step 1 — at startTime, measure the target and begin the animated
      // move. If the target isn't in the DOM yet (route still hydrating,
      // ActionBar not yet mounted on the encounter detail page), retry
      // every 100ms for up to 3s. arriveTime/clickTime stay on the original
      // wall-clock schedule — only the move start is delayed.
      const TARGET_MAX_RETRIES = 30;
      const TARGET_RETRY_MS = 100;
      // How long we wait for `scrollIntoView({ behavior: "smooth" })` to
      // settle before re-measuring the target's viewport rect. 400ms covers
      // typical scroll distances; if a target is genuinely out of viewport
      // the smooth scroll usually completes in 250–350ms. We skip the
      // scroll-and-wait branch entirely outside tour playback so manual
      // navigation isn't disrupted.
      const SCROLL_SETTLE_MS = 400;
      function startMoveTo(rect) {
        const tx = rect.left + rect.width / 2;
        const ty = rect.top + rect.height / 2;
        // Drive the move through the DOM ref directly. Updating React
        // state (setTransition + setPos in one batch) causes the new
        // transition declaration and the new transform value to land in
        // the same render, and the browser then skips the interpolation
        // because the transition wasn't in effect before the value change.
        // Writing inline styles directly in the right order — transition
        // first, force a reflow so the browser commits it, then transform
        // — sidesteps the batching entirely.
        const node = cursorRef.current;
        if (node) {
          node.style.transition = `transform ${moveDuration}ms ${easing}, opacity 200ms ease-out`;
          node.style.opacity = "1";
          // Force the new transition declaration to take effect before
          // the value change in the next line.
          void node.offsetWidth;
          node.style.transform = `translate3d(${tx - HOTSPOT_OFFSET}px, ${ty - 2}px, 0)`;
        }
        // Keep React state in sync so later renders (beat-end fade, pause
        // toggles, etc.) carry the right values forward.
        setTransition(`transform ${moveDuration}ms ${easing}`);
        setVisible(true);
        posRef.current = { x: tx, y: ty };
        setPos({ x: tx, y: ty });
      }
      function isTourActive() {
        if (typeof window === "undefined") return false;
        try {
          return sessionStorage.getItem("kairos-tour-active") === "1";
        } catch {
          return false;
        }
      }
      function attemptMove(attempt) {
        const el =
          typeof document !== "undefined"
            ? document.querySelector(cfg.target)
            : null;
        if (!el) {
          if (attempt >= TARGET_MAX_RETRIES) {
            console.warn(
              "[CursorGhost] target not found after " +
                TARGET_MAX_RETRIES +
                " retries: " +
                cfg.target
            );
            return;
          }
          scheduleStep(() => attemptMove(attempt + 1), TARGET_RETRY_MS);
          return;
        }
        // During tour playback, scroll the target into the middle of the
        // viewport before the cursor begins its arrival animation —
        // otherwise on long encounter pages (e.g. Aldington's Generate
        // button living in the action bar at the bottom, or Card 7's
        // four-stage TRIAGE workflow) the cursor walks to a viewport y
        // that's below the fold and the viewer never sees the click. We
        // schedule the move 400ms after the scroll kicks off and re-read
        // getBoundingClientRect post-scroll so the cursor lands on the
        // target's NEW viewport position, not its pre-scroll position.
        if (isTourActive()) {
          try {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
          } catch (e) {
            // Older browsers without smooth-scroll support fall through.
          }
          scheduleStep(() => {
            const el2 =
              typeof document !== "undefined"
                ? document.querySelector(cfg.target)
                : null;
            if (!el2) return;
            startMoveTo(el2.getBoundingClientRect());
          }, SCROLL_SETTLE_MS);
          return;
        }
        startMoveTo(el.getBoundingClientRect());
      }
      scheduleStep(() => attemptMove(0), startTime);

      // Step 2 — at clickTime, ripple + bounce.
      if (clickTime != null) {
        scheduleStep(() => {
          const { x, y } = posRef.current;
          const id = Date.now() + Math.random();
          setRipples((r) => [...r, { id, x, y }]);
          // Drop the ripple after its animation completes.
          setTimeout(() => {
            setRipples((r) => r.filter((rp) => rp.id !== id));
          }, 650);
          // Bounce the cursor: 1.0 → 0.85 → 1.0 over 200ms.
          setBouncing(true);
          setTimeout(() => setBouncing(false), 200);
        }, clickTime);
      }
    }

    function onBeatEnd() {
      // Cancel any not-yet-fired steps for this beat (e.g. user skipped
      // before the click ripple). Keep the cursor at its current resting
      // position — the next beat will move it. If no follow-up cursor
      // arrives in 400ms, fade out so we don't pin a stale ghost on a
      // dashboard card.
      clearPendingTimers();
      const fadeHandle = setTimeout(() => {
        setVisible(false);
      }, 400);
      timeoutsRef.current.push(fadeHandle);
    }

    function onPause() {
      setPaused(true);
    }

    function onResume() {
      setPaused(false);
    }

    function onEnd() {
      clearPendingTimers();
      setVisible(false);
      setBouncing(false);
      setRipples([]);
      // Reset spawn position for next tour.
      const x = window.innerWidth - 40;
      const y = window.innerHeight - 40;
      posRef.current = { x, y };
      setTransition("none");
      setPos({ x, y });
    }

    window.addEventListener("kairos-tour:beat-start", onBeatStart);
    window.addEventListener("kairos-tour:beat-end", onBeatEnd);
    window.addEventListener("kairos-tour:pause", onPause);
    window.addEventListener("kairos-tour:resume", onResume);
    window.addEventListener("kairos-tour:end", onEnd);
    return () => {
      window.removeEventListener("kairos-tour:beat-start", onBeatStart);
      window.removeEventListener("kairos-tour:beat-end", onBeatEnd);
      window.removeEventListener("kairos-tour:pause", onPause);
      window.removeEventListener("kairos-tour:resume", onResume);
      window.removeEventListener("kairos-tour:end", onEnd);
      clearPendingTimers();
    };
  }, []);

  // Cursor is anchored at top-left of its 18x18 SVG. Center the hotspot
  // on the target by translating up/left by half the visual size (~9px).
  const HOTSPOT_OFFSET = 4; // visual tip of the arrow sits near (4, 2)

  // The cursor needs two independent animations: a translate (move) that
  // runs over moveDuration (~1500ms), and a scale-down "bounce" that runs
  // over 200ms when a click ripple fires. Putting both on the same element's
  // `transition: transform ...` causes a CSS-spec collision (the last
  // transform-transition listed always wins), which silently capped every
  // move at 200ms. The fix is structural: outer wrapper owns the translate
  // and its long transition; inner SVG owns the scale bounce via a CSS
  // keyframe animation that doesn't touch transition at all.
  const wrapperStyle = {
    position: "fixed",
    left: 0,
    top: 0,
    width: 18,
    height: 18,
    transform: `translate3d(${pos.x - HOTSPOT_OFFSET}px, ${pos.y - 2}px, 0)`,
    transition:
      transition === "none"
        ? "opacity 200ms ease-out"
        : `${transition}, opacity 200ms ease-out`,
    pointerEvents: "none",
    opacity: visible && !paused ? 1 : 0,
    zIndex: 65,
    willChange: "transform, opacity",
  };

  const svgStyle = {
    width: 18,
    height: 18,
    display: "block",
    transformOrigin: "4px 2px",
    animation: bouncing
      ? "kairos-cursor-bounce 200ms cubic-bezier(0.4, 0, 0.2, 1)"
      : undefined,
    filter:
      "drop-shadow(0 1px 2px rgba(0,0,0,0.55)) drop-shadow(0 0 1px rgba(0,0,0,0.9))",
  };

  return (
    <>
      <div ref={cursorRef} aria-hidden="true" style={wrapperStyle}>
        <svg viewBox="0 0 18 18" style={svgStyle}>
          {/* White arrow pointer with thin dark outline for contrast on any
              background. Shape mirrors the OS pointer so users read it
              instantly as "the cursor". */}
          <path
            d="M2 1 L2 14 L5.5 11 L8 16 L10.5 15 L8 10 L13 10 Z"
            fill="#FFFFFF"
            stroke="#1a1a1a"
            strokeWidth="0.8"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      {ripples.map((r) => (
        <span
          key={r.id}
          aria-hidden="true"
          style={{
            position: "fixed",
            left: r.x - 16,
            top: r.y - 16,
            width: 32,
            height: 32,
            borderRadius: "50%",
            border: "2px solid rgba(255, 255, 255, 0.9)",
            boxShadow: "0 0 4px rgba(0,0,0,0.4)",
            pointerEvents: "none",
            zIndex: 64,
            animation: "kairos-cursor-ripple 600ms ease-out forwards",
            willChange: "transform, opacity",
          }}
        />
      ))}
      <style jsx global>{`
        @keyframes kairos-cursor-ripple {
          0% {
            transform: scale(0);
            opacity: 1;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        @keyframes kairos-cursor-bounce {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(0.85);
          }
          100% {
            transform: scale(1);
          }
        }
      `}</style>
    </>
  );
}
