"use client";

import { Mail } from "lucide-react";

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

function MessageCard({ message }) {
  const isOutbound = message.direction === "outbound";
  const fromLabel = isOutbound
    ? message.from || "Riverbend Cardiology"
    : message.from || "Patient";

  return (
    <article className="space-y-2 rounded-card border border-line-faint bg-canvas/60 p-5">
      <header className="flex items-baseline justify-between gap-3 border-b border-line-faint/60 pb-2">
        <div className="text-[12px] text-fg-muted">
          <span className="font-medium text-fg">From:</span>{" "}
          <span>{fromLabel}</span>
        </div>
        <div className="text-[11px] text-fg-faint">{formatStamp(message.sentAt)}</div>
      </header>

      {message.subject && (
        <div className="text-[14px] font-medium text-fg">{message.subject}</div>
      )}

      <div className="whitespace-pre-wrap text-[15px] leading-[1.6] text-fg">
        {message.body}
      </div>

      {(message.readAt || message.repliedAt) && (
        <div className="flex flex-wrap gap-3 pt-1 text-[11px] text-fg-faint">
          {message.readAt && <span>Read {formatStamp(message.readAt)}</span>}
          {message.repliedAt && <span>Replied {formatStamp(message.repliedAt)}</span>}
        </div>
      )}
    </article>
  );
}

export default function MyChartThread({ messages }) {
  const list = messages || [];
  return (
    <article className="rounded-card border border-line-faint bg-surface">
      <header className="flex items-baseline justify-between gap-4 border-b border-line-faint p-5">
        <div className="flex items-center gap-1.5">
          <Mail size={14} strokeWidth={1.75} className="text-fg-muted" />
          <h2 className="text-[15px] font-medium text-fg">MyChart Conversation</h2>
        </div>
        <span className="text-[13px] text-fg-faint">
          {list.length} message{list.length === 1 ? "" : "s"}
        </span>
      </header>

      <div className="space-y-4 p-5">
        {list.length === 0 ? (
          <p className="text-[13px] text-fg-muted">No MyChart messages yet</p>
        ) : (
          list.map((m) => <MessageCard key={m.id} message={m} />)
        )}
      </div>
    </article>
  );
}
