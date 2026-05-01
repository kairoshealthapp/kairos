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

      // Step 1 — at startTime, measure the target and begin the animated move.
      scheduleStep(() => {
        const el =
          typeof document !== "undefined"
            ? document.querySelector(cfg.target)
            : null;
        if (!el) {
          // Target not present in this route's DOM. Stay hidden.
          return;
        }
        const rect = el.getBoundingClientRect();
        const tx = rect.left + rect.width / 2;
        const ty = rect.top + rect.height / 2;
        setTransition(`transform ${moveDuration}ms ${easing}`);
        setVisible(true);
        posRef.current = { x: tx, y: ty };
        setPos({ x: tx, y: ty });
      }, startTime);

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

  const cursorStyle = {
    position: "fixed",
    left: 0,
    top: 0,
    width: 18,
    height: 18,
    transform: `translate3d(${pos.x - HOTSPOT_OFFSET}px, ${pos.y - 2}px, 0) scale(${
      bouncing ? 0.85 : 1
    })`,
    transition:
      transition === "none"
        ? "transform 200ms cubic-bezier(0.4, 0, 0.2, 1)"
        : `${transition}, transform 200ms cubic-bezier(0.4, 0, 0.2, 1)`,
    pointerEvents: "none",
    opacity: visible && !paused ? 1 : 0,
    zIndex: 65,
    filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.55)) drop-shadow(0 0 1px rgba(0,0,0,0.9))",
    willChange: "transform, opacity",
  };

  return (
    <>
      <svg
        ref={cursorRef}
        viewBox="0 0 18 18"
        aria-hidden="true"
        style={cursorStyle}
      >
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
      <style jsx>{`
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
      `}</style>
    </>
  );
}
