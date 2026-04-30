// Phase 3.3 Tour Mode — orchestrator.
// Mounts inside AppChrome so it persists across route navigations between
// /dashboard and /encounter/[id]. Reacts to a window 'kairos-tour:start'
// event and runs the scripted 7-fixture tour.
//
// Coordination protocol with EncounterDetail:
//   ► TourMode dispatches:  kairos-encounter:auto-action {actionId}
//                           kairos-encounter:auto-authorize
//   ◄ TourMode listens for: kairos-encounter:ready
//                           kairos-encounter:action-complete {actionId}
//                           kairos-encounter:banner {kind, text}
//                           kairos-encounter:flown-off
//
// Pause: clicking on the dimmed backdrop (or any non-tour element) toggles
// pause. The async runTour() loop's wait helper polls the pause flag.

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import TOUR_SCRIPT from "@/lib/tourScript";
import SpotlightOverlay from "./SpotlightOverlay";
import NarratorCorner from "./NarratorCorner";
import TourEndModal from "./TourEndModal";

const AUTH_KEY = "kairos.authorizedCards.v1";
const BACKUP_KEY = "kairos.tour.authorizedBackup";
const ACTIVE_KEY = "kairos-tour-active";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Wait for a window CustomEvent. Optionally filter by detail predicate.
function waitForEvent(name, predicate, cancelledRef) {
  return new Promise((resolve) => {
    function handler(e) {
      if (cancelledRef.current) {
        window.removeEventListener(name, handler);
        resolve(null);
        return;
      }
      if (!predicate || predicate(e.detail || {})) {
        window.removeEventListener(name, handler);
        resolve(e.detail || {});
      }
    }
    window.addEventListener(name, handler);
    // Allow cancellation to drain the listener.
    const cancelPoll = setInterval(() => {
      if (cancelledRef.current) {
        clearInterval(cancelPoll);
        window.removeEventListener(name, handler);
        resolve(null);
      }
    }, 100);
    setTimeout(() => clearInterval(cancelPoll), 30000);
  });
}

export default function TourMode() {
  const router = useRouter();
  const pathname = usePathname();

  // refs (no re-render on update)
  const cancelledRef = useRef(false);
  const pausedRef = useRef(false);
  const speedRef = useRef(1);
  const runningRef = useRef(false);

  // state (drives render)
  const [active, setActive] = useState(false);
  const [overlay, setOverlay] = useState(null); // {kind:'narrator'|'spotlight', data, continueResolve}
  const [stepIdx, setStepIdx] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [speed, setSpeedState] = useState(1);
  const [paused, setPausedState] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);

  // Speed multiplier:
  //   1x (default) → 1.5× duration  (slower — for nurses to actually read bubbles)
  //   2x           → 1.0× duration  (roughly the previous 1x feel)
  function durationMultiplier(speed) {
    return speed === 2 ? 1.0 : 1.5;
  }

  // pause-aware wait
  const pwait = useCallback(async (ms) => {
    const adjusted = ms * durationMultiplier(speedRef.current);
    let elapsed = 0;
    while (elapsed < adjusted) {
      if (cancelledRef.current) return;
      if (!pausedRef.current) {
        const slice = Math.min(40, adjusted - elapsed);
        await sleep(slice);
        elapsed += slice;
      } else {
        await sleep(50);
      }
    }
  }, []);

  const showNarrator = useCallback(
    async (data, total) => {
      if (!data) return;
      setOverlay({ kind: "narrator", data, total });
      await pwait(data.durationMs || 4000);
      if (cancelledRef.current) return;
    },
    [pwait]
  );

  const showSpotlight = useCallback(
    async (data) => {
      if (!data) return;
      setOverlay({ kind: "spotlight", data });
      await pwait(data.durationMs || 5000);
      if (cancelledRef.current) return;
    },
    [pwait]
  );

  const clearOverlay = useCallback(() => {
    setOverlay(null);
  }, []);

  // Run an action, applying its annotations.
  const runAction = useCallback(
    async (actionDef, fixtureId) => {
      if (cancelledRef.current) return;
      const actionId = actionDef.actionId;

      // Set up event listeners for after-action and on-banner triggers.
      const onBannerAnns = (actionDef.annotations || []).filter(
        (a) => a.trigger === "on-banner"
      );
      const afterActionAnns = (actionDef.annotations || []).filter(
        (a) => a.trigger === "after-action"
      );

      // Banner watcher: shows annotations as banners fire.
      const seenBanners = new Set();
      function bannerHandler(e) {
        const kind = e.detail && e.detail.kind;
        if (!kind) return;
        const ann = onBannerAnns.find(
          (a) => a.bannerKind === kind && !seenBanners.has(a.bannerKind)
        );
        if (ann) {
          seenBanners.add(ann.bannerKind);
          // Show the spotlight without awaiting (banner fires mid-typing).
          // We wait via clearAnnotation timeout.
          setOverlay({ kind: "spotlight", data: ann });
          // Schedule clear after annotation duration.
          setTimeout(() => {
            // Only clear if still showing this annotation.
            setOverlay((cur) => {
              if (cur && cur.data === ann) return null;
              return cur;
            });
          }, (ann.durationMs || 5000) * durationMultiplier(speedRef.current));
        }
      }
      window.addEventListener("kairos-encounter:banner", bannerHandler);

      // Fire the action.
      window.dispatchEvent(
        new CustomEvent("kairos-encounter:auto-action", {
          detail: { actionId, fixtureId },
        })
      );

      // Wait for action complete.
      await waitForEvent(
        "kairos-encounter:action-complete",
        (d) => d && d.actionId === actionId,
        cancelledRef
      );

      window.removeEventListener("kairos-encounter:banner", bannerHandler);
      if (cancelledRef.current) return;

      // Run after-action annotations serially.
      for (const ann of afterActionAnns) {
        if (cancelledRef.current) return;
        await showSpotlight(ann);
        clearOverlay();
        await pwait(200);
      }
    },
    [pwait, showSpotlight, clearOverlay]
  );

  const runTour = useCallback(
    async (startStep = 0) => {
      if (runningRef.current) return;
      runningRef.current = true;
      cancelledRef.current = false;

      // Backup current authorized list and clear so all 7 cards present.
      const cur = sessionStorage.getItem(AUTH_KEY);
      sessionStorage.setItem(BACKUP_KEY, cur || "[]");
      sessionStorage.removeItem(AUTH_KEY);
      sessionStorage.setItem(ACTIVE_KEY, "1");

      try {
        for (let i = startStep; i < TOUR_SCRIPT.length; i++) {
          if (cancelledRef.current) break;
          const fx = TOUR_SCRIPT[i];
          setStepIdx(i);
          setProgressLabel(fx.progressLabel);

          // 1. Pre-arrival narrator on dashboard
          if (window.location.pathname !== "/dashboard") {
            router.push("/dashboard");
            await pwait(700);
          }
          await showNarrator(fx.preArrivalNarrator, TOUR_SCRIPT.length);
          if (cancelledRef.current) break;
          clearOverlay();

          // 2. Navigate into encounter
          router.push(`/encounter/${fx.fixtureId}?tour=1&tab=notify`);
          // Wait for encounter to declare ready
          await waitForEvent(
            "kairos-encounter:ready",
            (d) => d && d.fixtureId === fx.fixtureId,
            cancelledRef
          );
          await pwait(400); // brief settle for spotlight measurement
          if (cancelledRef.current) break;

          // 3. On-arrival
          if (fx.onArrival) {
            await showSpotlight(fx.onArrival);
            clearOverlay();
            await pwait(200);
          }

          // 4. Run actions
          for (const action of fx.actions || []) {
            if (cancelledRef.current) break;
            await runAction(action, fx.fixtureId);
          }

          // 5. Post-action narrator (corner)
          if (fx.onAuthorize) {
            await showNarrator(fx.onAuthorize, TOUR_SCRIPT.length);
            clearOverlay();
          }
          if (cancelledRef.current) break;

          // 6. Auto-Authorize
          window.dispatchEvent(new CustomEvent("kairos-encounter:auto-authorize"));
          await waitForEvent(
            "kairos-encounter:flown-off",
            null,
            cancelledRef
          );
          if (cancelledRef.current) break;

          // 7. Transition narrator (skip on last fixture)
          if (fx.transitionNarrator && i < TOUR_SCRIPT.length - 1) {
            // We're back on dashboard now (auth flow auto-routed).
            await pwait(500);
            await showNarrator(fx.transitionNarrator, TOUR_SCRIPT.length);
            clearOverlay();
          }
        }

        if (!cancelledRef.current) {
          setShowEndModal(true);
        }
      } finally {
        runningRef.current = false;
      }
    },
    [router, pwait, showNarrator, showSpotlight, runAction, clearOverlay]
  );

  // Start handler — exposed via window event.
  useEffect(() => {
    function onStart() {
      setActive(true);
      setShowEndModal(false);
      cancelledRef.current = false;
      pausedRef.current = false;
      speedRef.current = 1;
      setPausedState(false);
      setSpeedState(1);
      try {
        sessionStorage.setItem("kairos-tour-speed", "1");
      } catch {}
      runTour(0);
    }
    window.addEventListener("kairos-tour:start", onStart);
    return () => window.removeEventListener("kairos-tour:start", onStart);
  }, [runTour]);

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  // Pause toggle (background click or pause button).
  const togglePause = useCallback(() => {
    pausedRef.current = !pausedRef.current;
    setPausedState(pausedRef.current);
  }, []);

  // Speed toggle. Persists to sessionStorage so EncounterDetail's typing
  // animation can scale itself in tandem with the tour cadence.
  const toggleSpeed = useCallback(() => {
    const next = speedRef.current === 1 ? 2 : 1;
    speedRef.current = next;
    setSpeedState(next);
    try {
      sessionStorage.setItem("kairos-tour-speed", String(next));
    } catch {}
  }, []);

  // Skip — cancel + restore.
  const skipTour = useCallback(() => {
    cancelledRef.current = true;
    runningRef.current = false;
    setOverlay(null);
    setShowEndModal(false);
    setActive(false);
    sessionStorage.removeItem(ACTIVE_KEY);
    sessionStorage.removeItem("kairos-tour-speed");
    // Restore original authorized list.
    const backup = sessionStorage.getItem(BACKUP_KEY);
    if (backup !== null) {
      sessionStorage.setItem(AUTH_KEY, backup);
      sessionStorage.removeItem(BACKUP_KEY);
    }
    router.push("/dashboard");
  }, [router]);

  // End tour from modal.
  const endTour = useCallback(() => {
    skipTour();
  }, [skipTour]);

  // Free explore — keep tour-cleared dashboard (all 7 unauthorized) but exit
  // the orchestrated mode so the user can click around.
  const freeExplore = useCallback(() => {
    cancelledRef.current = true;
    runningRef.current = false;
    setOverlay(null);
    setShowEndModal(false);
    setActive(false);
    sessionStorage.removeItem(ACTIVE_KEY);
    sessionStorage.removeItem("kairos-tour-speed");
    // Do NOT restore the backup — leave all 7 fixtures unauthorized for play.
    sessionStorage.removeItem(BACKUP_KEY);
    router.push("/dashboard");
  }, [router]);

  if (!active && !showEndModal) return null;

  return (
    <>
      {/* Backdrop click → pause toggle. The narrator/spotlight bubbles
          stop propagation so their inner clicks don't trigger this. */}
      <div
        className="fixed inset-0 z-[50]"
        style={{ pointerEvents: overlay ? "auto" : "none" }}
        onClick={() => {
          if (overlay) togglePause();
        }}
      />

      {overlay && overlay.kind === "spotlight" ? (
        <SpotlightOverlay
          anchor={overlay.data.anchor}
          position={overlay.data.position || "right"}
          title={overlay.data.title}
          body={overlay.data.body}
          onDismiss={null}
        />
      ) : null}

      {overlay && overlay.kind === "narrator" ? (
        <NarratorCorner
          title={overlay.data.title}
          body={overlay.data.body}
          progressLabel={progressLabel}
          step={stepIdx}
          total={TOUR_SCRIPT.length}
          speed={speed}
          paused={paused}
          onToggleSpeed={toggleSpeed}
          onSkip={skipTour}
          onContinue={null}
        />
      ) : null}

      {/* Always show tour HUD (skip + speed) when active, even if no overlay
          is currently up (e.g. between steps during navigation). */}
      {active && !overlay && !showEndModal ? (
        <NarratorCorner
          progressLabel={progressLabel || "Tour active"}
          step={stepIdx}
          total={TOUR_SCRIPT.length}
          speed={speed}
          paused={paused}
          onToggleSpeed={toggleSpeed}
          onSkip={skipTour}
          onContinue={null}
        />
      ) : null}

      {showEndModal ? (
        <TourEndModal onFreeExplore={freeExplore} onEnd={endTour} />
      ) : null}
    </>
  );
}
