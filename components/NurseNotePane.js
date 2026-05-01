// Phase 3.3 — Nurse Note Pane (top-right). Renders the HVC-drafted nurse
// note in clinical register. Animates typing during simulation playback;
// becomes editable when the parent flips `editable={true}` (Edit button).
//
// Phase-3.4 quality fix: previously this pane wrapped content in
// <TypingText/>, which re-typed the string from zero on every prop change.
// EncounterDetail already streams characters into `content` one tick at a
// time, so the wrapper produced a double-typewriter that strobed the
// cursor and first ~3 characters before settling. Now we render the
// already-streamed content directly and append a blinking cursor only
// while isTyping is true.

"use client";

export default function NurseNotePane({ content, isTyping, editable, onChange }) {
  return (
    <section className="kairos-card p-4 h-full flex flex-col overflow-hidden">
      <header className="flex items-center justify-between mb-2">
        <span className="kairos-kicker kairos-kicker-strong text-amber/80">NURSE NOTE</span>
        <span className="text-[11px] text-bone-muted">Clinical register</span>
      </header>
      {editable ? (
        <textarea
          value={content || ""}
          onChange={(e) => onChange && onChange(e.target.value)}
          className="flex-1 w-full bg-platinum/40 border border-mist/60 rounded-sm p-2 text-[13px] text-bone leading-relaxed font-sans resize-none focus:outline-none focus:border-amber/60"
        />
      ) : (
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
              — empty — click an action button to draft —
            </span>
          )}
        </div>
      )}
    </section>
  );
}
