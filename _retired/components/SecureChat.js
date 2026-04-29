"use client";

import { useState } from "react";
import { Send } from "lucide-react";

const ROLE_META = {
  nurse: {
    label: "Nurse",
    bg: "bg-[color:var(--color-accent-soft)]",
    fg: "text-[color:var(--color-accent)]",
  },
  outside_clinician: {
    label: "Outside",
    bg: "bg-[color:var(--color-source-clinician-soft)]",
    fg: "text-[color:var(--color-source-clinician)]",
  },
  provider: {
    label: "Provider",
    bg: "bg-muted",
    fg: "text-fg-muted",
  },
};

function formatStamp(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

function ParticipantPill({ participant }) {
  const meta = ROLE_META[participant.role] || ROLE_META.provider;
  return (
    <span
      className={`inline-flex items-center rounded-pill px-2 py-0.5 text-[11px] font-medium ${meta.bg} ${meta.fg}`}
    >
      {participant.name}
      {participant.org && (
        <span className="ml-1 opacity-70">· {participant.org}</span>
      )}
    </span>
  );
}

function MessageBubble({ message, isOutbound }) {
  return (
    <div
      className={`flex flex-col ${isOutbound ? "items-end" : "items-start"}`}
    >
      {!isOutbound && (
        <div className="mb-1 text-[11px] font-medium text-fg-muted">
          {message.senderName}
          {message.senderOrg && (
            <span className="ml-1 text-fg-faint">· {message.senderOrg}</span>
          )}
        </div>
      )}
      <div
        className={`max-w-[85%] rounded-card px-3.5 py-2.5 text-[13px] leading-relaxed ${
          isOutbound
            ? "bg-[color:var(--color-accent)] text-white"
            : "border border-line-faint bg-muted text-fg"
        }`}
      >
        {message.body}
      </div>
      <div className="mt-1 text-[11px] text-fg-faint">
        {formatStamp(message.sentAt)}
      </div>
    </div>
  );
}

export default function SecureChat({ thread, onSendMessage }) {
  const [draft, setDraft] = useState("");

  if (!thread) return null;

  const { participants = [], messages = [], title } = thread;

  function handleSend() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    if (onSendMessage) onSendMessage(trimmed);
    setDraft("");
  }

  return (
    <article className="rounded-card border border-line-faint bg-surface">
      <header className="space-y-2 border-b border-line-faint p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-[15px] font-medium text-fg">Secure Chat</h2>
          {title && (
            <span className="text-[13px] text-fg-faint">{title}</span>
          )}
        </div>
        {participants.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {participants.map((p, i) => (
              <ParticipantPill key={`${p.name}-${i}`} participant={p} />
            ))}
          </div>
        )}
      </header>

      <div className="space-y-4 p-5">
        {messages.length === 0 ? (
          <p className="text-[13px] text-fg-muted">No messages yet</p>
        ) : (
          messages.map((m) => (
            <MessageBubble
              key={m.id}
              message={m}
              isOutbound={m.direction === "outbound"}
            />
          ))
        )}
      </div>

      {onSendMessage && (
        <div className="space-y-2 border-t border-line-faint p-5">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Reply…"
            rows={3}
            className="w-full resize-y rounded-button border border-line-faint bg-surface px-3 py-2 text-[13px] text-fg placeholder:text-fg-faint"
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSend}
              disabled={!draft.trim()}
              className="inline-flex items-center gap-1.5 rounded-button bg-[color:var(--color-accent)] px-3 py-1.5 text-[13px] font-medium text-white transition-colors duration-100 hover:bg-[color:var(--color-accent-hover)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send size={14} strokeWidth={1.75} />
              Send
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
