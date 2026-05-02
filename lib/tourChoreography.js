// Cinematic choreography primitive. Coordinates a cursor move with a
// camera move so the cursor leads and the camera follows on a short lag —
// the filmic feel where the eye tracks the cursor first, then the page
// settles around it.
//
// Public API: cursorThenCamera(target, options).
//   target  — a CSS selector string OR a ref OR a DOM element. The cursor
//             move is dispatched as a CursorGhost beat-start event with
//             this selector; the camera frames the same node.
//   options — { cameraLagMs?: number,        // default 200ms
//               zoomOnClick?: boolean,       // default false
//               cursorTiming?: { startTime, arriveTime, clickTime },
//               readMs?: number              // post-click hold; default 0
//             }
//
// Behavior:
//   1. Dispatch kairos-tour:beat-start with the cursor config so
//      CursorGhost begins its scripted move.
//   2. Wait cameraLagMs.
//   3. Call cameraGoto(target, { framing: 'wide' }) so the page settles
//      around the cursor's destination.
//   4. If clickTime is provided, await it (relative to dispatch t=0).
//   5. If zoomOnClick, after the click fire a tight-framing cameraGoto.
//   6. Hold readMs, then resolve.
//
// When cinematicMode is OFF, falls back to dispatching the cursor event
// with no separate camera coordination — the existing CursorGhost
// scroll-into-view branch handles framing as it does today.

import { isCinematicMode } from "./featureFlags";
import { cameraGoto } from "./tourCamera";

const DEFAULT_CAMERA_LAG_MS = 200;

function selectorOf(target) {
  if (typeof target === "string") return target;
  if (target && typeof target === "object" && "current" in target) {
    const el = target.current;
    return el && el.id ? `#${el.id}` : null;
  }
  if (target && target.nodeType === 1) {
    return target.id ? `#${target.id}` : null;
  }
  return null;
}

function dispatchBeatStart(cursorCfg, extraDetail = {}) {
  if (typeof window === "undefined" || !cursorCfg) return;
  window.dispatchEvent(
    new CustomEvent("kairos-tour:beat-start", {
      detail: { cursor: cursorCfg, ...extraDetail },
    })
  );
}

export async function cursorThenCamera(target, options = {}) {
  const {
    cameraLagMs = DEFAULT_CAMERA_LAG_MS,
    zoomOnClick = false,
    cursorTiming = { startTime: 0, arriveTime: 1500, clickTime: null },
    readMs = 0,
  } = options;

  const selector = selectorOf(target);
  const cursorCfg = selector
    ? {
        target: selector,
        startTime: cursorTiming.startTime ?? 0,
        arriveTime: cursorTiming.arriveTime ?? 1500,
        clickTime: cursorTiming.clickTime ?? null,
      }
    : null;

  if (!isCinematicMode()) {
    // Pre-cinematic fallback — cursor event only, CursorGhost's own
    // scroll-into-view handles framing.
    dispatchBeatStart(cursorCfg);
    if (cursorTiming.clickTime != null) {
      await new Promise((r) => setTimeout(r, cursorTiming.clickTime + 200));
    } else if (cursorTiming.arriveTime != null) {
      await new Promise((r) => setTimeout(r, cursorTiming.arriveTime + 200));
    }
    if (readMs > 0) await new Promise((r) => setTimeout(r, readMs));
    return;
  }

  // Cinematic — cursor leads, camera follows after lag.
  dispatchBeatStart(cursorCfg);
  await new Promise((r) => setTimeout(r, cameraLagMs));
  // Wide camera move while cursor is still en route. Don't await the full
  // settle here so the click can land near the cursor's arriveTime
  // without a hard stop.
  cameraGoto(target, { framing: "wide" });

  if (cursorTiming.clickTime != null) {
    const remaining = Math.max(0, cursorTiming.clickTime - cameraLagMs);
    await new Promise((r) => setTimeout(r, remaining));
    if (zoomOnClick) {
      // Tight zoom after the click ripple fires — the artifact about to
      // render will be center-stage.
      await cameraGoto(target, { framing: "tight" });
    }
  } else if (cursorTiming.arriveTime != null) {
    const remaining = Math.max(0, cursorTiming.arriveTime - cameraLagMs);
    await new Promise((r) => setTimeout(r, remaining));
  }

  if (readMs > 0) await new Promise((r) => setTimeout(r, readMs));
}
