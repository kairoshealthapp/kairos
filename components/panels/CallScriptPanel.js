// v3.0 Call Script Panel — read-only AI-generated phone script. Reference
// only; never charted, never authorized. Distinguished visually from
// the actionable panels by a "Reference — not charted" sub-label and a
// muted background tint.

"use client";

export default function CallScriptPanel({ content, isTyping }) {
  return (
    <section
      className="kairos-card p-4 flex flex-col"
      style={{ background: "rgba(20, 24, 36, 0.55)" }}
    >
      <header className="flex items-center justify-between mb-2">
        <span className="kairos-kicker kairos-kicker-strong text-amber/80">
          CALL SCRIPT
          <span className="ml-2 text-bone-muted/70 font-normal tracking-normal normal-case">· read-only</span>
        </span>
        <span className="text-[11px] text-bone-muted italic">Reference — not charted</span>
      </header>
      <div className="text-[13px] text-bone-muted leading-relaxed whitespace-pre-wrap">
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
            — no script staged —
          </span>
        )}
      </div>
    </section>
  );
}
