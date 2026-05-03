// v3.0 RN Note Panel — AI-drafted nurse note with Edit / Done / Forward.
// Edit mode is in-place via contentEditable: the same display surface
// becomes editable (no shrunken textarea) so the layout stays identical.
// Done + Forward terminate the card; their toast + 1.5s nav back to
// /rn is wired in EncounterDetail's onTerminate handler.

"use client";

import { useEffect, useRef, useState } from "react";
import RecipientPicker from "./RecipientPicker";

export default function RNNotePanel({
  content,
  isTyping,
  tourMode,
  onTerminate,
}) {
  const [editing, setEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(null); // null = use streamed `content`
  const [showPicker, setShowPicker] = useState(false);
  const editRef = useRef(null);

  // Re-seed contentEditable text when entering edit mode so the user
  // starts from the latest streamed content and never loses prior input
  // on remount.
  useEffect(() => {
    if (editing && editRef.current) {
      editRef.current.innerText = editedContent != null ? editedContent : content || "";
      editRef.current.focus();
      // Move caret to end.
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
      // Lock: capture current contentEditable text as the new content.
      const next = editRef.current ? editRef.current.innerText : "";
      setEditedContent(next);
    }
    setEditing((v) => !v);
  }
  function handleDone() {
    onTerminate && onTerminate({ kind: "rnNote.done" });
  }
  function handleForwardClick() {
    setShowPicker(true);
  }
  function handleForwardConfirm(recipient) {
    setShowPicker(false);
    onTerminate && onTerminate({ kind: "rnNote.forward", recipient });
  }

  const display = editedContent != null ? editedContent : content || "";

  return (
    <section className="kairos-card p-4 flex flex-col relative">
      <header className="flex items-center justify-between mb-2">
        <span className="kairos-kicker kairos-kicker-strong text-amber/80">RN NOTE</span>
        <span className="text-[11px] text-bone-muted">
          {editing ? "Editing — content locks on Done editing" : null}
        </span>
      </header>

      {editing ? (
        <div
          ref={editRef}
          contentEditable
          suppressContentEditableWarning
          spellCheck
          className="min-h-[1.5rem] text-[13px] text-bone leading-relaxed whitespace-pre-wrap focus:outline-none kairos-editable"
        />
      ) : (
        <div className="text-[13px] text-bone leading-relaxed whitespace-pre-wrap">
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

      <div className="mt-3 pt-3 border-t border-mist/40 flex items-center gap-2 relative">
        <button
          type="button"
          onClick={handleDone}
          data-tour-button="rnNote.done"
          className="text-[12px] font-semibold px-3 py-1.5 rounded-sm bg-amber text-graphite hover:bg-amber/90 transition-colors"
        >
          Done
        </button>
        <button
          type="button"
          onClick={handleForwardClick}
          data-tour-button="rnNote.forward"
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
          open={showPicker}
          onConfirm={handleForwardConfirm}
          onCancel={() => setShowPicker(false)}
          title="Forward note to"
        />
      </div>
    </section>
  );
}
