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

function PauseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <polygon points="6 4 20 12 6 20 6 4" />
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
  onEnd,
  onContinue,
  paused,
  onTogglePause,
  muted,
  onToggleMuted,
  onJumpToCard,
}) {
  const pct = total > 0 ? Math.round(((step + 1) / total) * 100) : 0;
  const pillCount = typeof total === "number" && total > 0 ? total : 0;
  return (
    <div
      className="fixed z-[70] right-4 top-4 w-[260px] kairos-card p-3 shadow-2xl"
      style={{
        // v3.0 Bookends Pass / Fix A1 — HUD footprint trimmed ~30%
        // (340→260 wide, p-4→p-3, smaller text/buttons) so on Card 5
        // (Greene phone) the long RN-Note + Call-Script stack no
        // longer collides with the HUD chrome. Set-and-forget across
        // every card.
        background: "var(--color-platinum)",
        borderColor: "var(--color-amber)",
        borderWidth: 1,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Pass D Phase 1 — card-navigation pills. Renders to the LEFT of
          the CARD label so the user can jump directly to any card during
          smoke-testing without watching the tour from start. The pill
          for the active card is gold; the rest are muted. */}
      {pillCount > 0 && onJumpToCard ? (
        <div className="flex items-center gap-0.5 flex-wrap mb-1.5">
          {Array.from({ length: pillCount }, (_, idx) => {
            const active = idx === step;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => onJumpToCard(idx)}
                className={
                  "inline-flex items-center justify-center text-[10px] font-semibold rounded-full border min-w-[20px] h-[20px] px-1 transition-colors " +
                  (active
                    ? "text-graphite bg-amber border-amber"
                    : "text-bone-muted hover:text-bone bg-graphite/40 border-mist/60 hover:bg-graphite/70")
                }
                title={`Jump to Card ${idx + 1}`}
                aria-label={`Jump to Card ${idx + 1}`}
                aria-current={active ? "true" : undefined}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      ) : null}
      <div className="flex items-center justify-between mb-1.5 gap-1.5">
        <span className="kairos-kicker text-amber/80 truncate text-[10px]">
          {progressLabel || "Tour"}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {onTogglePause ? (
            <button
              type="button"
              onClick={onTogglePause}
              className={
                "inline-flex items-center gap-1 text-[11px] font-semibold rounded-full border px-2 min-h-[26px] transition-colors " +
                (paused
                  ? "text-graphite bg-amber border-amber hover:bg-amber/90"
                  : "text-bone hover:text-bone bg-graphite/50 border-mist/60 hover:bg-graphite/70")
              }
              title={paused ? "Resume tour (Space)" : "Pause tour (Space)"}
              aria-label={paused ? "Resume tour" : "Pause tour"}
            >
              {paused ? <PlayIcon /> : <PauseIcon />}
              <span>{paused ? "Resume" : "Pause"}</span>
            </button>
          ) : null}
          {onToggleMuted ? (
            <button
              type="button"
              onClick={onToggleMuted}
              className="inline-flex items-center justify-center text-bone-muted hover:text-bone bg-graphite/40 border border-mist/60 rounded-full min-w-[26px] min-h-[26px] p-1"
              title={muted ? "Voice narration off — click to turn on" : "Voice narration on — click to mute"}
              aria-label={muted ? "Unmute voice narration" : "Mute voice narration"}
            >
              {muted ? <SpeakerOffIcon /> : <SpeakerOnIcon />}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onToggleSpeed}
            className="inline-flex items-center justify-center text-[10px] font-medium text-bone-muted hover:text-bone bg-graphite/40 border border-mist/60 rounded-full min-w-[26px] min-h-[26px] px-1.5"
            title="Toggle playback speed"
          >
            {speed}x
          </button>
          {onSkip ? (
            <button
              type="button"
              onClick={onSkip}
              className="text-[10px] font-medium text-bone-muted hover:text-bone bg-graphite/40 border border-mist/60 rounded-full px-2 min-h-[26px]"
              title="Skip to next card"
            >
              Skip ▸
            </button>
          ) : null}
          {onEnd ? (
            <button
              type="button"
              onClick={onEnd}
              className="text-[10px] font-medium text-bone-muted hover:text-oxblood bg-graphite/40 border border-mist/60 rounded-full px-1.5 min-h-[26px]"
              title="Exit tour"
              aria-label="Exit tour"
            >
              ✕
            </button>
          ) : null}
        </div>
      </div>
      {title ? (
        <h3 className="kairos-display text-bone text-[14px] font-medium leading-snug mb-1.5">
          {title}
        </h3>
      ) : null}
      {body ? (
        <p className="text-[12px] text-bone leading-relaxed mb-2">{body}</p>
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
