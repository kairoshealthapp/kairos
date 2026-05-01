// Phase 3.3 — Action bar. Pattern-specific action buttons trigger
// dataSource.runAction (simulation in 3.3). Authorize / Edit / Defer /
// Reject log intent in 3.3 stubs; Authorize fires the fly-off animation
// + sessionStorage write that the dashboard reads back.
//
// Phase-3.4 additions:
//   • Listens for kairos-tour:beat-start / :beat-end events. When the
//     active tour beat carries a `targetButton` matching either an action
//     id or "authorize", that button pulses with an amber border + glow
//     until the beat ends.
//   • Outside of tour playback (sessionStorage 'kairos-tour-active' !== "1")
//     clicking any verb button surfaces a small bottom-center toast
//     reminding the viewer that this is a demo build and that the tour is
//     where the workflow actually plays out. Toast is suppressed during
//     active tour playback so the tour engine drives the buttons cleanly.

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const TOAST_MS = 4000;

function tourActive() {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem("kairos-tour-active") === "1";
  } catch {
    return false;
  }
}

export default function ActionBar({
  cardId,
  pattern,
  isPlaying,
  blockAuthorize,
  onRunAction,
  onAuthorize,
  onEdit,
  fromTab,
}) {
  const router = useRouter();
  const buttons = (pattern && pattern.actionButtons) || [];

  const [pulseTarget, setPulseTarget] = useState(null);
  const [toast, setToast] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    function onBeatStart(e) {
      const t = e && e.detail && e.detail.targetButton;
      setPulseTarget(t || null);
    }
    function onBeatEnd() {
      setPulseTarget(null);
    }
    function onTourEnd() {
      setPulseTarget(null);
    }
    window.addEventListener("kairos-tour:beat-start", onBeatStart);
    window.addEventListener("kairos-tour:beat-end", onBeatEnd);
    window.addEventListener("kairos-tour:end", onTourEnd);
    return () => {
      window.removeEventListener("kairos-tour:beat-start", onBeatStart);
      window.removeEventListener("kairos-tour:beat-end", onBeatEnd);
      window.removeEventListener("kairos-tour:end", onTourEnd);
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(false), TOAST_MS);
    return () => clearTimeout(t);
  }, [toast]);

  function maybeToast() {
    if (!tourActive()) setToast(true);
  }

  function handleAction(actionId) {
    maybeToast();
    if (onRunAction) onRunAction(actionId);
  }
  function handleAuthorize() {
    maybeToast();
    if (onAuthorize) onAuthorize();
  }
  function handleEdit() {
    maybeToast();
    if (onEdit) onEdit();
  }
  function handleDefer() {
    // eslint-disable-next-line no-console
    console.log("defer-clicked", cardId);
    maybeToast();
    backToDashboard();
  }
  function handleReject() {
    // eslint-disable-next-line no-console
    console.log("reject-clicked", cardId);
    maybeToast();
    backToDashboard();
  }
  function backToDashboard() {
    const q = fromTab ? `?tab=${encodeURIComponent(fromTab)}` : "";
    router.push(`/rn${q}`);
  }

  return (
    <>
      <div className="mt-4 space-y-3">
        {/* Pattern-specific action buttons */}
        {buttons.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="kairos-kicker text-bone-muted mr-1">ACTIONS</span>
            {buttons.map((b) => {
              const pulsing = pulseTarget && pulseTarget === b.id;
              return (
                <button
                  key={b.id}
                  id={"kairos-action-" + b.id}
                  type="button"
                  onClick={() => handleAction(b.id)}
                  disabled={isPlaying}
                  className={
                    "text-[12px] font-medium px-3 py-1.5 rounded-sm transition-colors " +
                    (isPlaying
                      ? "bg-platinum/40 text-bone-muted cursor-wait"
                      : "bg-platinum/60 text-bone border border-mist/60 hover:bg-platinum hover:border-amber/60") +
                    (pulsing ? " kairos-action-pulse" : "")
                  }
                >
                  {b.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Verb bar */}
        <div className="flex items-center gap-2">
          <button
            id="kairos-action-authorize"
            type="button"
            onClick={handleAuthorize}
            disabled={isPlaying || blockAuthorize}
            title={blockAuthorize ? "Order requires verification before Authorize" : ""}
            className={
              "text-[13px] font-semibold px-4 py-2 rounded-sm transition-colors " +
              (isPlaying || blockAuthorize
                ? "bg-amber/30 text-graphite/60 cursor-not-allowed"
                : "bg-amber text-graphite hover:bg-amber/90") +
              (pulseTarget === "authorize" ? " kairos-action-pulse" : "")
            }
          >
            Authorize
          </button>
          <button
            type="button"
            onClick={handleEdit}
            disabled={isPlaying}
            className={
              "text-[13px] font-medium px-4 py-2 rounded-sm bg-platinum/60 text-bone border border-mist/60 hover:bg-platinum hover:border-amber/60 transition-colors disabled:opacity-50" +
              (pulseTarget === "edit" ? " kairos-action-pulse" : "")
            }
          >
            Edit
          </button>
          <button
            type="button"
            onClick={handleDefer}
            disabled={isPlaying}
            className="text-[13px] font-medium px-4 py-2 rounded-sm text-bone-muted hover:text-bone transition-colors disabled:opacity-50"
          >
            Defer
          </button>
          <button
            type="button"
            onClick={handleReject}
            disabled={isPlaying}
            className="text-[13px] font-medium px-4 py-2 rounded-sm text-bone-muted hover:text-bone transition-colors disabled:opacity-50"
          >
            Reject
          </button>
        </div>
      </div>

      {toast ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed left-1/2 -translate-x-1/2 bottom-6 z-[80] kairos-card px-4 py-3 shadow-2xl text-[12px] text-bone leading-snug max-w-[420px] text-center"
          style={{
            background: "var(--color-platinum)",
            borderColor: "var(--color-amber)",
            borderWidth: 1,
          }}
        >
          Demo build — actions are pre-rendered in the tour. Click <span className="text-amber font-semibold">▶ Quick Tour</span> or <span className="text-amber font-semibold">▶ Deep Tour</span> to see this in motion.
        </div>
      ) : null}
    </>
  );
}
