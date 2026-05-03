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

// Pass E §4 — normalize the fixture's authorizeActions field. Two
// supported shapes:
//   ["A", "B"]              → single Authorize button labeled "A · B"
//   [["A","B"], ["C","D"]]  → two Authorize buttons; rendered side by
//                             side. Used by Card 8 (Jackson) which has
//                             two disposition paths.
// Default fallback when a fixture hasn't defined authorizeActions yet:
// a single button reading "Authorize" so the UI never crashes.
function normalizeAuthorizeActions(actions) {
  if (!Array.isArray(actions) || actions.length === 0) {
    return [["Authorize"]];
  }
  if (Array.isArray(actions[0])) return actions;
  return [actions];
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
  authorizeActions,
}) {
  const router = useRouter();
  const buttons = (pattern && pattern.actionButtons) || [];

  const [pulseTarget, setPulseTarget] = useState(null);
  const [clickedTarget, setClickedTarget] = useState(null);
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
      setClickedTarget(null);
    }
    // Click-animation triggers — fire the one-shot scale+glow on whichever
    // button the auto-action / auto-authorize event names. The animation
    // is 600ms; we clear the target after 650ms so the class can re-apply
    // if a subsequent action rapidly fires on the same button.
    let clickTimer = null;
    function flashClick(buttonId) {
      if (!buttonId) return;
      setClickedTarget(buttonId);
      if (clickTimer) clearTimeout(clickTimer);
      clickTimer = setTimeout(() => setClickedTarget(null), 650);
    }
    function onAutoAction(e) {
      const fixtureId = e && e.detail && e.detail.fixtureId;
      if (fixtureId && cardId && fixtureId !== cardId) return;
      flashClick(e && e.detail && e.detail.actionId);
    }
    function onAutoAuthorize() {
      flashClick("authorize");
    }
    window.addEventListener("kairos-tour:beat-start", onBeatStart);
    window.addEventListener("kairos-tour:beat-end", onBeatEnd);
    window.addEventListener("kairos-tour:end", onTourEnd);
    window.addEventListener("kairos-encounter:auto-action", onAutoAction);
    window.addEventListener("kairos-encounter:auto-authorize", onAutoAuthorize);
    return () => {
      window.removeEventListener("kairos-tour:beat-start", onBeatStart);
      window.removeEventListener("kairos-tour:beat-end", onBeatEnd);
      window.removeEventListener("kairos-tour:end", onTourEnd);
      window.removeEventListener("kairos-encounter:auto-action", onAutoAction);
      window.removeEventListener("kairos-encounter:auto-authorize", onAutoAuthorize);
      if (clickTimer) clearTimeout(clickTimer);
    };
  }, [cardId]);

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
              const clicking = clickedTarget && clickedTarget === b.id;
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
                    (pulsing ? " kairos-action-pulse" : "") +
                    (clicking ? " kairos-action-click" : "")
                  }
                >
                  {b.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Verb bar */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Pass E §4 — Authorize button label(s) from fixture's
              authorizeActions array, joined with " · ". Fixtures with
              two disposition paths (Card 8 Jackson) render two buttons;
              everything else renders one. The first button keeps the
              canonical id `kairos-action-authorize` so the tour cursor
              + auto-authorize event paths don't change. Subsequent
              buttons get suffixed ids for future per-path targeting. */}
          {normalizeAuthorizeActions(authorizeActions).map((labelArr, idx) => {
            const label = labelArr.join(" · ");
            const id = idx === 0 ? "kairos-action-authorize" : `kairos-action-authorize-${idx}`;
            return (
              <button
                key={id}
                id={id}
                type="button"
                onClick={handleAuthorize}
                disabled={isPlaying || blockAuthorize}
                title={blockAuthorize ? "Order requires verification before Authorize" : ""}
                className={
                  "text-[13px] font-semibold px-4 py-2 rounded-sm transition-colors " +
                  (isPlaying || blockAuthorize
                    ? "bg-amber/30 text-graphite/60 cursor-not-allowed"
                    : "bg-amber text-graphite hover:bg-amber/90") +
                  (pulseTarget === "authorize" && idx === 0 ? " kairos-action-pulse" : "") +
                  (clickedTarget === "authorize" && idx === 0 ? " kairos-action-click" : "")
                }
              >
                {label}
              </button>
            );
          })}
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
