// Phase 3.3 — Action bar. Pattern-specific action buttons trigger
// dataSource.runAction (simulation in 3.3). Authorize / Edit / Defer /
// Reject log intent in 3.3 stubs; Authorize fires the fly-off animation
// + sessionStorage write that the dashboard reads back.

"use client";

import { useRouter } from "next/navigation";

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

  function handleDefer() {
    // eslint-disable-next-line no-console
    console.log("defer-clicked", cardId);
    backToDashboard();
  }
  function handleReject() {
    // eslint-disable-next-line no-console
    console.log("reject-clicked", cardId);
    backToDashboard();
  }
  function backToDashboard() {
    const q = fromTab ? `?tab=${encodeURIComponent(fromTab)}` : "";
    router.push(`/rn${q}`);
  }

  return (
    <div className="mt-4 space-y-3">
      {/* Pattern-specific action buttons */}
      {buttons.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="kairos-kicker text-bone-muted mr-1">ACTIONS</span>
          {buttons.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => onRunAction && onRunAction(b.id)}
              disabled={isPlaying}
              className={
                "text-[12px] font-medium px-3 py-1.5 rounded-sm transition-colors " +
                (isPlaying
                  ? "bg-platinum/40 text-bone-muted cursor-wait"
                  : "bg-platinum/60 text-bone border border-mist/60 hover:bg-platinum hover:border-amber/60")
              }
            >
              {b.label}
            </button>
          ))}
        </div>
      )}

      {/* Verb bar */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onAuthorize}
          disabled={isPlaying || blockAuthorize}
          title={blockAuthorize ? "Order requires verification before Authorize" : ""}
          className={
            "text-[13px] font-semibold px-4 py-2 rounded-sm transition-colors " +
            (isPlaying || blockAuthorize
              ? "bg-amber/30 text-graphite/60 cursor-not-allowed"
              : "bg-amber text-graphite hover:bg-amber/90")
          }
        >
          Authorize
        </button>
        <button
          type="button"
          onClick={onEdit}
          disabled={isPlaying}
          className="text-[13px] font-medium px-4 py-2 rounded-sm bg-platinum/60 text-bone border border-mist/60 hover:bg-platinum hover:border-amber/60 transition-colors disabled:opacity-50"
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
  );
}
