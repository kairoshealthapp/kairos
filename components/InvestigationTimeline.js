"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FlaskConical,
  Phone,
  User,
  MessageCircle,
  ClipboardCheck,
  FileText,
  Send,
  Inbox,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

const KIND_META = {
  lab_result: { Icon: FlaskConical, label: "Lab result" },
  encounter: { Icon: Phone, label: "Encounter" },
  secure_chat: { Icon: MessageCircle, label: "Secure Chat" },
  evidence: { Icon: ClipboardCheck, label: "Evidence" },
  sbar: { Icon: FileText, label: "SBAR" },
  mychart_outbound: { Icon: Send, label: "MyChart out" },
  mychart_inbound: { Icon: Inbox, label: "MyChart in" },
  result_note: { Icon: FileText, label: "Result Note" },
};

const SOURCE_META = {
  nurse: {
    label: "Nurse",
    bg: "bg-[color:var(--color-accent-soft)]",
    fg: "text-[color:var(--color-accent)]",
  },
  patient: {
    label: "Patient",
    bg: "bg-[color:var(--color-accent-soft)]",
    fg: "text-[color:var(--color-accent)]",
  },
  provider: {
    label: "Provider",
    bg: "bg-muted",
    fg: "text-fg-muted",
  },
  outside_clinician: {
    label: "Outside",
    bg: "bg-[color:var(--color-source-clinician-soft)]",
    fg: "text-[color:var(--color-source-clinician)]",
  },
  system: {
    label: "System",
    bg: "bg-[color:var(--color-flag-low-soft)]",
    fg: "text-[color:var(--color-flag-low)]",
  },
};

const BUCKET_META = {
  results_followup: "Results Follow-Up",
  patient_call: "Patient Call",
  pt_advice_request: "Pt Advice Request",
  secure_chat: "Secure Chat",
  coumadin: "Coumadin",
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

function relativeTime(iso) {
  if (!iso) return "";
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 0) return "now";
  const min = Math.round(ms / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} hr ago`;
  const days = Math.round(hr / 24);
  return `${days} d ago`;
}

function TouchpointDetail({ touchpoint }) {
  const { kind, data } = touchpoint;

  if (kind === "lab_result") {
    return (
      <div className="space-y-1 text-[13px] text-fg-muted">
        <div>
          <span className="font-medium text-fg">{data.test}</span>: {data.value}
          {data.unit && <span> {data.unit}</span>}
          {data.flag && (
            <span
              className={`ml-2 rounded-pill px-1.5 py-0.5 text-[11px] font-medium ${
                data.flag === "low"
                  ? "bg-[color:var(--color-flag-high-soft)] text-[color:var(--color-flag-high)]"
                  : "bg-[color:var(--color-flag-low-soft)] text-[color:var(--color-flag-low)]"
              }`}
            >
              {data.flag.toUpperCase()}
            </span>
          )}
        </div>
        {data.refRange && <div>Reference: {data.refRange}</div>}
        {data.priorValue !== undefined && (
          <div className="text-fg-faint">
            Prior: {data.priorValue} ({formatStamp(data.priorDate)})
          </div>
        )}
      </div>
    );
  }

  if (kind === "secure_chat") {
    return (
      <div className="rounded-button border border-line-faint bg-muted/40 p-3 text-[13px] leading-relaxed text-fg">
        {data.message}
      </div>
    );
  }

  if (kind === "encounter") {
    return (
      <div className="space-y-2 text-[13px] text-fg-muted">
        {data.notes && <div>{data.notes}</div>}
        {data.encounterId && (
          <Link
            href={`/triage/${data.encounterId}`}
            className="inline-flex items-center gap-1 rounded-button px-2 py-1 text-[12px] font-medium text-[color:var(--color-accent)] transition-colors duration-100 hover:bg-[color:var(--color-accent-soft)]"
          >
            Open encounter →
          </Link>
        )}
      </div>
    );
  }

  if (kind === "result_note") {
    return (
      <div className="whitespace-pre-wrap rounded-button border border-line-faint bg-muted/40 p-3 text-[13px] leading-relaxed text-fg">
        {data.body}
      </div>
    );
  }

  if (kind === "mychart_outbound" || kind === "mychart_inbound") {
    return (
      <div className="space-y-2">
        {data.subject && (
          <div className="text-[13px] font-medium text-fg">{data.subject}</div>
        )}
        {data.body && (
          <div className="whitespace-pre-wrap rounded-button border border-line-faint bg-muted/40 p-3 text-[13px] leading-relaxed text-fg">
            {data.body}
          </div>
        )}
      </div>
    );
  }

  return null;
}

function TimelineNode({ touchpoint, isLast }) {
  const [expanded, setExpanded] = useState(true);
  const meta = KIND_META[touchpoint.kind] || { Icon: FileText, label: touchpoint.kind };
  const sourceMeta = SOURCE_META[touchpoint.sourceActor] || SOURCE_META.system;
  const Icon = meta.Icon;

  return (
    <li className="relative pl-10">
      {!isLast && (
        <span
          aria-hidden
          className="absolute left-3.5 top-7 h-[calc(100%+12px)] w-px bg-line-faint"
        />
      )}
      <span className="absolute left-0 top-0 flex h-7 w-7 items-center justify-center rounded-full border border-line-faint bg-surface text-fg-muted">
        <Icon size={13} strokeWidth={1.75} />
      </span>

      <div className="space-y-2 pb-4">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="inline-flex items-center gap-1 rounded-button text-[14px] font-medium text-fg transition-colors duration-100 hover:text-[color:var(--color-accent)]"
          >
            {expanded ? (
              <ChevronDown size={14} strokeWidth={1.75} />
            ) : (
              <ChevronRight size={14} strokeWidth={1.75} />
            )}
            {touchpoint.summary}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
          {touchpoint.bucket && (
            <span className="inline-flex items-center rounded-pill bg-muted px-2 py-0.5 font-medium text-fg-muted">
              {BUCKET_META[touchpoint.bucket] || touchpoint.bucket}
            </span>
          )}
          <span
            className={`inline-flex items-center rounded-pill px-2 py-0.5 font-medium ${sourceMeta.bg} ${sourceMeta.fg}`}
          >
            {sourceMeta.label}
            {touchpoint.sourceDetail && (
              <span className="ml-1 opacity-80">· {touchpoint.sourceDetail}</span>
            )}
          </span>
          <span className="text-fg-faint">
            {formatStamp(touchpoint.occurredAt)}
            <span className="mx-1.5 text-fg-faint/60">·</span>
            {relativeTime(touchpoint.occurredAt)}
          </span>
        </div>

        {expanded && (
          <div className="pt-1">
            <TouchpointDetail touchpoint={touchpoint} />
          </div>
        )}
      </div>
    </li>
  );
}

export default function InvestigationTimeline({ touchpoints }) {
  const sorted = [...(touchpoints || [])].sort((a, b) =>
    String(a.occurredAt).localeCompare(String(b.occurredAt))
  );
  if (sorted.length === 0) {
    return <p className="text-[13px] text-fg-muted">No touchpoints yet.</p>;
  }
  return (
    <ol className="relative">
      {sorted.map((tp, i) => (
        <TimelineNode key={tp.id} touchpoint={tp} isLast={i === sorted.length - 1} />
      ))}
    </ol>
  );
}
