// Phase 3.3 — MyChart pane (bottom-left when channel = mychart). Displays
// MyChart message fields (recipient, proxy, subject, notify-by, replies,
// greeting, body). Body animates typing during simulation playback.

"use client";

import TypingText from "./TypingText";

export default function MyChartPane({ fixture, content, typingSpeedCps, isTyping }) {
  const p = fixture.patient || {};
  // For Pattern 8 CONTRADICTION (no outbound MyChart drafted), surface the
  // verify-upstream stub. Otherwise show the standard MyChart envelope.
  const noOutbound = !content && fixture.patternId === 8;

  return (
    <section className="kairos-card p-4 h-full flex flex-col overflow-hidden">
      <header className="flex items-center justify-between mb-2">
        <span className="kairos-kicker text-amber/80">MYCHART MESSAGE</span>
        <span className="text-[11px] text-bone-muted">Written register</span>
      </header>

      <dl className="text-[12px] text-bone-muted grid grid-cols-[88px_1fr] gap-x-3 gap-y-1 mb-3">
        <dt>Recipient</dt>
        <dd className="text-bone">{p.displayName || p.name}</dd>
        {p.proxyName ? (
          <>
            <dt>Proxy</dt>
            <dd className="text-bone">{p.proxyName}</dd>
          </>
        ) : null}
        <dt>Subject</dt>
        <dd className="text-bone">Test results</dd>
        <dt>Notify by</dt>
        <dd className="text-bone">2 business days</dd>
        <dt>Replies</dt>
        <dd className="text-bone">Allowed; nurse on alert</dd>
      </dl>

      <div className="border-t border-mist/40 pt-3 flex-1 overflow-auto text-[13px] text-bone leading-relaxed whitespace-pre-wrap">
        {noOutbound ? (
          <span className="text-oxblood/80 italic">
            CONTRADICTION HOLD — no patient-facing reply drafted. Forward to provider for verification.
          </span>
        ) : isTyping ? (
          <TypingText content={content || ""} cps={typingSpeedCps || 70} />
        ) : (
          content || (
            <span className="text-bone-muted/60 italic">
              — empty — click an action button to draft —
            </span>
          )
        )}
      </div>
    </section>
  );
}
