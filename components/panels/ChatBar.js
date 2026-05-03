// v3.0 ChatBar — non-functional input shell at the top of the encounter
// detail view. UI scaffolding only; not wired to any AI API. Send is
// visually de-emphasized so the chat bar reads as a passive prompt
// surface rather than an active control.

"use client";

import { useState } from "react";

export default function ChatBar() {
  const [value, setValue] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    // No-op shell — wiring lands later.
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="kairos-card flex items-center gap-2 px-3 py-2"
    >
      <span aria-hidden="true" className="text-bone-muted/70 text-[14px] leading-none">
        ✦
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Ask Kairos about this patient..."
        className="flex-1 bg-transparent text-[13px] text-bone placeholder:text-bone-muted/80 placeholder:italic focus:outline-none px-1 py-1.5"
      />
      <button
        type="submit"
        disabled={!value.trim()}
        className="text-[11px] font-medium px-2.5 py-1 rounded-sm text-bone-muted/60 hover:text-bone-muted disabled:opacity-50 transition-colors"
        aria-label="Send"
      >
        Send
      </button>
    </form>
  );
}
