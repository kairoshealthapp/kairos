// Phase-3.6 — Suggested Reply Panel. Companion to KairosFindingPanel for the
// Pelc already-resolved fixture. Renders the draft reply in a chat-bubble
// style with an inline "Edit" affordance that swaps in a textarea.

"use client";

import { useState } from "react";

export default function SuggestedReplyPanel({ reply }) {
  if (!reply) return null;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(reply.body || "");

  return (
    <section className="kairos-card p-4 h-full flex flex-col overflow-hidden">
      <header className="flex items-center justify-between mb-2">
        <span className="kairos-kicker text-bone-muted">SUGGESTED REPLY</span>
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          className="text-[11px] text-bone-muted hover:text-bone underline-offset-2 hover:underline"
        >
          {editing ? "Done" : "Edit"}
        </button>
      </header>

      {reply.channel ? (
        <div className="text-[12px] text-bone-muted mb-2">{reply.channel}</div>
      ) : null}

      <div className="flex-1 overflow-auto">
        {editing ? (
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="w-full h-full min-h-[120px] resize-none rounded border border-mist/60 bg-mist/5 p-2 text-[13px] text-bone leading-relaxed focus:outline-none focus:border-sage/60"
          />
        ) : (
          <div className="rounded-lg border border-mist/50 bg-mist/5 px-3 py-2 text-[13px] text-bone leading-relaxed whitespace-pre-wrap">
            {draft}
          </div>
        )}
      </div>
    </section>
  );
}
