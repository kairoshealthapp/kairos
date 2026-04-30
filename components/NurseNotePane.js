// Phase 3.3 — Nurse Note Pane (top-right). Renders the HVC-drafted nurse
// note in clinical register. Animates typing during simulation playback;
// becomes editable when the parent flips `editable={true}` (Edit button).

"use client";

import TypingText from "./TypingText";

export default function NurseNotePane({ content, typingSpeedCps, isTyping, editable, onChange }) {
  return (
    <section className="kairos-card p-4 h-full flex flex-col overflow-hidden">
      <header className="flex items-center justify-between mb-2">
        <span className="kairos-kicker text-amber/80">NURSE NOTE</span>
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
          {isTyping ? (
            <TypingText content={content || ""} cps={typingSpeedCps || 80} />
          ) : (
            content || (
              <span className="text-bone-muted/60 italic">
                — empty — click an action button to draft —
              </span>
            )
          )}
        </div>
      )}
    </section>
  );
}
