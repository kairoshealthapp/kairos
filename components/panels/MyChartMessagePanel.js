// v3.0 MyChart Message Panel — AI-drafted patient message with
// Edit / Reply / Reply+CC / Forward. Edit mode is in-place via
// contentEditable so the layout doesn't reshape. Reply / Reply+CC /
// Forward terminate the card; toast + 1.5s nav back to /rn is wired
// in EncounterDetail's onTerminate handler.

"use client";

import { useEffect, useRef, useState } from "react";
import RecipientPicker from "./RecipientPicker";

export default function MyChartMessagePanel({
  fixture,
  content,
  isTyping,
  tourMode,
  onTerminate,
}) {
  const [editing, setEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(null);
  const [picker, setPicker] = useState(null); // null | "cc" | "forward"
  const editRef = useRef(null);
  const p = (fixture && fixture.patient) || {};

  useEffect(() => {
    if (editing && editRef.current) {
      editRef.current.innerText = editedContent != null ? editedContent : content || "";
      editRef.current.focus();
      const sel = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(editRef.current);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }, [editing]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleEditToggle() {
    if (tourMode) return;
    if (editing) {
      const next = editRef.current ? editRef.current.innerText : "";
      setEditedContent(next);
    }
    setEditing((v) => !v);
  }
  function handleReply() {
    onTerminate && onTerminate({ kind: "myChart.reply" });
  }
  function handleReplyCcClick() {
    setPicker("cc");
  }
  function handleForwardClick() {
    setPicker("forward");
  }
  function handlePickerConfirm(value) {
    if (picker === "cc") {
      setPicker(null);
      onTerminate && onTerminate({ kind: "myChart.replyCc", cc: value });
    } else if (picker === "forward") {
      setPicker(null);
      onTerminate && onTerminate({ kind: "myChart.forward", recipient: value });
    }
  }

  const display = editedContent != null ? editedContent : content || "";
  // v3.0 Fix 2 — for contradiction-hold fixtures, show an amber warning
  // banner above the drafted message but keep the buttons live so the
  // nurse can still Reply, Forward, or Edit. The AI flags; the nurse
  // decides.
  const showContradictionWarning = !!(fixture && fixture.contradictionHold);

  return (
    <section className="kairos-card p-4 flex flex-col relative">
      <header className="flex items-center justify-between mb-2">
        <span className="kairos-kicker kairos-kicker-strong text-amber/80">MYCHART MESSAGE</span>
        <span className="text-[11px] text-bone-muted">
          {editing ? "Editing — content locks on Done editing" : null}
        </span>
      </header>

      <dl className="text-[12px] text-bone-muted grid grid-cols-[88px_1fr] gap-x-3 gap-y-1 mb-3">
        <dt>Recipient</dt>
        <dd className="text-bone">{p.displayName || p.name || "—"}</dd>
        {p.proxyName ? (
          <>
            <dt>Proxy</dt>
            <dd className="text-bone">{p.proxyName}</dd>
          </>
        ) : null}
        <dt>Notify by</dt>
        <dd className="text-bone">2 business days</dd>
      </dl>

      {showContradictionWarning ? (
        <div className="mb-3 px-3 py-2 rounded-sm border text-[12px] font-medium bg-amber/10 border-amber/60 text-amber">
          ⚠ Contradiction detected — patient statement conflicts with chart. Verify before sending.
        </div>
      ) : null}

      {editing ? (
        <div
          ref={editRef}
          contentEditable
          suppressContentEditableWarning
          spellCheck
          className="border-t border-mist/40 pt-3 min-h-[1.5rem] text-[13px] text-bone leading-relaxed whitespace-pre-wrap focus:outline-none kairos-editable"
        />
      ) : (
        <div className="border-t border-mist/40 pt-3 text-[13px] text-bone leading-relaxed whitespace-pre-wrap">
          {display ? (
            <>
              <span>{display}</span>
              {isTyping && (
                <span className="inline-block w-[1ch] -mb-[2px] kairos-typing-cursor">▍</span>
              )}
            </>
          ) : isTyping ? (
            <span className="inline-block w-[1ch] -mb-[2px] kairos-typing-cursor">▍</span>
          ) : (
            <span className="text-bone-muted/60 italic">— empty —</span>
          )}
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-mist/40 flex items-center gap-2 flex-wrap relative">
        <button
          type="button"
          onClick={handleReply}
          data-tour-button="myChart.reply"
          className="text-[12px] font-semibold px-3 py-1.5 rounded-sm bg-amber text-graphite hover:bg-amber/90 transition-colors"
        >
          Reply
        </button>
        <button
          type="button"
          onClick={handleReplyCcClick}
          data-tour-button="myChart.replyCc"
          className="text-[12px] font-medium px-3 py-1.5 rounded-sm bg-platinum/60 text-bone border border-mist/60 hover:bg-platinum hover:border-amber/60 transition-colors"
        >
          Reply + CC
        </button>
        <button
          type="button"
          onClick={handleForwardClick}
          data-tour-button="myChart.forward"
          className="text-[12px] font-medium px-3 py-1.5 rounded-sm bg-platinum/60 text-bone border border-mist/60 hover:bg-platinum hover:border-amber/60 transition-colors"
        >
          Forward
        </button>
        <button
          type="button"
          onClick={handleEditToggle}
          className="text-[12px] font-medium px-3 py-1.5 rounded-sm text-bone-muted hover:text-bone transition-colors"
        >
          {editing ? "Done editing" : "Edit"}
        </button>
        <RecipientPicker
          open={picker === "cc"}
          multi
          onConfirm={handlePickerConfirm}
          onCancel={() => setPicker(null)}
          title="CC clinicians"
        />
        <RecipientPicker
          open={picker === "forward"}
          onConfirm={handlePickerConfirm}
          onCancel={() => setPicker(null)}
          title="Forward to clinician"
        />
      </div>
    </section>
  );
}
