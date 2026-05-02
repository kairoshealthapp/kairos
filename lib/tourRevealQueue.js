// Cinematic reveal queue primitive. Walks a list of artifacts (nurse
// note, MyChart message, order pad, phone script, SBAR…) and reveals
// them sequentially so the camera, cursor, and viewer's eye all stay in
// sync. The queue treats each artifact as a beat:
//   1. Camera tightens on the artifact's pane.
//   2. The artifact's renderTrigger fires — its typewriter / fade
//      starts.
//   3. We await `kairos-artifact:render-complete` for that target.
//   4. Hold `readMs` so the viewer can actually read it.
//   5. Pull the camera back wide on the encounter container.
//   6. Repeat for the next artifact.
//
// At the end we dispatch `kairos-reveal-queue:complete` so the caller
// can advance.
//
// When cinematicMode is OFF the queue collapses to the legacy parallel
// behavior — every renderTrigger fires immediately, no read holds, no
// camera moves — which preserves the pre-cinematic tour exactly.

import { isCinematicMode } from "./featureFlags";
import { cameraGoto } from "./tourCamera";

const RENDER_COMPLETE_EVENT = "kairos-artifact:render-complete";
const QUEUE_COMPLETE_EVENT = "kairos-reveal-queue:complete";

function waitForRenderComplete(targetKey, timeoutMs = 30000) {
  if (typeof window === "undefined") return Promise.resolve();
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      window.removeEventListener(RENDER_COMPLETE_EVENT, onEvent);
      clearTimeout(timer);
      resolve();
    };
    const onEvent = (e) => {
      if (!targetKey || (e.detail && e.detail.target === targetKey)) finish();
    };
    window.addEventListener(RENDER_COMPLETE_EVENT, onEvent);
    const timer = setTimeout(finish, timeoutMs);
  });
}

function dispatchQueueComplete() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(QUEUE_COMPLETE_EVENT));
}

export async function runRevealQueue(artifacts, options = {}) {
  const list = Array.isArray(artifacts) ? artifacts : [];
  const containerRef = options.containerRef || null;

  if (!isCinematicMode()) {
    // Legacy parallel behavior — fire all renderTriggers, collapse holds.
    for (const a of list) {
      try {
        if (typeof a.renderTrigger === "function") a.renderTrigger();
      } catch {
        // ignore so a misbehaving artifact doesn't sink the queue
      }
    }
    dispatchQueueComplete();
    return;
  }

  for (let i = 0; i < list.length; i++) {
    const artifact = list[i] || {};
    const { type, targetKey, targetRef, readMs = 4000, renderTrigger } = artifact;
    // Tight zoom on the artifact pane.
    await cameraGoto(targetRef, { framing: "tight", holdMs: 0 });
    // Kick off the artifact's render.
    try {
      if (typeof renderTrigger === "function") renderTrigger();
    } catch {
      // continue
    }
    // Wait for the pane to dispatch its render-complete event. We key by
    // either the explicit targetKey (e.g. "nurse-note") or the type
    // string so different artifacts don't satisfy each other's wait.
    const matchKey = targetKey || type || null;
    await waitForRenderComplete(matchKey);
    if (readMs > 0) {
      await new Promise((r) => setTimeout(r, readMs));
    }
    // Pull back wide between artifacts so the next tight zoom has visible
    // travel — except after the last one, where the caller drives the
    // next camera move.
    if (i < list.length - 1 && containerRef) {
      await cameraGoto(containerRef, { framing: "wide", holdMs: 600 });
    }
  }

  if (containerRef) {
    await cameraGoto(containerRef, { framing: "wide", holdMs: 800 });
  }
  dispatchQueueComplete();
}
