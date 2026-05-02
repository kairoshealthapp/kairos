// Cinematic camera primitive. Drives the page scroll so the viewer's
// "camera" frames the right element with the right amount of breathing
// room before the cursor or reveal queue acts.
//
// Two framings:
//   • wide  — target sits in viewport with ~200px breathing room above
//             and below. Used between artifact reveals to "pull back".
//   • tight — target centered in viewport with minimal padding. Used
//             when zooming in on a freshly-rendered artifact.
//
// Honors lib/featureFlags.js cinematicMode. When the flag is off the
// function is a no-op that resolves immediately so the caller can stay
// `await`-shaped without conditional branches in tour code.

import { isCinematicMode } from "./featureFlags";

const SCROLL_SETTLE_TIMEOUT_MS = 1500;

function resolveTarget(target) {
  if (!target) return null;
  if (typeof target === "string") {
    if (typeof document === "undefined") return null;
    return document.querySelector(target);
  }
  if (target && typeof target === "object" && "current" in target) {
    return target.current || null;
  }
  if (target && target.nodeType === 1) return target;
  return null;
}

function waitForScrollEnd(timeoutMs = SCROLL_SETTLE_TIMEOUT_MS) {
  if (typeof window === "undefined") return Promise.resolve();
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      window.removeEventListener("scrollend", onEnd);
      clearTimeout(timer);
      resolve();
    };
    const onEnd = () => finish();
    // Browsers without `scrollend` (older Safari) just fall through to the
    // timeout fallback; the camera move still completes, just without the
    // precise settle signal.
    window.addEventListener("scrollend", onEnd, { once: true });
    const timer = setTimeout(finish, timeoutMs);
  });
}

function applyWideMargin(el) {
  // "Wide" framing: scroll so the target element has ~200px breathing
  // room above and below in the viewport. We approximate this by
  // computing a target scrollTop where the element's center sits at the
  // viewport center but clamped so the element + 200px padding fits.
  if (typeof window === "undefined") return;
  const rect = el.getBoundingClientRect();
  const elTop = rect.top + window.scrollY;
  const elHeight = rect.height;
  const breathing = 200;
  const viewportHeight = window.innerHeight;
  // Target: position the element vertically centered, but if the element
  // is taller than (viewport - 2*breathing) prefer aligning its top with
  // the breathing room above so the head of the artifact is visible.
  let targetScroll;
  if (elHeight + 2 * breathing > viewportHeight) {
    targetScroll = elTop - breathing;
  } else {
    targetScroll = elTop - (viewportHeight - elHeight) / 2;
  }
  window.scrollTo({ top: Math.max(0, targetScroll), behavior: "smooth" });
}

function applyTightFraming(el) {
  // "Tight" framing piggybacks on the browser's native center-block so
  // the artifact lands where the eye expects. CursorGhost already uses
  // the same primitive for its own cursor scroll.
  try {
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  } catch {
    // ignore (older browsers fall back to instant scroll)
  }
}

function applyTopFraming(el) {
  // Pass E #3 — "Top" framing pins the element's TOP edge near the top
  // of the viewport so the viewer reads from the first item. Used on
  // Card 7 Stage 2 where mid-page centering buries Question 1.
  // ~80px of breathing room above the element so chrome doesn't crowd
  // the headline.
  if (typeof window === "undefined") return;
  try {
    const rect = el.getBoundingClientRect();
    const targetScroll = rect.top + window.scrollY - 80;
    window.scrollTo({ top: Math.max(0, targetScroll), behavior: "smooth" });
  } catch {
    try { el.scrollIntoView({ behavior: "smooth", block: "start" }); } catch {}
  }
}

export async function cameraGoto(target, options = {}) {
  if (!isCinematicMode()) return;
  const { framing = "wide", holdMs = 0 } = options;
  const el = resolveTarget(target);
  if (!el) {
    // Nothing to frame — still honor the hold so the caller's pacing
    // stays consistent regardless of DOM availability.
    if (holdMs > 0) await new Promise((r) => setTimeout(r, holdMs));
    return;
  }
  if (framing === "tight") {
    applyTightFraming(el);
  } else if (framing === "top") {
    applyTopFraming(el);
  } else {
    applyWideMargin(el);
  }
  await waitForScrollEnd();
  if (holdMs > 0) {
    await new Promise((r) => setTimeout(r, holdMs));
  }
}

export const __testInternals = { resolveTarget, waitForScrollEnd };
