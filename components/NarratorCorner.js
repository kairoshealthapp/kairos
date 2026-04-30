// Phase 3.3 Tour Mode — persistent corner narrator box.
// Bottom-right by default. Used for pre-arrival, post-Authorize, and
// transition narration. Carries the tour HUD: progress, speed toggle,
// mute toggle, skip button.

"use client";

function SpeakerOnIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  );
}

function SpeakerOffIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <line x1="22" y1="9" x2="16" y2="15" />
      <line x1="16" y1="9" x2="22" y2="15" />
    </svg>
  );
}

export default function NarratorCorner({
  title,
  body,
  progressLabel,
  step,
  total,
  speed,
  onToggleSpeed,
  onSkip,
  onContinue,
  paused,
  muted,
  onToggleMuted,
}) {
  const pct = total > 0 ? Math.round(((step + 1) / total) * 100) : 0;
  return (
    <div
      className="fixed z-[55] right-4 bottom-4 w-[340px] kairos-card p-4 shadow-2xl"
      style={{
        background: "var(--color-platinum)",
        borderColor: "var(--color-amber)",
        borderWidth: 1,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-2 gap-2">
        <span className="kairos-kicker text-amber/80 truncate">
          {progressLabel || "Tour"}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {onToggleMuted ? (
            <button
              type="button"
              onClick={onToggleMuted}
              className="text-bone-muted hover:text-bone bg-graphite/40 border border-mist/60 rounded-pill p-1"
              title={muted ? "Voice narration off — click to turn on" : "Voice narration on — click to mute"}
              aria-label={muted ? "Unmute voice narration" : "Mute voice narration"}
            >
              {muted ? <SpeakerOffIcon /> : <SpeakerOnIcon />}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onToggleSpeed}
            className="text-[11px] font-medium text-bone-muted hover:text-bone bg-graphite/40 border border-mist/60 rounded-pill px-2 py-0.5"
            title="Toggle playback speed"
          >
            {speed}x
          </button>
          {onSkip ? (
            <button
              type="button"
              onClick={onSkip}
              className="text-[11px] font-medium text-bone-muted hover:text-oxblood bg-graphite/40 border border-mist/60 rounded-pill px-2 py-0.5"
              title="Skip tour"
            >
              Skip
            </button>
          ) : null}
        </div>
      </div>
      {title ? (
        <h3 className="kairos-display text-bone text-[16px] font-medium leading-snug mb-2">
          {title}
        </h3>
      ) : null}
      {body ? (
        <p className="text-[13px] text-bone leading-relaxed mb-3">{body}</p>
      ) : null}
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 h-[3px] bg-graphite/60 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
        {paused ? (
          <span className="text-[10px] text-amber/80 ml-2">paused</span>
        ) : null}
        {onContinue ? (
          <button
            type="button"
            onClick={onContinue}
            className="text-[12px] font-semibold text-graphite bg-amber hover:bg-amber/90 px-3 py-1 rounded-full ml-2"
          >
            Continue →
          </button>
        ) : null}
      </div>
    </div>
  );
}
