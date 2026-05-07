// /provider tour orchestrator. 7 top-level STEPS. Section walks INTERNAL
// to cardWalk steps. Single async loop, audio.ended drives section
// advancement. Diagnostic console logging at each await point.

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import STEPS, {
  audioKeyForSection,
  targetForSection,
  CARD_TARGETS,
  CLOSING_AUDIO_KEY,
  PACING,
} from "../lib/providerTourScript";

const ACTIVE_KEY = "kairos-provider-tour-active";
const MUTED_KEY = "kairos.provider-tour.muted";
const AUDIO_BASE = "/provider-tour-audio/";
// Per-module-load token appended to every audio URL so updated MP3s are
// not served from the browser's stale audio cache.
const AUDIO_CACHE_BUST =
  typeof Date !== "undefined" ? Date.now().toString(36) : "0";

const log = (...args) => console.log("[provider-tour]", ...args);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const CARD_LABELS = { 1: "Trentham", 2: "Okafor", 3: "Whitestone" };

function PauseBadge({
  paused,
  muted,
  step,
  total,
  activeCard,
  drawerOpen,
  onJumpCard,
  onSkip,
  onTogglePause,
  onToggleMute,
  onEnd,
}) {
  // When the briefing drawer is open, anchor the pill INLINE with the
  // patient name header band (top: 24px so it sits at the kicker line
  // baseline). When the drawer is not open, anchor below the page
  // header (top: 80px so it doesn't overlap the KAIROS wordmark).
  const top = drawerOpen ? "24px" : "80px";
  return (
    <div
      role="region"
      aria-label="Tour controls"
      style={{ top }}
      className="fixed left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-graphite/95 border border-mist/70 rounded-full px-3 py-1.5 shadow-2xl backdrop-blur-sm"
    >
      <span className="kairos-data text-[11px] text-bone-muted tabular-nums px-1.5">
        Step {step + 1} / {total}
      </span>
      <span className="text-bone-muted/40">·</span>
      {[1, 2, 3].map((c) => {
        const active = c === activeCard;
        return (
          <button
            key={c}
            type="button"
            onClick={() => onJumpCard(c)}
            title={`Jump to ${CARD_LABELS[c]}`}
            className={
              "px-2 py-1 text-[11px] font-medium rounded-full transition-colors " +
              (active
                ? "bg-amber text-graphite"
                : "text-bone-muted hover:text-bone hover:bg-platinum/40")
            }
          >
            {c}
          </button>
        );
      })}
      <span className="text-bone-muted/40">·</span>
      <button type="button" onClick={onSkip} title="Skip → next" className="text-[11px] font-medium text-bone hover:text-amber transition-colors px-1.5">Skip →</button>
      <span className="text-bone-muted/40">·</span>
      <button type="button" onClick={onTogglePause} title={paused ? "Resume" : "Pause"} className="text-[11px] font-medium text-bone hover:text-amber transition-colors px-1.5">{paused ? "▶" : "⏸"}</button>
      <button type="button" onClick={onToggleMute} title={muted ? "Unmute" : "Mute"} className="text-[11px] font-medium text-bone-muted hover:text-bone transition-colors px-1.5">{muted ? "🔇" : "🔊"}</button>
      <button type="button" onClick={onEnd} title="End tour" className="text-[11px] font-medium text-bone-muted hover:text-bone transition-colors px-1.5">End</button>
    </div>
  );
}

export default function ProviderTour({
  schedules,
  openVisit,
  onClinicOpen,
  onClinicClose,
  onVisitOpen,
  onVisitClose,
}) {
  const [active, setActive] = useState(false);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const pausedRef = useRef(false);
  const mutedRef = useRef(false);
  const cancelRef = useRef(false);
  const skipRef = useRef(false);
  const jumpToCardRef = useRef(null);
  const currentAudioRef = useRef(null);
  const audioResolverRef = useRef(null);
  const highlightRef = useRef(null);

  const tourClinicRef = useRef(null);
  const tourVisitRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const m = localStorage.getItem(MUTED_KEY);
      if (m === "1") {
        setMuted(true);
        mutedRef.current = true;
      }
    } catch {}
  }, []);

  async function pwait(ms, label) {
    if (label) log("pwait start:", label, ms + "ms");
    const start = performance.now();
    while (performance.now() - start < ms) {
      if (cancelRef.current || skipRef.current || jumpToCardRef.current !== null) {
        if (label) log("pwait early-bail:", label,
          cancelRef.current ? "cancel" : skipRef.current ? "skip" : "jump");
        return;
      }
      if (pausedRef.current) {
        while (
          pausedRef.current &&
          !cancelRef.current &&
          !skipRef.current &&
          jumpToCardRef.current === null
        ) {
          await sleep(120);
        }
      }
      await sleep(Math.min(80, ms - (performance.now() - start)));
    }
    if (label) log("pwait done:", label);
  }

  function clearHighlight() {
    if (typeof document === "undefined") return;
    if (highlightRef.current) {
      try { highlightRef.current.classList.remove("provider-tour-section-active"); } catch {}
      highlightRef.current = null;
    }
    document
      .querySelectorAll(".provider-tour-section-active")
      .forEach((el) => el.classList.remove("provider-tour-section-active"));
  }

  function setActiveSectionEl(selector) {
    if (!selector || typeof document === "undefined") return;
    const el = document.querySelector(selector);
    if (!el) {
      log("setActiveSectionEl: NULL element for", selector);
      return;
    }
    el.classList.add("provider-tour-section-active");
    highlightRef.current = el;
  }

  function dispatchCursor(target, arriveTime, clickTime) {
    if (typeof window === "undefined") return;
    const el = typeof document !== "undefined" ? document.querySelector(target) : null;
    log(
      "dispatchCursor:",
      target,
      "el?",
      el ? "FOUND" : "NULL",
      "arrive=",
      arriveTime,
      "click=",
      clickTime
    );
    window.dispatchEvent(
      new CustomEvent("kairos-tour:beat-start", {
        detail: {
          cursor: {
            target,
            startTime: 0,
            arriveTime: typeof arriveTime === "number" ? arriveTime : PACING.cursorTravelMs,
            clickTime: typeof clickTime === "number" ? clickTime : null,
          },
        },
      })
    );
  }

  async function preScroll(selector, blockMode) {
    if (!selector || typeof document === "undefined") return;
    const el = document.querySelector(selector);
    if (!el) {
      log("preScroll: NULL element for", selector);
      return;
    }
    const rect = el.getBoundingClientRect();
    const margin = 80;
    const inView =
      rect.top >= margin && rect.bottom <= window.innerHeight - margin;
    if (inView) return;
    try {
      el.scrollIntoView({
        behavior: "smooth",
        block: blockMode || "center",
        inline: "nearest",
      });
    } catch {
      try { el.scrollIntoView(); } catch {}
    }
    await pwait(PACING.scrollSettleMs, "scroll-settle");
  }

  function scrollSectionToTop(selector) {
    if (!selector || typeof document === "undefined") return;
    const el = document.querySelector(selector);
    if (!el) {
      log("scrollSectionToTop: NULL element for", selector);
      return;
    }
    try {
      el.scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "nearest",
      });
    } catch {
      try { el.scrollIntoView(); } catch {}
    }
  }

  async function playAudioAndWait(audioKey, label) {
    if (!audioKey || mutedRef.current) {
      log("playAudioAndWait: skipping", { audioKey, muted: mutedRef.current, label });
      return;
    }
    if (cancelRef.current || skipRef.current || jumpToCardRef.current !== null) {
      log("playAudioAndWait: early-bail before play", label);
      return;
    }
    // Cache-bust per pageload so updated MP3s aren't served from a
    // stale browser audio cache.
    const src = AUDIO_BASE + audioKey + ".mp3?v=" + AUDIO_CACHE_BUST;
    log("playAudioAndWait: loading", { src, label });
    let audio;
    try {
      audio = new Audio(src);
      audio.preload = "auto";
    } catch (e) {
      log("playAudioAndWait: ctor failed", e && e.message);
      return;
    }
    currentAudioRef.current = audio;

    await new Promise((resolve) => {
      let resolved = false;
      const finish = (reason) => {
        if (resolved) return;
        resolved = true;
        log("playAudioAndWait: finish", { audioKey, reason });
        try {
          audio.removeEventListener("ended", onEnded);
          audio.removeEventListener("error", onError);
        } catch {}
        resolve();
      };
      function onEnded() { finish("ended"); }
      function onError() { finish("error"); }
      audioResolverRef.current = () => finish("external");
      audio.addEventListener("ended", onEnded);
      audio.addEventListener("error", onError);
      try {
        const p = audio.play();
        if (p && typeof p.catch === "function") {
          p.catch((e) => { log("playAudioAndWait: play() rejected", e && e.message); finish("play-rejected"); });
        }
      } catch (e) {
        log("playAudioAndWait: play() threw", e && e.message);
        finish("play-threw");
      }
    });

    audioResolverRef.current = null;
    try { audio.pause(); } catch {}
    currentAudioRef.current = null;
  }

  function findVisit(visitId) {
    for (const key of Object.keys(schedules || {})) {
      const list = schedules[key] || [];
      const v = list.find((x) => x.id === visitId);
      if (v) return { visit: v, specialty: key };
    }
    return null;
  }

  // ── Step handlers ──

  async function runOpener(step) {
    log("runOpener: start", step.audioKey);
    // Pre-position cursor on the Cardiology button so it pulses there
    // during the opening narration rather than parking center-screen.
    const target = step.cursorTarget || '[data-clinic="cardiology"]';
    await preScroll(target, "start");
    if (cancelRef.current || skipRef.current || jumpToCardRef.current !== null) return;
    dispatchCursor(target, PACING.cursorTravelMs);
    await pwait(PACING.cursorTravelMs + 200, "opener-cursor-arrive");
    if (cancelRef.current || skipRef.current || jumpToCardRef.current !== null) return;
    await pwait(PACING.preAudioPauseMs, "opener-pre-audio");
    if (cancelRef.current || skipRef.current || jumpToCardRef.current !== null) return;
    await playAudioAndWait(step.audioKey, "opener");
    log("runOpener: done");
  }

  async function runOpenClinic(step) {
    log("runOpenClinic: start", step.clinic);
    const tabSel = `[data-clinic="${step.clinic}"]`;
    if (!step.skipCursorTravel) {
      await preScroll(tabSel, "start");
      if (cancelRef.current || skipRef.current || jumpToCardRef.current !== null) return;
      dispatchCursor(tabSel, PACING.cursorTravelMs, PACING.cursorTravelMs + 200);
      await pwait(PACING.cursorTravelMs + PACING.clickHighlightMs, "openClinic-cursor");
    } else {
      // Cursor is already on the button (from the opener) — just fire a
      // click ripple and open the dropdown.
      log("runOpenClinic: skipCursorTravel, dispatching click ripple only");
      dispatchCursor(tabSel, 0, 100);
      await pwait(PACING.clickHighlightMs, "openClinic-click");
    }
    if (cancelRef.current || skipRef.current || jumpToCardRef.current !== null) return;
    onClinicOpen(step.clinic);
    tourClinicRef.current = step.clinic;
    log("runOpenClinic: dropdown opened", step.clinic);
    await pwait(PACING.dropdownOpenMs, "openClinic-render");
    log("runOpenClinic: done");
  }

  // Scripted chat demo. Runs at the end of Card 3 (Whitestone) before
  // the closing narration. Drives the live ChartChat component via
  // window events — does NOT call /api/provider-chat. The pre-baked
  // answer keeps the demo deterministic. Instrumented with detailed
  // step-level logging so we can diagnose missed phases.
  async function runChatDemo() {
    if (typeof window === "undefined") return;
    log("runChatDemo: BEGIN");
    const inputSel = '[data-tour-anchor="chat-input"]';
    const submitSel = '[data-tour-anchor="chat-submit"]';
    const QUESTION = "What is his ejection fraction?";
    const ANSWER = {
      text:
        "Ejection fraction is 35%, documented at the time of recent HFrEF diagnosis during the post-hospital discharge workup.",
      citedSections: ["02", "09"],
      notFound: false,
    };

    // Phase 0 — DOM probe. Confirm the chat input is mounted.
    const inputEl0 = document.querySelector(inputSel);
    const submitEl0 = document.querySelector(submitSel);
    log("runChatDemo: phase 0 / DOM probe", {
      inputFound: !!inputEl0,
      submitFound: !!submitEl0,
      inputTag: inputEl0 ? inputEl0.tagName : null,
      inputDisabled: inputEl0 ? inputEl0.disabled : null,
    });

    // Phase 1 — reset chat state.
    log("runChatDemo: phase 1 / chat-reset dispatch");
    window.dispatchEvent(new CustomEvent("kairos-tour:chat-reset"));
    await pwait(200, "chat-reset");
    if (cancelRef.current || skipRef.current || jumpToCardRef.current !== null) {
      log("runChatDemo: bail after phase 1");
      return;
    }

    // Phase 2 — explicitly scroll the briefing drawer's internal scroll
    // container to the top so the chat input sits in the visible
    // viewport BEFORE the cursor begins moving. preScroll's
    // scrollIntoView path was unreliable here because the drawer was
    // scrolled all the way to Section 12 (rect.top of the input far
    // negative), the sticky header overlapped scroll-mt math, and
    // smooth-scroll on a deeply-scrolled overflow ancestor sometimes
    // lands short. Setting scrollTop = 0 directly is deterministic and
    // matches the drawer's natural top position (chat input is the
    // first scrollable element in the drawer body).
    const drawerEl =
      typeof document !== "undefined"
        ? document.getElementById("provider-briefing-drawer")
        : null;
    log("runChatDemo: phase 2 / scroll drawer to top", {
      drawerFound: !!drawerEl,
      drawerScrollTopBefore: drawerEl ? drawerEl.scrollTop : null,
    });
    if (drawerEl) {
      try {
        drawerEl.scrollTo({ top: 0, behavior: "smooth" });
      } catch {
        try { drawerEl.scrollTop = 0; } catch {}
      }
    }
    // Hold long enough for smooth scroll + a beat. Drawer scroll height
    // is ~1500-2500px after a full briefing renders; 900ms is generous
    // even on slower hardware.
    await pwait(900, "chat-drawer-scroll-settle");
    if (cancelRef.current || skipRef.current || jumpToCardRef.current !== null) return;
    // Belt-and-suspenders: snap to 0 if smooth scroll didn't land.
    if (drawerEl && drawerEl.scrollTop > 4) {
      log("runChatDemo: phase 2 / snap scrollTop=0", {
        leftover: drawerEl.scrollTop,
      });
      try { drawerEl.scrollTop = 0; } catch {}
      await pwait(120, "chat-drawer-scroll-snap");
    }
    log("runChatDemo: phase 2 / drawer scrollTop after", {
      drawerScrollTop: drawerEl ? drawerEl.scrollTop : null,
    });

    // Phase 3 — cursor travels up from Section 12 to the chat input.
    const TRAVEL_MS = 1500;
    log("runChatDemo: phase 3 / cursor → input", { travel: TRAVEL_MS });
    dispatchCursor(inputSel, TRAVEL_MS, TRAVEL_MS + 200);
    await pwait(TRAVEL_MS + PACING.clickHighlightMs, "chat-cursor-input");
    if (cancelRef.current || skipRef.current || jumpToCardRef.current !== null) return;

    // Phase 4 — typewriter question into the controlled input. ~40ms/char.
    log("runChatDemo: phase 4 / typewriter start", { chars: QUESTION.length });
    for (let i = 1; i <= QUESTION.length; i++) {
      if (cancelRef.current || skipRef.current || jumpToCardRef.current !== null) {
        log("runChatDemo: typewriter early-bail at i=", i);
        return;
      }
      const slice = QUESTION.slice(0, i);
      window.dispatchEvent(
        new CustomEvent("kairos-tour:chat-question", {
          detail: { question: slice },
        })
      );
      // Probe what actually landed in the input every 5 characters.
      if (i % 5 === 0 || i === QUESTION.length) {
        const live = document.querySelector(inputSel);
        log("runChatDemo: typewriter probe", {
          i,
          slice,
          domValue: live ? live.value : "(no element)",
        });
      }
      await pwait(40, null);
    }
    log("runChatDemo: phase 4 / typewriter end");

    // Phase 5 — beat after typing finishes.
    await pwait(600, "chat-post-type");
    if (cancelRef.current || skipRef.current || jumpToCardRef.current !== null) return;

    // Phase 6 — cursor moves to submit; click ripple.
    log("runChatDemo: phase 6 / cursor → submit");
    dispatchCursor(submitSel, PACING.cursorTravelMs, PACING.cursorTravelMs + 200);
    await pwait(PACING.cursorTravelMs + PACING.clickHighlightMs, "chat-cursor-submit");
    if (cancelRef.current || skipRef.current || jumpToCardRef.current !== null) return;

    // Phase 7 — loading state holds ~1.2s.
    log("runChatDemo: phase 7 / chat-loading dispatch");
    window.dispatchEvent(
      new CustomEvent("kairos-tour:chat-loading", { detail: { loading: true } })
    );
    await pwait(1200, "chat-loading");
    if (cancelRef.current || skipRef.current || jumpToCardRef.current !== null) return;

    // Phase 8 — pre-baked answer fades in.
    log("runChatDemo: phase 8 / chat-answer dispatch");
    window.dispatchEvent(
      new CustomEvent("kairos-tour:chat-answer", { detail: ANSWER })
    );
    // Hold the answer on screen so the viewer can read it before the
    // closing narration begins.
    await pwait(1500, "chat-answer-hold");
    log("runChatDemo: END");
  }

  async function runCardWalk(step) {
    log("runCardWalk: start card", step.card, "visit", step.visitId);
    const rowSel = `[data-encounter-id="${step.visitId}"]`;
    await preScroll(rowSel, "center");
    if (cancelRef.current || jumpToCardRef.current !== null) return;
    dispatchCursor(rowSel, PACING.cursorTravelMs, PACING.cursorTravelMs + 200);
    await pwait(PACING.cursorTravelMs + PACING.clickHighlightMs, "cardWalk-row-cursor");
    if (cancelRef.current || jumpToCardRef.current !== null) return;

    const found = findVisit(step.visitId);
    if (found) {
      log("runCardWalk: opening visit", found.visit.id, found.specialty);
      onVisitOpen(found.visit, found.specialty);
      tourVisitRef.current = { visit: found.visit, specialty: found.specialty };
    } else {
      log("runCardWalk: NO visit found for", step.visitId);
    }
    await pwait(PACING.cardOpenMs, "cardWalk-card-open");
    if (cancelRef.current || jumpToCardRef.current !== null) {
      log("runCardWalk: bail after card open");
      return;
    }

    log("runCardWalk: walking 12 sections, card", step.card);
    for (let s = 1; s <= 12; s++) {
      if (cancelRef.current || jumpToCardRef.current !== null) {
        log("runCardWalk: section loop break at", s);
        break;
      }
      skipRef.current = false;
      const sectionId = String(s).padStart(2, "0");
      const sel = targetForSection(sectionId);
      log("runCardWalk: section", sectionId);

      clearHighlight();
      scrollSectionToTop(sel);
      await pwait(PACING.scrollSettleMs, `s${sectionId}-scroll`);
      if (cancelRef.current || jumpToCardRef.current !== null) break;

      setActiveSectionEl(sel);
      dispatchCursor(sel, PACING.cursorTravelMs);
      await pwait(PACING.cursorTravelMs + 200, `s${sectionId}-cursor`);
      if (cancelRef.current || jumpToCardRef.current !== null) break;

      await pwait(PACING.preAudioPauseMs, `s${sectionId}-pre-audio`);
      if (cancelRef.current || jumpToCardRef.current !== null) break;

      const audioKey = audioKeyForSection(step.card, sectionId);
      await playAudioAndWait(audioKey, `card${step.card}-s${sectionId}`);
    }

    if (step.includesChatDemo && !cancelRef.current && jumpToCardRef.current === null) {
      // Skip flag may still be set from the user spamming Skip through
      // the 12-section walk. Clear it here so leftover skip-state can't
      // short-circuit the post-walk chat demo at Phase 1. Skips inside
      // the demo's own phases still work — runChatDemo respects skipRef
      // internally.
      skipRef.current = false;
      log("runCardWalk: chat demo (skipRef cleared)");
      await runChatDemo();
    }

    if (step.includesCloser && !cancelRef.current && jumpToCardRef.current === null) {
      // Same reasoning — clear any skip carried out of the chat demo so
      // the closing narration always plays unless the user clicks End.
      skipRef.current = false;
      log("runCardWalk: closing narration (skipRef cleared)", step.closerAudioKey);
      await pwait(PACING.preAudioPauseMs, "closer-pre-audio");
      await playAudioAndWait(step.closerAudioKey || CLOSING_AUDIO_KEY, "closer");
    }

    clearHighlight();
    if (!cancelRef.current && jumpToCardRef.current === null) {
      log("runCardWalk: closing card", step.card);
      onVisitClose();
      tourVisitRef.current = null;
      await pwait(PACING.cardCloseMs, "cardWalk-card-close");
    }
    log("runCardWalk: done card", step.card);
  }

  async function playStep(step, idx) {
    if (cancelRef.current) return;
    skipRef.current = false;
    log("playStep:", idx, step.type);
    switch (step.type) {
      case "opener": await runOpener(step); break;
      case "openClinic": await runOpenClinic(step); break;
      case "cardWalk": await runCardWalk(step); break;
      default: log("playStep: unknown type", step.type); break;
    }
    log("playStep: done", idx);
  }

  async function runJumpToCard(cardN) {
    log("runJumpToCard:", cardN);
    const target = CARD_TARGETS[cardN];
    if (!target) return -1;

    if (tourVisitRef.current) {
      clearHighlight();
      onVisitClose();
      tourVisitRef.current = null;
      await pwait(PACING.cardCloseMs, "jump-close-card");
    }

    if (tourClinicRef.current !== target.clinic) {
      const tabSel = `[data-clinic="${target.clinic}"]`;
      await preScroll(tabSel, "start");
      dispatchCursor(tabSel, PACING.cursorTravelMs, PACING.cursorTravelMs + 200);
      await pwait(PACING.cursorTravelMs + PACING.clickHighlightMs, "jump-cursor-tab");
      if (cancelRef.current) return -1;
      onClinicOpen(target.clinic);
      tourClinicRef.current = target.clinic;
      await pwait(PACING.dropdownOpenMs, "jump-dropdown-render");
    }

    return target.stepIdx;
  }

  const runTour = useCallback(async () => {
    if (typeof window === "undefined") return;
    log("runTour: BEGIN");
    cancelRef.current = false;
    skipRef.current = false;
    jumpToCardRef.current = null;
    pausedRef.current = false;
    tourClinicRef.current = null;
    tourVisitRef.current = null;
    setPaused(false);
    setActive(true);
    try { sessionStorage.setItem(ACTIVE_KEY, "1"); } catch {}
    try { window.scrollTo({ top: 0, left: 0, behavior: "auto" }); } catch {}

    let i = 0;
    while (i < STEPS.length) {
      if (cancelRef.current) break;
      log("runTour: loop iter", i, "of", STEPS.length);
      setStepIndex(i);
      await playStep(STEPS[i], i);
      if (cancelRef.current) break;
      if (jumpToCardRef.current !== null) {
        const cardN = jumpToCardRef.current;
        jumpToCardRef.current = null;
        skipRef.current = false;
        const target = await runJumpToCard(cardN);
        if (cancelRef.current) break;
        if (target >= 0) {
          i = target;
          continue;
        }
      }
      skipRef.current = false;
      i += 1;
    }

    log("runTour: cleanup");
    clearHighlight();
    if (tourVisitRef.current) {
      onVisitClose();
      tourVisitRef.current = null;
    }
    if (tourClinicRef.current) {
      onClinicClose();
      tourClinicRef.current = null;
    }
    try { sessionStorage.removeItem(ACTIVE_KEY); } catch {}
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("kairos-tour:end"));
    }
    setActive(false);
    setPaused(false);
    setStepIndex(0);
    log("runTour: END");
  }, [onClinicOpen, onClinicClose, onVisitOpen, onVisitClose, schedules]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    function onStart() {
      if (active) return;
      runTour();
    }
    window.addEventListener("kairos-provider-tour:start", onStart);
    return () => window.removeEventListener("kairos-provider-tour:start", onStart);
  }, [active, runTour]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    function onKey(e) {
      if (!active) return;
      if (e.key === " " || e.code === "Space") {
        const el = e.target;
        if (
          el &&
          (el.tagName === "INPUT" ||
            el.tagName === "TEXTAREA" ||
            el.isContentEditable)
        ) return;
        e.preventDefault();
        pausedRef.current = !pausedRef.current;
        setPaused(pausedRef.current);
        if (currentAudioRef.current) {
          try {
            if (pausedRef.current) currentAudioRef.current.pause();
            else currentAudioRef.current.play().catch(() => {});
          } catch {}
        }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [active]);

  function handleTogglePause() {
    pausedRef.current = !pausedRef.current;
    setPaused(pausedRef.current);
    if (currentAudioRef.current) {
      try {
        if (pausedRef.current) currentAudioRef.current.pause();
        else currentAudioRef.current.play().catch(() => {});
      } catch {}
    }
  }

  function handleToggleMute() {
    mutedRef.current = !mutedRef.current;
    setMuted(mutedRef.current);
    try { localStorage.setItem(MUTED_KEY, mutedRef.current ? "1" : "0"); } catch {}
    if (currentAudioRef.current) {
      try {
        if (mutedRef.current) currentAudioRef.current.pause();
        else currentAudioRef.current.play().catch(() => {});
      } catch {}
    }
  }

  function handleSkip() {
    log("handleSkip pressed");
    skipRef.current = true;
    if (currentAudioRef.current) { try { currentAudioRef.current.pause(); } catch {} }
    if (audioResolverRef.current) { try { audioResolverRef.current(); } catch {} }
  }

  function handleJumpCard(cardN) {
    log("handleJumpCard pressed:", cardN);
    jumpToCardRef.current = cardN;
    if (currentAudioRef.current) { try { currentAudioRef.current.pause(); } catch {} }
    if (audioResolverRef.current) { try { audioResolverRef.current(); } catch {} }
  }

  function handleEnd() {
    log("handleEnd pressed");
    cancelRef.current = true;
    pausedRef.current = false;
    if (currentAudioRef.current) { try { currentAudioRef.current.pause(); } catch {} }
    if (audioResolverRef.current) { try { audioResolverRef.current(); } catch {} }
  }

  if (!active) return null;
  const currentStep = STEPS[stepIndex];
  const activeCard = (currentStep && currentStep.card) || 1;
  const drawerOpen = !!openVisit;

  return (
    <PauseBadge
      paused={paused}
      muted={muted}
      step={stepIndex}
      total={STEPS.length}
      activeCard={activeCard}
      drawerOpen={drawerOpen}
      onJumpCard={handleJumpCard}
      onSkip={handleSkip}
      onTogglePause={handleTogglePause}
      onToggleMute={handleToggleMute}
      onEnd={handleEnd}
    />
  );
}
