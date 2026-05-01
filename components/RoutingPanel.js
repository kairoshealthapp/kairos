// Phase 3.6 — Routing Panel (Stream 3).
// Shared routing surface for Phase-3.6 patterns. Renders editable
// recipient/pool/comment/priority fields. Edits are local component
// state — for the demo, no backend persistence.

"use client";

import { useState } from "react";

const POOLS = [
  "Lakeside Cardiology Support Pool",
  "Lakeside Primary Care Support Pool",
  "Lakeside Endocrinology Support Pool",
  "Lakeside Pulmonology Support Pool",
];

const RECIPIENTS = [
  "Knight NP",
  "Sterne MD",
  "Dr. Marshall",
  "Dr. Knight",
];

const PRIORITIES = ["Low", "Normal", "High", "Urgent"];

export default function RoutingPanel({ routing }) {
  const initial = routing || {};
  const [recipient, setRecipient] = useState(initial.recipient || "");
  const [pool, setPool] = useState(initial.pool || "");
  const [comment, setComment] = useState(initial.comment || "");
  const [priority, setPriority] = useState(initial.priority || "Normal");

  const recipientOptions = RECIPIENTS.includes(recipient)
    ? RECIPIENTS
    : recipient
    ? [recipient, ...RECIPIENTS]
    : RECIPIENTS;

  const poolOptions = POOLS.includes(pool) ? POOLS : pool ? [pool, ...POOLS] : POOLS;

  return (
    <section className="kairos-card p-4">
      <header className="flex items-center justify-between mb-3">
        <span className="kairos-kicker kairos-kicker-strong text-amber/80">ROUTING</span>
        <span className="text-[11px] text-bone-muted">Edit before authorize</span>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className="kairos-kicker text-bone-muted/80">RECIPIENT</span>
          <select
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className="bg-platinum/40 border border-mist/60 rounded-sm px-2 py-1 text-[12px] text-bone focus:outline-none focus:border-amber/60"
          >
            {recipientOptions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="kairos-kicker text-bone-muted/80">POOL</span>
          <select
            value={pool}
            onChange={(e) => setPool(e.target.value)}
            className="bg-platinum/40 border border-mist/60 rounded-sm px-2 py-1 text-[12px] text-bone focus:outline-none focus:border-amber/60"
          >
            {poolOptions.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-3">
        <span className="kairos-kicker text-bone-muted/80">COMMENT</span>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={2}
          className="mt-1 w-full bg-platinum/40 border border-mist/60 rounded-sm px-2 py-1 text-[12px] text-bone resize-none focus:outline-none focus:border-amber/60"
        />
      </div>

      <div className="mt-3">
        <span className="kairos-kicker text-bone-muted/80">PRIORITY</span>
        <div className="mt-1 flex flex-wrap gap-3">
          {PRIORITIES.map((p) => (
            <label key={p} className="flex items-center gap-1.5 cursor-pointer text-[12px]">
              <input
                type="radio"
                name="routing-priority"
                value={p}
                checked={priority === p}
                onChange={() => setPriority(p)}
                className="accent-amber"
              />
              <span className="text-bone">{p}</span>
            </label>
          ))}
        </div>
      </div>
    </section>
  );
}
