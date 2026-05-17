// /provider per-clinic tour orchestrator. One MP3 per clinic. Listens
// for `kairos-provider-tour:start-clinic` events from the per-clinic
// tour buttons in each column header. Plays the clinic's narration MP3
// and advances five visual beats on timed startMs cues.
//
// Beat actions:
//   intro          highlight column, no DOM change beyond that
//   open-patient   cursor → patient card → open briefing drawer
//   drill-finding  scroll drawer to findings panel (Section 09) +
//                  add highlight class
//   architecture   stay on findings, narration carries the beat
//   closer         close drawer
//
// The audio is the master clock. We do not gate beat advancement on
// audio.ended — beats advance whenever audio.currentTime crosses the
// next beat's startMs. If audio errors or stalls, a watchdog ends the
// tour cleanly.

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { tourForClinic, PACING } from "../lib/providerTourScript";

const ACTIVE_KEY = "kairos-provider-tour-active";
const MUTED_KEY = "kairos.provider-tour.muted";
const AUDIO_BASE = "/provider-tour-audio/";
const AUDIO_CACHE_BUST =
  typeof Date !== "undefined" ? Date.now().toString(36) : "0";
const AUDIO_START_TIMEOUT_MS = 6000;
const BEAT_POLL_MS = 200;

const log = (...args) => console.log("[provider-tour]", ...args);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function PauseBadge({ paused, muted, beatLabel, onTogglePause, onToggleMute, onEnd }) {
  return (
    <div
      role="region"
      aria-label="Tour controls"
      className="fixed top-[80px] left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-graphite/95 border border-mist/70 rounded-full px-3 py-1.5 shadow-2xl backdrop-blur-sm"
    >
      <span className="kairos-data text-[11px] text-bone-muted tabular-nums px-1.5">
        {beatLabel}
      </span>
      <span className="text-bone-muted/40">·</span>
      <button type="button" onClick={onTogglePause} title={paused ? "Resume" : "Pause"} className="text-[11px] font-medium text-bone hover:text-amber transition-colors px-1.5">
        {paused ? "▶" : "⏸"}
      </button>
      <button type="button" onClick={onToggleMute} title={muted ? "Unmute" : "Mute"} className="text-[11px] font-medium text-bone-muted hover:text-bone transition-colors px-1.5">
        {muted ? "🔇" : "🔊"}
      </button>
      <button type="button" onClick={onEnd} title="End tour" className="text-[11px] font-medium text-bone-muted hover:text-bone transition-colors px-1.5">
        End
      </button>
    </div>
  );
}

export default function ProviderTour({
  schedules,
  openVisit,
  onClinicHighlight,
  onVisitOpen,
  onVisitClose,
}) {
  const [activeClinic, setActiveClinic] = useState(null);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const [beatLabel, setBeatLabel] = useState("");

  const pausedRef = useRef(false);
  const mutedRef = useRef(false);
  const cancelRef = useRef(false);
  const currentAudioRef = useRef(null);
  const highlightRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (localStorage.getItem(MUTED_KEY) === "1") {
        setMuted(true);
        mutedRef.current = true;
      }
    } catch {}
  }, []);

  function clearHighlight() {
    if (typeof document === "undefined") return;
    if (highlightRef.current) {
      try {
        highlightRef.current.classList.remove("provider-tour-section-active");
      } catch {}
      highlightRef.current = null;
    }
    document
      .querySelectorAll(".provider-tour-section-active")
      .forEach((el) => el.classList.remove("provider-tour-section-active"));
  }

  function setHighlightEl(selector) {
    if (!selector || typeof document === "undefined") return;
    const el = document.querySelector(selector);
    if (!el) {
      log("setHighlightEl: NULL element for", selector);
      return;
    }
    el.classList.add("provider-tour-section-active");
    highlightRef.current = el;
  }

  function dispatchCursor(target, arriveTime, clickTime) {
    if (typeof window === "undefined") return;
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
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const margin = 60;
    const inView = rect.top >= margin && rect.bottom <= window.innerHeight - margin;
    if (inView) return;
    try {
      el.scrollIntoView({ behavior: "smooth", block: blockMode || "center", inline: "nearest" });
    } catch {
      try { el.scrollIntoView(); } catch {}
    }
    await sleep(PACING.scrollSettleMs);
  }

  function findVisit(visitId) {
    for (const key of Object.keys(schedules || {})) {
      const list = schedules[key] || [];
      const v = list.find((x) => x.id === visitId);
      if (v) return { visit: v, specialty: key };
    }
    return null;
  }

  // Beat handlers. Each is idempotent — called once when the audio
  // currentTime crosses the beat's startMs.
  async function handleBeat(tour, beat) {
    log("beat:", beat.kind, "at", beat.startMs);
    setBeatLabel(beat.kind);
    if (beat.kind === "intro") {
      onClinicHighlight && onClinicHighlight(tour.clinicKey);
      const colSel = `[data-tour-anchor="clinic-column-${tour.clinicKey}"]`;
      await preScroll(colSel, "start");
      dispatchCursor(colSel, PACING.cursorTravelMs);
      return;
    }
    if (beat.kind === "open-patient") {
      const cardSel = `[data-encounter-id="${tour.patientId}"]`;
      await preScroll(cardSel, "center");
      if (cancelRef.current) return;
      dispatchCursor(cardSel, PACING.cursorTravelMs, PACING.cursorTravelMs + 200);
      await sleep(PACING.cursorTravelMs + PACING.clickHighlightMs);
      if (cancelRef.current) return;
      const found = findVisit(tour.patientId);
      if (found) {
        onVisitOpen && onVisitOpen(found.visit, found.specialty);
      } else {
        log("open-patient: NO visit found for", tour.patientId);
      }
      return;
    }
    if (beat.kind === "drill-finding") {
      const sel = `[data-tour-anchor="briefing-section-09"]`;
      // Drawer may take a moment to render Section 09 after open.
      await sleep(300);
      const el = typeof document !== "undefined" ? document.querySelector(sel) : null;
      if (el) {
        try {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        } catch {}
        await sleep(PACING.scrollSettleMs);
      }
      clearHighlight();
      setHighlightEl(sel);
      dispatchCursor(sel, PACING.cursorTravelMs);
      return;
    }
    if (beat.kind === "architecture") {
      // Keep findings highlighted; no DOM change.
      return;
    }
    if (beat.kind === "closer") {
      clearHighlight();
      if (onVisitClose) onVisitClose();
      const colSel = `[data-tour-anchor="clinic-column-${tour.clinicKey}"]`;
      await sleep(PACING.drawerCloseMs);
      await preScroll(colSel, "start");
      dispatchCursor(colSel, PACING.cursorTravelMs);
      onClinicHighlight && onClinicHighlight(tour.clinicKey);
      return;
    }
  }

  async function runTour(tour) {
    if (typeof window === "undefined") return;
    log("runTour: BEGIN", tour.clinicKey);
    cancelRef.current = false;
    pausedRef.current = false;
    setPaused(false);
    setActiveClinic(tour.clinicKey);
    setBeatLabel("");
    try { sessionStorage.setItem(ACTIVE_KEY, "1"); } catch {}
    try { window.scrollTo({ top: 0, left: 0, behavior: "auto" }); } catch {}

    // Pre-arm: highlight column immediately so the viewer's eye lands
    // there before audio starts.
    onClinicHighlight && onClinicHighlight(tour.clinicKey);

    // Build & start audio.
    const src = AUDIO_BASE + tour.audioKey + ".mp3?v=" + AUDIO_CACHE_BUST;
    log("loading audio", src);
    let audio;
    try {
      audio = new Audio(src);
      audio.preload = "auto";
      if (mutedRef.current) audio.muted = true;
    } catch (e) {
      log("audio ctor failed", e && e.message);
      cleanup(tour);
      return;
    }
    currentAudioRef.current = audio;

    const startedAt = Date.now();
    let audioPlaying = false;
    audio.addEventListener("playing", () => { audioPlaying = true; });
    audio.addEventListener("ended", () => { cancelRef.current = true; });
    audio.addEventListener("error", () => { cancelRef.current = true; });

    try {
      const p = audio.play();
      if (p && typeof p.catch === "function") {
        p.catch((e) => {
          log("play() rejected", e && e.message);
          cancelRef.current = true;
        });
      }
    } catch (e) {
      log("play() threw", e && e.message);
      cancelRef.current = true;
    }

    const firedBeats = new Set();
    // Fire intro immediately (startMs 0) before the first poll tick.
    if (tour.beats[0] && tour.beats[0].startMs === 0) {
      await handleBeat(tour, tour.beats[0]);
      firedBeats.add(0);
    }

    while (!cancelRef.current) {
      // Watchdog: if audio never starts playing within window, abort.
      if (!audioPlaying && Date.now() - startedAt > AUDIO_START_TIMEOUT_MS) {
        log("audio start timeout — aborting tour");
        cancelRef.current = true;
        break;
      }
      // If paused, just wait.
      if (pausedRef.current) {
        await sleep(BEAT_POLL_MS);
        continue;
      }
      const t = (audio.currentTime || 0) * 1000;
      for (let i = 0; i < tour.beats.length; i++) {
        if (firedBeats.has(i)) continue;
        const b = tour.beats[i];
        if (t >= b.startMs) {
          firedBeats.add(i);
          await handleBeat(tour, b);
          if (cancelRef.current) break;
        }
      }
      // End once all beats have fired AND audio is finished or near-end.
      if (firedBeats.size >= tour.beats.length && (audio.ended || (audio.duration && t >= audio.duration * 1000 - 50))) {
        break;
      }
      await sleep(BEAT_POLL_MS);
    }

    log("runTour: END cleanup");
    cleanup(tour);
  }

  function cleanup(tour) {
    clearHighlight();
    if (currentAudioRef.current) {
      try { currentAudioRef.current.pause(); } catch {}
      currentAudioRef.current = null;
    }
    if (onVisitClose) {
      try { onVisitClose(); } catch {}
    }
    try { sessionStorage.removeItem(ACTIVE_KEY); } catch {}
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("kairos-tour:end"));
    }
    setActiveClinic(null);
    setPaused(false);
    setBeatLabel("");
  }

  const startClinicTour = useCallback(
    (clinicKey) => {
      if (activeClinic) {
        log("startClinicTour: already active — ignoring", clinicKey);
        return;
      }
      const tour = tourForClinic(clinicKey);
      if (!tour) {
        log("startClinicTour: no tour for", clinicKey);
        return;
      }
      runTour(tour);
    },
    [activeClinic, schedules]
  );

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    function onStart(e) {
      const clinic = e && e.detail && e.detail.clinic;
      if (clinic) startClinicTour(clinic);
    }
    window.addEventListener("kairos-provider-tour:start-clinic", onStart);
    return () =>
      window.removeEventListener("kairos-provider-tour:start-clinic", onStart);
  }, [startClinicTour]);

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
      try { currentAudioRef.current.muted = mutedRef.current; } catch {}
    }
  }

  function handleEnd() {
    log("handleEnd pressed");
    cancelRef.current = true;
    pausedRef.current = false;
    if (currentAudioRef.current) {
      try { currentAudioRef.current.pause(); } catch {}
    }
  }

  if (!activeClinic) return null;
  return (
    <PauseBadge
      paused={paused}
      muted={muted}
      beatLabel={beatLabel}
      onTogglePause={handleTogglePause}
      onToggleMute={handleToggleMute}
      onEnd={handleEnd}
    />
  );
}
