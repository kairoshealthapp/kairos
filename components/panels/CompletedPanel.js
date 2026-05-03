// v3.0 Fix 1b — Completed panel strip. Renders in place of an action
// panel after its terminal button has fired. Muted background, single
// line, subtle checkmark. No buttons. Stays visible so the nurse can
// see what's done and what's left until the card auto-clears.

"use client";

export default function CompletedPanel({ label, summary }) {
  return (
    <section
      className="kairos-card px-4 py-2.5 flex items-center gap-3"
      style={{ background: "rgba(110, 153, 124, 0.10)", borderColor: "rgba(110, 153, 124, 0.35)" }}
    >
      <span className="text-sage text-[15px] leading-none font-semibold" aria-hidden="true">✓</span>
      <span className="kairos-kicker text-bone-muted/70 text-[10px] tracking-wider">
        {label}
      </span>
      <span className="text-[12px] text-bone font-medium">{summary}</span>
    </section>
  );
}
