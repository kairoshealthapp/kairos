// Phase 3.3 — typewriter animation primitive.
// Renders the given text character-by-character at `cps` characters/sec.
// When the parent passes a *new* full-string content prop, TypingText
// resets and re-types from zero. The blinking cursor stays visible until
// typing finishes; consumer hides it by passing `cursor={false}`.
//
// Designed to be a leaf component — does NOT own the panes' content
// state, just animates whatever string it is given.

"use client";

import { useEffect, useRef, useState } from "react";

export default function TypingText({
  content = "",
  cps = 60,
  className = "",
  cursor = true,
  onComplete,
}) {
  const [shown, setShown] = useState("");
  const lastContent = useRef("");
  const completedRef = useRef(false);

  useEffect(() => {
    // If content is unchanged, do nothing.
    if (content === lastContent.current) return;
    lastContent.current = content;
    completedRef.current = false;
    setShown("");

    if (!content) {
      completedRef.current = true;
      if (typeof onComplete === "function") onComplete();
      return;
    }

    const intervalMs = Math.max(8, 1000 / Math.max(1, cps));
    let i = 0;
    const id = setInterval(() => {
      i++;
      if (i >= content.length) {
        clearInterval(id);
        setShown(content);
        completedRef.current = true;
        if (typeof onComplete === "function") onComplete();
      } else {
        setShown(content.slice(0, i));
      }
    }, intervalMs);

    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, cps]);

  const showCursor = cursor && !completedRef.current;
  return (
    <span className={className}>
      <span style={{ whiteSpace: "pre-wrap" }}>{shown}</span>
      {showCursor && (
        <span className="inline-block w-[1ch] -mb-[2px] kairos-typing-cursor">▍</span>
      )}
    </span>
  );
}
