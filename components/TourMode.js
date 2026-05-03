// Phase 3.3 Tour Mode — orchestrator.
// Mounts inside AppChrome so it persists across route navigations between
// /rn and /encounter/[id]. Reacts to a window 'kairos-tour:start'
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
import { getFixture } from "@/data/fixtures/encounters";
import { isCinematicMode } from "@/lib/featureFlags";
import { cameraGoto, isElementInViewport } from "@/lib/tourCamera";
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

// Cursor configs may carry per-mode overrides (cursor.deep / cursor.quick)
// when the narration length differs sharply between Quick and Deep audio.
// The override block only specifies the timing keys it wants to change.
function resolveCursor(cursor, mode) {
  if (!cursor) return null;
  const override = mode === "deep" ? cursor.deep : cursor.quick;
  if (!override) {
    const { deep, quick, ...base } = cursor;
    return base;
  }
  const { deep, quick, ...base } = cursor;
  return { ...base, ...override };
}

// Build the public/tour-audio/ filename for a bubble. Quick mode keeps the
// existing un-suffixed filenames so previously-generated MP3s stay valid.
// Deep mode appends "-deep" so the two tiers coexist on disk.
function audioFileFor(audioKey, mode) {
  if (!audioKey) return null;
  return AUDIO_BASE + audioKey + (mode === "deep" ? "-deep" : "") + ".mp3";
}

// Load an audio element and wait for its metadata so we know duration.
// Resolves to the Audio element on success, or null on failure/timeout.
function loadAudio(audioKey, mode) {
  const src = audioFileFor(audioKey, mode);
  if (!src || typeof window === "undefined") return Promise.resolve(null);
  return new Promise((resolve) => {
    const audio = new Audio(src);
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
function preloadFixtureAudio(fx, mode) {
  if (typeof window === "undefined" || !fx) return;
  for (const key of walkFixtureAudioKeys(fx)) {
    const src = audioFileFor(key, mode);
    if (!src) continue;
    try {
      const a = new Audio(src);
      a.preload = "auto";
      a.load();
    } catch (e) {
      // ignore
    }
  }
}

// Wait for a window CustomEvent. Optionally filter by detail predicate.
// `skipRef` and `jumpRef` are optional — setting either to a truthy value
// (skipRef.current=true OR jumpRef.current >= 0) resolves the promise
// early without ending the tour. Used by the Skip button (skipRef) and
// the card-navigation pills (jumpRef) so a user-driven exit from a wait
// short-circuits cleanly instead of timing out.
function waitForEvent(name, predicate, cancelledRef, skipRef, jumpRef) {
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
    const cancelPoll = setInterval(() => {
      const skipSet = skipRef && skipRef.current;
      const jumpSet = jumpRef && jumpRef.current >= 0;
      if (cancelledRef.current || skipSet || jumpSet) {
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
  const modeRef = useRef("quick");
  const runningRef = useRef(false);
  const audioRef = useRef(null);
  const skipBeatRef = useRef(false);
  // Pass D Phase 1 — card-navigation pills. When the user clicks pill N,
  // jumpToCardRef gets the target index (0-based). The running tour loop
  // checks this ref between beats and at every awaitable wait point so
  // the jump can happen mid-card. -1 means no pending jump.
  const jumpToCardRef = useRef(-1);

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
  // Spotlight panels (after-action bubbles, onArrival) hold at least this
  // long after typing completes so the viewer can read what was just typed.
  const SPOTLIGHT_MIN_MS = 8000;

  function computeDwell(data, speed) {
    if (!data) return DWELL_FLOOR_MS;
    const text = `${data.title || ""} ${data.body || ""}`.trim();
    const chars = text.length;
    const lengthAware = READ_BASE_MS + chars * READ_PER_CHAR_MS;
    const authored = data.durationMs || 4000;
    const base = Math.max(authored, lengthAware);
    // Speed control: 1x = base; 2x = base/2. Floor and ceiling both scale
    // so a 2x viewer actually finishes everything in half the time —
    // including the short bubbles that would otherwise be pinned at the
    // 3500ms floor.
    const s = Math.max(1, speed || 1);
    const adjusted = base / s;
    return Math.max(DWELL_FLOOR_MS / s, Math.min(DWELL_CEILING_MS / s, adjusted));
  }

  // pause-aware wait — caller passes the already-computed dwell ms.
  // Returns early if skipBeatRef is set (Skip button advances current beat)
  // or cancelledRef is set (full tour exit).
  const pwait = useCallback(async (ms) => {
    let elapsed = 0;
    while (elapsed < ms) {
      if (cancelledRef.current) return;
      if (skipBeatRef.current) return;
      if (jumpToCardRef.current >= 0) return;
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
      const audio = await loadAudio(data.audioKey, modeRef.current);
      if (audio) {
        audioRef.current = audio;
        audio.muted = mutedRef.current;
        // Apply current speed to the audio. playbackRate=2 plays the same
        // MP3 at literal double speed (browsers preserve pitch by default
        // up to ~4x), and the dwell scales in lockstep so the next beat
        // doesn't kick before the audio actually finishes.
        const s = Math.max(1, speedRef.current || 1);
        audio.playbackRate = s;
        try {
          await audio.play();
        } catch (e) {
          // Browsers can reject autoplay; we still know duration so dwell
          // remains correct, just silent for this bubble.
        }
        return Math.round((audio.duration * 1000) / s) + AUDIO_TAIL_BUFFER_MS;
      }
      return computeDwell(data, speedRef.current);
    },
    [stopAudio]
  );

  // Pass G-fix2 — Pre-frame the SPOTLIGHT ANCHOR before dispatching
  // beat-start. Anchor-only (never cursor target) so the opening of
  // each card lands on the source pane, not on whichever button the
  // cursor is going to click 10 seconds into the narration. The
  // cursor's target (typically below the anchor) is handled by a
  // separately-scheduled secondary scroll — see scheduleCursorPreScroll
  // below — that fires ~300ms before the cursor's startTime so the
  // camera leads the cursor as a single downward move.
  //
  // Annotations may override framing via
  // `cinematicFraming: "top" | "tight" | "wide"`. Card 7 pa2 / pa3 use
  // "top" so the patient-response Q1 and the SBAR header land at the
  // top of the viewport instead of mid-pane.
  //
  // For showNarrator beats with anchor === "global" (corner narrator
  // with no spotlight pane), fall back to the cursor target so the
  // page is settled before CursorGhost scrolls. This is the disposition
  // / onAuthorize case — Card 3 cursor must land on the Authorize
  // button, and there is no spotlight anchor to frame.
  const preframeForAnnotation = useCallback(async (ann) => {
    if (!ann || !isCinematicMode()) return;
    const anchorSel =
      ann.anchor && ann.anchor !== "global"
        ? `[data-tour-anchor="${ann.anchor}"]`
        : null;
    const anchorEl =
      anchorSel && typeof document !== "undefined"
        ? document.querySelector(anchorSel)
        : null;
    const framing = ann.cinematicFraming || "wide";
    let target = anchorEl;
    if (!target) {
      const cursorTarget = ann.cursor && ann.cursor.target;
      if (cursorTarget && typeof document !== "undefined") {
        target = document.querySelector(cursorTarget);
      }
    }
    if (!target) return;
    await cameraGoto(target, {
      framing,
      skipIfVisible: true,
      visibilityFraction: framing === "top" ? 0.9 : 0.6,
      holdMs: 0,
    });
  }, []);

  // Pass G-fix2 — Schedule a secondary camera move that fires ~300ms
  // BEFORE the cursor's startTime so the page is settled at the cursor
  // target's position when CursorGhost dispatches its own scrollIntoView.
  // CursorGhost waits 400ms after scrollIntoView before measuring; if
  // the page is still mid-smooth-scroll at the 400ms mark, the cursor
  // measures stale coordinates and lands beside the button. Pre-
  // scrolling the page first turns CursorGhost's scrollIntoView into a
  // near-instant no-op so the 400ms wait is sufficient.
  //
  // Also matches the master-task choreography: "Camera moves DOWN to
  // Generate Patient Assessment button → cursor clicks it" — the camera
  // leads the cursor as a single deliberate downward move, not a
  // simultaneous double-scroll.
  //
  // skipIfVisible suppresses the move when the cursor target is already
  // on-screen (the common case — usually the cursor target sits inside
  // the spotlight anchor that was just framed).
  // Pass G-fix3 #1 — converted from raw setTimeout to pwait-based async
  // waiter so the pre-scroll respects pause. Returns a cancel function;
  // callers stash it and invoke on beat-end so an aborted beat doesn't
  // schedule a stale scroll into the next beat.
  const scheduleCursorPreScroll = useCallback((cursorCfg) => {
    if (!isCinematicMode()) return () => {};
    if (!cursorCfg || !cursorCfg.target) return () => {};
    const startTime = typeof cursorCfg.startTime === "number" ? cursorCfg.startTime : 0;
    if (startTime < 1200) return () => {};
    const delay = Math.max(0, startTime - 300);
    let cancelled = false;
    (async () => {
      let elapsed = 0;
      while (elapsed < delay && !cancelled) {
        if (cancelledRef.current) return;
        if (skipBeatRef.current) return;
        if (!pausedRef.current) {
          const slice = Math.min(40, delay - elapsed);
          await sleep(slice);
          elapsed += slice;
        } else {
          await sleep(50);
        }
      }
      if (cancelled || cancelledRef.current || skipBeatRef.current) return;
      cameraGoto(cursorCfg.target, {
        framing: "wide",
        skipIfVisible: true,
        visibilityFraction: 0.85,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const showNarrator = useCallback(
    async (data, total) => {
      if (!data) return;
      skipBeatRef.current = false;
      // Pass G-fix #1 — pre-frame the cursor target before dispatching
      // beat-start so CursorGhost's scrollIntoView lands on a settled
      // page. Skip is automatic when target is already visible.
      await preframeForAnnotation(data);
      // Notify ActionBar (and other listeners) which button this beat
      // targets — used to drive the pulse animation.
      const cursorCfg = resolveCursor(data.cursor, modeRef.current);
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("kairos-tour:beat-start", {
            detail: {
              targetButton: data.targetButton || null,
              targetCard: data.targetCard || null,
              cursor: cursorCfg,
            },
          })
        );
      }
      // Pass G-fix2 — schedule the camera to lead the cursor by ~300ms.
      const cursorPreScrollHandle = scheduleCursorPreScroll(cursorCfg);
      const dwellMs = await beginBubble(data);
      setOverlay({ kind: "narrator", data, total });
      await pwait(dwellMs);
      cursorPreScrollHandle();
      stopAudio();
      skipBeatRef.current = false;
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("kairos-tour:beat-end"));
      }
      if (cancelledRef.current) return;
    },
    [pwait, beginBubble, stopAudio, preframeForAnnotation, scheduleCursorPreScroll]
  );

  const showSpotlight = useCallback(
    async (data) => {
      if (!data) return;
      skipBeatRef.current = false;
      // Pass G-fix #1 — pre-frame the spotlight target BEFORE beat-start.
      await preframeForAnnotation(data);
      // Pass G-fix3 #4 — show the spotlight gold-box BEFORE the audio
      // narration so the viewer can read the freshly-rendered panel
      // during the silent prePlayHoldMs. Replaces the old extraHoldMs
      // (which sat AFTER audio and created dead air between the
      // narration's "Hit Synthesize SBAR" and the actual click).
      // prePlayHoldMs is silent reading time BEFORE narration starts;
      // when set, the post-audio min-hold collapses to a small buffer
      // since reading already happened.
      setOverlay({ kind: "spotlight", data });
      const prePlayMs = data.prePlayHoldMs || 0;
      if (prePlayMs > 0) {
        await pwait(prePlayMs);
      }
      const cursorCfg = resolveCursor(data.cursor, modeRef.current);
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("kairos-tour:beat-start", {
            detail: {
              targetButton: data.targetButton || null,
              targetCard: data.targetCard || null,
              cursor: cursorCfg,
            },
          })
        );
      }
      // Pass G-fix2 — schedule the camera to lead the cursor by ~300ms.
      const cursorPreScrollHandle = scheduleCursorPreScroll(cursorCfg);
      const audioMs = await beginBubble(data);
      // When prePlayHoldMs already gave the viewer reading time, only
      // need a small buffer after audio so the next action doesn't race
      // the click ripple. Otherwise enforce SPOTLIGHT_MIN_MS so short
      // audio still gives the viewer time to read.
      const minPostAudio = prePlayMs > 0 ? Math.max(audioMs + 500, 1500) : SPOTLIGHT_MIN_MS;
      const dwellMs = Math.max(minPostAudio, audioMs) + (data.extraHoldMs || 0);
      await pwait(dwellMs);
      cursorPreScrollHandle();
      stopAudio();
      skipBeatRef.current = false;
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("kairos-tour:beat-end"));
      }
      if (cancelledRef.current) return;
    },
    [pwait, beginBubble, stopAudio, preframeForAnnotation, scheduleCursorPreScroll]
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

      // Wait for action complete. skipBeatRef is honored here so the
      // Skip button can exit a long-running auto-action mid-flight; the
      // remaining actions in this fixture also short-circuit because
      // skipBeatRef stays true until the next showNarrator/showSpotlight
      // resets it.
      await waitForEvent(
        "kairos-encounter:action-complete",
        (d) => d && d.actionId === actionId,
        cancelledRef,
        skipBeatRef,
        jumpToCardRef
      );

      window.removeEventListener("kairos-encounter:banner", bannerHandler);
      if (cancelledRef.current) return;

      // Run after-action annotations serially. Pass G-fix #1 — replaced
      // the patient-header pull-back-between-bubbles with a direct
      // pre-frame on the NEXT annotation's anchor (or its cursor target,
      // when one is present). The pull-back caused a "seasick" double
      // bounce: page jumped UP to the header, then back DOWN to the next
      // pane. With skipIfVisible=true, the move is a no-op when the
      // upcoming target is already comfortably on-screen — covering the
      // common case where consecutive spotlights live in the same
      // viewport region (MyChart → Order Pad → action-bar). Awaiting the
      // settle BEFORE showSpotlight also fixes the cursor-misses-button
      // bug on Card 3 / Card 7: by the time CursorGhost fires its own
      // scrollIntoView, the page has already settled at the right
      // position so the cursor lands on the button rather than its
      // pre-scroll coordinates.
      const cinematic = isCinematicMode();
      for (let aIdx = 0; aIdx < afterActionAnns.length; aIdx++) {
        if (cancelledRef.current || jumpToCardRef.current >= 0) return;
        const ann = afterActionAnns[aIdx];
        if (cinematic) {
          await preframeForAnnotation(ann);
        }
        await showSpotlight(ann);
        clearOverlay();
        await pwait(200);
      }
      // No post-loop pull-back. The next phase (showNarrator for
      // onAuthorize, or the next card's pre-arrival) issues its own
      // pre-frame before the cursor moves.
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
      preloadFixtureAudio(TOUR_SCRIPT[startStep], modeRef.current);

      // Pass D Phase 1 — converted from a for-loop to a while-loop so the
      // card-navigation pills can mutate the iteration index. After each
      // beat we check jumpToCardRef; if set, break out of the per-card
      // body via the labeled `card:` block, and the outer while-loop
      // applies the jump and starts the new card from the top.
      try {
        let i = startStep;
        while (i < TOUR_SCRIPT.length && !cancelledRef.current) {
          // Apply any pending jump request that came in between cards.
          if (jumpToCardRef.current >= 0) {
            i = jumpToCardRef.current;
            jumpToCardRef.current = -1;
            // Reset auth state so the destination card renders fresh.
            try { sessionStorage.removeItem(AUTH_KEY); } catch {}
            if (i < 0 || i >= TOUR_SCRIPT.length) {
              i = 0;
            }
          }
          const fx = TOUR_SCRIPT[i];
          setStepIdx(i);
          setProgressLabel(fx.progressLabel);
          // Preload the next fixture's audio so its bubbles play gaplessly.
          if (i + 1 < TOUR_SCRIPT.length) preloadFixtureAudio(TOUR_SCRIPT[i + 1], modeRef.current);

          // Resolve the fixture's basket once — used to drive both the
          // /rn dashboard tab during pre-arrival narration (so the right
          // card is rendered when targetCard fires) and the encounter
          // detail's tab query param.
          const fxData = getFixture(fx.fixtureId);
          const fxTab = (fxData && fxData.tab) || "resultsfu";

          card: {
            // 1. Pre-arrival narrator on the RN home (/rn) with the
            //    fixture's basket selected so PatientCard pulses on the
            //    matching card. router.replace alone doesn't re-trigger
            //    /rn's on-mount tab read, so we also dispatch a
            //    kairos-tour:set-tab event that /rn listens for.
            const onRn = window.location.pathname === "/rn";
            const currentTab = onRn
              ? new URLSearchParams(window.location.search).get("tab")
              : null;
            if (!onRn) {
              router.push(`/rn?tab=${fxTab}`);
              await pwait(700);
            } else if (currentTab !== fxTab) {
              router.replace(`/rn?tab=${fxTab}`);
              window.dispatchEvent(
                new CustomEvent("kairos-tour:set-tab", { detail: { tab: fxTab } })
              );
              await pwait(250);
            }
            if (cancelledRef.current || jumpToCardRef.current >= 0) break card;

            await showNarrator(fx.preArrivalNarrator, TOUR_SCRIPT.length);
            if (cancelledRef.current || jumpToCardRef.current >= 0) break card;
            clearOverlay();

            // 2. Navigate into encounter (basket already resolved above).
            router.push(`/encounter/${fx.fixtureId}?tour=1&tab=${fxTab}`);
            await waitForEvent(
              "kairos-encounter:ready",
              (d) => d && d.fixtureId === fx.fixtureId,
              cancelledRef,
              null,
              jumpToCardRef
            );
            await pwait(400);
            if (cancelledRef.current || jumpToCardRef.current >= 0) break card;

            // 3. On-arrival
            if (fx.onArrival) {
              await showSpotlight(fx.onArrival);
              clearOverlay();
              await pwait(200);
            }
            if (cancelledRef.current || jumpToCardRef.current >= 0) break card;

            // 4. Run actions
            for (const action of fx.actions || []) {
              if (cancelledRef.current || jumpToCardRef.current >= 0) break;
              await runAction(action, fx.fixtureId);
            }
            if (cancelledRef.current || jumpToCardRef.current >= 0) break card;

            // 5. Post-action narrator (corner)
            if (fx.onAuthorize) {
              await showNarrator(fx.onAuthorize, TOUR_SCRIPT.length);
              clearOverlay();
            }
            if (cancelledRef.current || jumpToCardRef.current >= 0) break card;

            // 6. Auto-Authorize
            window.dispatchEvent(new CustomEvent("kairos-encounter:auto-authorize"));
            await waitForEvent(
              "kairos-encounter:flown-off",
              null,
              cancelledRef,
              null,
              jumpToCardRef
            );
            if (cancelledRef.current || jumpToCardRef.current >= 0) break card;

            // 7. Transition narrator (skip on last fixture)
            if (fx.transitionNarrator && i < TOUR_SCRIPT.length - 1) {
              await pwait(500);
              await showNarrator(fx.transitionNarrator, TOUR_SCRIPT.length);
              clearOverlay();
            }
          }
          // End of per-card body. If a jump fired during this card, the
          // outer loop top will apply it. Otherwise advance normally.
          if (jumpToCardRef.current < 0) {
            i++;
          }
        }

        if (!cancelledRef.current && jumpToCardRef.current < 0) {
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
    function onStart(e) {
      const requestedMode = e && e.detail && e.detail.mode === "deep" ? "deep" : "quick";
      modeRef.current = requestedMode;
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
      } catch (e2) {
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
  // animation can scale itself in tandem with the tour cadence. Also
  // applies to whatever audio is currently mid-playback so a mid-bubble
  // toggle takes effect immediately rather than waiting for the next
  // bubble to load.
  const toggleSpeed = useCallback(() => {
    const next = speedRef.current === 1 ? 2 : 1;
    speedRef.current = next;
    setSpeedState(next);
    if (audioRef.current) {
      try {
        audioRef.current.playbackRate = next;
      } catch (e) {
        // ignore — some browsers throw if the rate is set after end
      }
    }
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

  // Advance current beat — Skip button. Stops audio for the current bubble,
  // sets skipBeatRef so pwait returns immediately, and the runTour loop
  // moves on to the next bubble/action/fixture without ending the tour.
  // Also fires a window event so any in-progress typing animation inside
  // EncounterDetail (the per-character pane-update loop) can fast-forward
  // to its final state — otherwise the typing keeps running and the next
  // auto-action gets ignored by EncounterDetail's `if (isPlaying) return`
  // guard, freezing the tour mid-card.
  const advanceBeat = useCallback(() => {
    skipBeatRef.current = true;
    stopAudio();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("kairos-tour:skip-beat"));
    }
  }, [stopAudio]);

  // Pass D Phase 1 — card-navigation pill click handler. Sets the jump
  // target ref, short-circuits any in-flight beat, stops audio, and
  // restarts runTour from the target if the loop isn't currently active
  // (e.g. the user clicks a pill from the end-of-tour modal).
  const jumpToCard = useCallback(
    (n) => {
      if (typeof n !== "number" || n < 0 || n >= TOUR_SCRIPT.length) return;
      jumpToCardRef.current = n;
      skipBeatRef.current = true;
      stopAudio();
      setOverlay(null);
      // Clear the end-modal in case the jump came from there.
      setShowEndModal(false);
      // If the loop isn't running (post-end-modal), start a fresh runTour
      // at the target. The newly-spawned runTour will see jumpToCardRef
      // is still set and apply it on the first iteration of its
      // while-loop.
      if (!runningRef.current) {
        // Reset cancellation so a fresh tour can run.
        cancelledRef.current = false;
        if (!active) setActive(true);
        try { sessionStorage.setItem(ACTIVE_KEY, "1"); } catch {}
        runTour(n);
      }
    },
    [active, runTour, stopAudio]
  );

  // End-tour — cancel + restore. Used by the End button (modal) and
  // Free-Explore exit paths. NOT bound to the Skip button (which advances
  // the current beat instead, per Phase-3.4 quality-fix sprint).
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
    window.dispatchEvent(new CustomEvent("kairos-tour:end"));
    router.push("/rn");
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
    window.dispatchEvent(new CustomEvent("kairos-tour:end"));
    router.push("/rn");
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
          onSkip={advanceBeat}
          onEnd={skipTour}
          onContinue={null}
          onJumpToCard={jumpToCard}
        />
      ) : null}

      {/* HUD persists across all route changes during tour playback —
          including encounter detail pages where the bubble is a spotlight
          (whose body doesn't carry HUD chrome of its own). Render the
          HUD-only NarratorCorner whenever active, except when the narrator
          variant is already showing it. */}
      {active && (!overlay || overlay.kind !== "narrator") && !showEndModal ? (
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
          onSkip={advanceBeat}
          onEnd={skipTour}
          onContinue={null}
          onJumpToCard={jumpToCard}
        />
      ) : null}

      {showEndModal ? (
        <TourEndModal
          onFreeExplore={freeExplore}
          onEnd={endTour}
          onJumpToCard={jumpToCard}
          total={TOUR_SCRIPT.length}
        />
      ) : null}
    </>
  );
}
