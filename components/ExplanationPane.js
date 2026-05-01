// Phase 3.3 — Explanation pane (bottom-left when channel = phone).
// Renamed from PhoneScriptPane: "How to Explain This" reframes this pane
// as a reference/example, not a script to read aloud verbatim.
//
// Includes:
//   • Title "HOW TO EXPLAIN THIS" + subtitle clarifying the pane is an example
//   • Ephemeral chip "Not part of patient record" (pane content does not
//     persist into the encounter record on Authorize)
//   • Dismiss button (top-right of pane) — clears pane content without
//     touching other panes; useful after the call to clean up before signing
//   • Callback-state chip (state machine transitions stubbed in 3.3)
//
// Phase-3.4 quality fix: dropped the <TypingText/> wrapper. See
// NurseNotePane.js for rationale.

"use client";

const CALLBACK_STATE_LABEL = {
  AWAITING_CALL: "Awaiting first attempt",
  VOICEMAIL_LEFT: "Voicemail left (attempt 1)",
  CALLBACK_ATTEMPT_2: "Callback attempt 2 scheduled",
  CALLBACK_ATTEMPT_3: "Callback attempt 3 + provider notify",
  REGISTERED_LETTER_OR_CHART_FLAG: "Registered letter / chart flag",
};

export default function ExplanationPane({
  fixture,
  content,
  isTyping,
  onDismiss,
}) {
  const callbackLabel = "AWAITING_CALL"; // state machine deferred to 3.4

  return (
    <section className="kairos-card p-4 h-full flex flex-col overflow-hidden">
      <header className="flex items-center justify-between mb-1 gap-2">
        <span className="kairos-kicker text-amber/80">HOW TO EXPLAIN THIS</span>
        {onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            className="text-[11px] text-bone-muted hover:text-bone bg-graphite/40 border border-mist/60 rounded-pill px-2 py-0.5 transition-colors"
            title="Clear this pane (does not affect Nurse Note or MyChart)"
          >
            Dismiss
          </button>
        ) : null}
      </header>

      <div className="text-[11px] text-bone-muted/80 italic mb-2 leading-snug">
        Example explanation — adapt in your own words.
      </div>

      <div className="mb-3">
        <span className="text-[10px] uppercase tracking-kicker text-bone-muted bg-graphite/50 border border-mist/60 rounded-pill px-2 py-0.5">
          Not part of patient record
        </span>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <span className="kairos-data text-[11px] text-bone-muted">Callback state:</span>
        <span className="text-[11px] text-bone bg-platinum/60 border border-mist/60 rounded-pill px-2 py-0.5">
          {CALLBACK_STATE_LABEL[callbackLabel] || callbackLabel}
        </span>
      </div>

      <div className="flex-1 overflow-auto text-[13px] text-bone leading-relaxed whitespace-pre-wrap">
        {content ? (
          <>
            <span>{content}</span>
            {isTyping && (
              <span className="inline-block w-[1ch] -mb-[2px] kairos-typing-cursor">▍</span>
            )}
          </>
        ) : isTyping ? (
          <span className="inline-block w-[1ch] -mb-[2px] kairos-typing-cursor">▍</span>
        ) : (
          <span className="text-bone-muted/60 italic">
            — empty — click an action button to draft an example —
          </span>
        )}
      </div>
    </section>
  );
}
