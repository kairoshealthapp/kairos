// v3.0 Bookends Pass — full-screen cinematic overlay for the tour
// opener and closer. Plays a sequence of frames; each frame fades in,
// holds for `holdMs`, fades out, then advances. Optional per-frame
// audio plays at frame-start.
//
// The HUD is suppressed during bookends — TourMode hides its in-card
// HUD and provides a minimal Skip button via this component instead.

"use client";

import { useEffect, useRef, useState } from "react";

const AUDIO_BASE = "/tour-audio/";
const FADE_MS = 600;

export default function TourBookend({ config, mode, muted, onComplete, onSkip, onEnd }) {
  // mode === "opener" → Skip button advances to Card 1 (calls onSkip).
  // mode === "closer" → Close (✕) button exits tour entirely (calls onEnd).
  const [frameIdx, setFrameIdx] = useState(0);
  const [visible, setVisible] = useState(false);
  const audioRef = useRef(null);
  const cancelRef = useRef(false);

  useEffect(() => {
    cancelRef.current = false;
    let timers = [];

    async function runFrame(i) {
      if (cancelRef.current) return;
      if (i >= config.frames.length) {
        // All frames done. Final fade-out, then complete.
        setVisible(false);
        await sleep(FADE_MS);
        if (!cancelRef.current && onComplete) onComplete();
        return;
      }
      const frame = config.frames[i];
      setFrameIdx(i);
      setVisible(true);

      // Start any per-frame audio.
      if (frame.audioFile) {
        try {
          if (audioRef.current) {
            audioRef.current.pause();
          }
          const a = new Audio(AUDIO_BASE + frame.audioFile);
          a.muted = !!muted;
          audioRef.current = a;
          a.play().catch(() => {
            // Browser may block autoplay; keep going silent.
          });
        } catch (e) {
          // ignore
        }
      }

      // Hold the frame, then fade out and advance.
      const holdT = setTimeout(async () => {
        if (cancelRef.current) return;
        setVisible(false);
        await sleep(FADE_MS);
        runFrame(i + 1);
      }, frame.holdMs);
      timers.push(holdT);
    }

    // Initial fade-in delay so the overlay's CSS transition catches.
    const startT = setTimeout(() => runFrame(0), 50);
    timers.push(startT);

    return () => {
      cancelRef.current = true;
      for (const t of timers) clearTimeout(t);
      if (audioRef.current) {
        try { audioRef.current.pause(); } catch (e) { /* ignore */ }
        audioRef.current = null;
      }
    };
  }, [config, muted, onComplete]);

  // Apply mute changes mid-playback so the parent's mute toggle still
  // affects the bookend audio.
  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = !!muted;
  }, [muted]);

  function handleSkipClick() {
    cancelRef.current = true;
    if (audioRef.current) {
      try { audioRef.current.pause(); } catch (e) { /* ignore */ }
      audioRef.current = null;
    }
    if (mode === "opener" && onSkip) onSkip();
    if (mode === "closer" && onEnd) onEnd();
  }

  const frame = config.frames[frameIdx] || config.frames[0];
  const buttonLabel = mode === "opener" ? "Skip ▸" : "✕";
  const buttonTitle = mode === "opener" ? "Skip opener" : "Exit tour";

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center"
      style={{ background: "#000" }}
    >
      {/* Frame content — fades via opacity. */}
      <div
        className="text-center px-8 max-w-[900px]"
        style={{
          opacity: visible ? 1 : 0,
          transition: `opacity ${FADE_MS}ms ease-in-out`,
        }}
      >
        {frame.wordmark === "center" ? (
          <div
            className="kairos-display text-amber"
            style={{
              fontFamily: "var(--font-fraunces, 'Fraunces', serif)",
              fontSize: "clamp(72px, 12vw, 160px)",
              fontWeight: 300,
              letterSpacing: "0.02em",
              lineHeight: 1,
            }}
          >
            {frame.headline}
          </div>
        ) : (
          <h1
            className="kairos-display text-bone"
            style={{
              fontFamily: "var(--font-fraunces, 'Fraunces', serif)",
              fontSize: "clamp(28px, 4.2vw, 56px)",
              fontWeight: 400,
              letterSpacing: "-0.005em",
              lineHeight: 1.18,
            }}
          >
            {frame.headline}
          </h1>
        )}
        {frame.subline ? (
          <p
            className="text-bone-muted mt-6"
            style={{
              fontFamily: "var(--font-fraunces, 'Fraunces', serif)",
              fontSize: "clamp(16px, 1.6vw, 22px)",
              fontWeight: 300,
              lineHeight: 1.45,
              letterSpacing: "0.005em",
            }}
          >
            {frame.subline}
          </p>
        ) : null}
      </div>

      {/* Subtle wordmark in the bottom-left corner on flagged frames. */}
      {frame.wordmark === "corner" ? (
        <div
          className="fixed bottom-6 left-6 kairos-display text-amber/70"
          style={{
            fontFamily: "var(--font-fraunces, 'Fraunces', serif)",
            fontSize: "20px",
            fontWeight: 300,
            letterSpacing: "0.08em",
            opacity: visible ? 0.7 : 0,
            transition: `opacity ${FADE_MS}ms ease-in-out`,
          }}
        >
          KAIROS
        </div>
      ) : null}

      {/* Skip / close button — always visible so the viewer can exit. */}
      <button
        type="button"
        onClick={handleSkipClick}
        className="fixed top-4 right-4 text-[11px] font-medium text-bone-muted hover:text-bone bg-graphite/40 border border-mist/40 rounded-full px-3 min-h-[28px]"
        title={buttonTitle}
        aria-label={buttonTitle}
      >
        {buttonLabel}
      </button>
    </div>
  );
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
