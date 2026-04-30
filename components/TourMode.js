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
const MUTED_KEY = "kairos.tour.muted";
const AUDIO_BASE = "/tour-audio/";
const AUDIO_TAIL_BUFFER_MS = 500;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Load an audio element and wait for its metadata so we know duration.
// Resolves to the Audio element on success, or null on failure/timeout.
function loadAudio(audioKey) {
  if (!audioKey || typeof window === "undefined") return Promise.resolve(null);
  return new Promise((resolve) => {
    const audio = new Audio(AUDIO_BASE + audioKey + ".mp3");
    audio.preload = "auto";
    let settled = false;
    function done(value) {
      if (settled) return;
      settled = true;
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("canplaythrough", onMeta);
      audio.removeEventListener("error", onErr);
      resolve(value);
    }
    function onMeta() {
      if (Number.isFinite(audio.duration) && audio.duration > 0) done(audio);
    }
    function onErr() {
      done(null);
    }
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("canplaythrough", onMeta);
    audio.addEventListener("error", onErr);
    audio.load();
    setTimeout(() => done(null), 4000);
  });
}

// Walk a fixture's bubble graph and yield every audioKey we'd need.
function* walkFixtureAudioKeys(fx) {
  if (!fx) return;
  if (fx.preArrivalNarrator && fx.preArrivalNarrator.audioKey) yield fx.preArrivalNarrator.audioKey;
  if (fx.onArrival && fx.onArrival.audioKey) yield fx.onArrival.audioKey;
  for (const action of fx.actions || []) {
    for (const ann of action.annotations || []) {
      if (ann.audioKey) yield ann.audioKey;
    }
  }
  if (fx.onAuthorize && fx.onAuthorize.audioKey) yield fx.onAuthorize.audioKey;
  if (fx.transitionNarrator && fx.transitionNarrator.audioKey) yield fx.transitionNarrator.audioKey;
}

// Fire-and-forget preload of upcoming fixture audio so playback is gapless.
function preloadFixtureAudio(fx) {
  if (typeof window === "undefined" || !fx) return;
  for (const key of walkFixtureAudioKeys(fx)) {
    try {
      const a = new Audio(AUDIO_BASE + key + ".mp3");
      a.preload = "auto";
      a.load();
    } catch (e) {
      // ignore
    }
  }
}

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
  const mutedRef = useRef(false);
  const runningRef = useRef(false);
  const audioRef = useRef(null);

  // state (drives render)
  const [active, setActive] = useState(false);
  const [overlay, setOverlay] = useState(null); // {kind:'narrator'|'spotlight', data, continueResolve}
  const [stepIdx, setStepIdx] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [speed, setSpeedState] = useState(1);
  const [paused, setPausedState] = useState(false);
  const [muted, setMutedState] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);

  // Length-aware dwell:
  //   base = max(authored durationMs, 1500 + chars × 50)
  //   floor 3500ms, ceiling 16000ms
  //   speed=2 trims to 60% of base for a faster pass that still scales with length
  const READ_BASE_MS = 1500;
  const READ_PER_CHAR_MS = 50;
  const DWELL_FLOOR_MS = 3500;
  const DWELL_CEILING_MS = 16000;

  function computeDwell(data, speed) {
    if (!data) return DWELL_FLOOR_MS;
    const text = `${data.title || ""} ${data.body || ""}`.trim();
    const chars = text.length;
    const lengthAware = READ_BASE_MS + chars * READ_PER_CHAR_MS;
    const authored = data.durationMs || 4000;
    const base = Math.max(authored, lengthAware);
    const adjusted = speed === 2 ? base * 0.6 : base;
    return Math.max(DWELL_FLOOR_MS, Math.min(DWELL_CEILING_MS, adjusted));
  }

  // pause-aware wait — caller passes the already-computed dwell ms.
  const pwait = useCallback(async (ms) => {
    let elapsed = 0;
    while (elapsed < ms) {
      if (cancelledRef.current) return;
      if (!pausedRef.current) {
        const slice = Math.min(40, ms - elapsed);
        await sleep(slice);
        elapsed += slice;
      } else {
        await sleep(50);
      }
    }
  }, []);

  // Stop any playing bubble audio without resetting global state.
  const stopAudio = useCallback(() => {
    const a = audioRef.current;
    if (a) {
      try {
        a.pause();
      } catch (e) {
        // ignore
      }
      audioRef.current = null;
    }
  }, []);

  // Compute the dwell time for a bubble. Prefers audio.duration when an MP3
  // exists for the bubble's audioKey; falls back to the length-aware
  // computeDwell formula. Also kicks off audio playback (or muted load) as a
  // side-effect, so the caller can simply pwait(returnedMs).
  const beginBubble = useCallback(
    async (data) => {
      stopAudio();
      if (!data) return DWELL_FLOOR_MS;
      const audio = await loadAudio(data.audioKey);
      if (audio) {
        audioRef.current = audio;
        audio.muted = mutedRef.current;
        try {
          await audio.play();
        } catch (e) {
          // Browsers can reject autoplay; we still know duration so dwell
          // remains correct, just silent for this bubble.
        }
        return Math.round(audio.duration * 1000) + AUDIO_TAIL_BUFFER_MS;
      }
      return computeDwell(data, speedRef.current);
    },
    [stopAudio]
  );

  const showNarrator = useCallback(
    async (data, total) => {
      if (!data) return;
      const dwellMs = await beginBubble(data);
      setOverlay({ kind: "narrator", data, total });
      await pwait(dwellMs);
      stopAudio();
      if (cancelledRef.current) return;
    },
    [pwait, beginBubble, stopAudio]
  );

  const showSpotlight = useCallback(
    async (data) => {
      if (!data) return;
      const dwellMs = await beginBubble(data);
      setOverlay({ kind: "spotlight", data });
      await pwait(dwellMs);
      stopAudio();
      if (cancelledRef.current) return;
    },
    [pwait, beginBubble, stopAudio]
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
          }, computeDwell(ann, speedRef.current));
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

      // Backup current authorized list and clear so all 9 cards present.
      const cur = sessionStorage.getItem(AUTH_KEY);
      sessionStorage.setItem(BACKUP_KEY, cur || "[]");
      sessionStorage.removeItem(AUTH_KEY);
      sessionStorage.setItem(ACTIVE_KEY, "1");

      // Preload audio for the very first fixture before we begin.
      preloadFixtureAudio(TOUR_SCRIPT[startStep]);

      try {
        for (let i = startStep; i < TOUR_SCRIPT.length; i++) {
          if (cancelledRef.current) break;
          const fx = TOUR_SCRIPT[i];
          setStepIdx(i);
          setProgressLabel(fx.progressLabel);
          // Preload the next fixture's audio so its bubbles play gaplessly.
          if (i + 1 < TOUR_SCRIPT.length) preloadFixtureAudio(TOUR_SCRIPT[i + 1]);

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
      // Restore mute preference from sessionStorage; default unmuted (voice ON).
      let savedMuted = false;
      try {
        savedMuted = sessionStorage.getItem(MUTED_KEY) === "1";
        sessionStorage.setItem("kairos-tour-speed", "1");
      } catch (e) {
        // ignore storage errors
      }
      mutedRef.current = savedMuted;
      setMutedState(savedMuted);
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

  // Pause toggle. Freezes the dwell timer (via pausedRef checked in pwait),
  // pauses bubble audio in place, and dispatches a window event so any
  // in-progress typing animations on panes can freeze too.
  const togglePause = useCallback(() => {
    const next = !pausedRef.current;
    pausedRef.current = next;
    setPausedState(next);
    const a = audioRef.current;
    if (a) {
      if (next) {
        try { a.pause(); } catch (e) { /* ignore */ }
      } else {
        // Resume from current position. Stays muted if mute was toggled
        // during the pause — audio.muted is independent of paused state.
        a.play().catch(() => {});
      }
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent(next ? "kairos-tour:pause" : "kairos-tour:resume")
      );
    }
  }, []);

  // Spacebar keyboard shortcut for pause/resume — industry-standard for
  // any timeline-based player. Ignored when focus is on an input/textarea.
  useEffect(() => {
    if (typeof window === "undefined") return;
    function onKey(e) {
      if (e.code !== "Space" && e.key !== " ") return;
      if (!active) return;
      const tag = (e.target && e.target.tagName) || "";
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target && e.target.isContentEditable)) return;
      e.preventDefault();
      togglePause();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, togglePause]);

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

  // Mute toggle. Mutes the currently-playing bubble audio without restarting
  // it; persists preference for subsequent tours.
  const toggleMuted = useCallback(() => {
    const next = !mutedRef.current;
    mutedRef.current = next;
    setMutedState(next);
    try {
      sessionStorage.setItem(MUTED_KEY, next ? "1" : "0");
    } catch (e) {
      // ignore storage errors
    }
    if (audioRef.current) {
      audioRef.current.muted = next;
    }
  }, []);

  // Skip — cancel + restore.
  const skipTour = useCallback(() => {
    cancelledRef.current = true;
    runningRef.current = false;
    stopAudio();
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
  }, [router, stopAudio]);

  // End tour from modal.
  const endTour = useCallback(() => {
    skipTour();
  }, [skipTour]);

  // Free explore — keep tour-cleared dashboard (all 7 unauthorized) but exit
  // the orchestrated mode so the user can click around.
  const freeExplore = useCallback(() => {
    cancelledRef.current = true;
    runningRef.current = false;
    stopAudio();
    setOverlay(null);
    setShowEndModal(false);
    setActive(false);
    sessionStorage.removeItem(ACTIVE_KEY);
    sessionStorage.removeItem("kairos-tour-speed");
    // Do NOT restore the backup — leave all 9 fixtures unauthorized for play.
    sessionStorage.removeItem(BACKUP_KEY);
    router.push("/dashboard");
  }, [router, stopAudio]);

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
          body={overlay.data.displayText || overlay.data.body}
          onDismiss={null}
        />
      ) : null}

      {overlay && overlay.kind === "narrator" ? (
        <NarratorCorner
          title={overlay.data.title}
          body={overlay.data.displayText || overlay.data.body}
          progressLabel={progressLabel}
          step={stepIdx}
          total={TOUR_SCRIPT.length}
          speed={speed}
          paused={paused}
          muted={muted}
          onToggleSpeed={toggleSpeed}
          onTogglePause={togglePause}
          onToggleMuted={toggleMuted}
          onSkip={skipTour}
          onContinue={null}
        />
      ) : null}

      {/* Always show tour HUD (skip + speed + mute + pause) when active, even
          if no overlay is currently up (e.g. between steps during navigation). */}
      {active && !overlay && !showEndModal ? (
        <NarratorCorner
          progressLabel={progressLabel || "Tour active"}
          step={stepIdx}
          total={TOUR_SCRIPT.length}
          speed={speed}
          paused={paused}
          muted={muted}
          onToggleSpeed={toggleSpeed}
          onTogglePause={togglePause}
          onToggleMuted={toggleMuted}
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
