"use client";

import { useMemo, useState } from "react";
import { ChevronRight, MailCheck, RefreshCw, Sparkles, X } from "lucide-react";
import {
  ACTIONABLE_CATEGORIES,
  INFORMATIONAL_CATEGORIES,
  REFERRAL_CATEGORIES,
  categoryLabel,
  confidenceTone,
  isActionable,
  routeLabel,
} from "@/lib/types/referralMessage";

const FILTER_LABELS = {
  actionable_all: "Actionable (all)",
  informational_all: "Informational (all)",
};

const TONE_DOT = {
  success: "bg-[color:var(--color-flag-success)]",
  low: "bg-[color:var(--color-flag-low)]",
  high: "bg-[color:var(--color-flag-high)]",
  neutral: "bg-fg-faint",
};

function relativeTime(iso) {
  if (!iso) return "";
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 0) return "now";
  const min = Math.round(ms / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h`;
  const days = Math.round(hr / 24);
  return `${days}d`;
}

function categoryCounts(messages) {
  const counts = {};
  for (const c of REFERRAL_CATEGORIES) counts[c] = 0;
  for (const m of messages) {
    if (m.classification) counts[m.classification.category] += 1;
  }
  return counts;
}

export default function ReferralInboxBoard({ initialMessages }) {
  const [messages, setMessages] = useState(initialMessages);
  const [filter, setFilter] = useState("actionable_all");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [expandedId, setExpandedId] = useState(null);
  const [overrideId, setOverrideId] = useState(null);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);

  const counts = useMemo(() => categoryCounts(messages), [messages]);
  const totalActionable = ACTIONABLE_CATEGORIES.reduce(
    (acc, c) => acc + (counts[c] || 0),
    0
  );
  const totalInformational = INFORMATIONAL_CATEGORIES.reduce(
    (acc, c) => acc + (counts[c] || 0),
    0
  );

  const filtered = useMemo(() => {
    let arr;
    if (filter === "actionable_all") {
      arr = messages.filter(
        (m) =>
          m.classification &&
          ACTIONABLE_CATEGORIES.includes(m.classification.category) &&
          m.status !== "actioned" &&
          m.status !== "dismissed"
      );
    } else if (filter === "informational_all") {
      arr = messages.filter(
        (m) =>
          m.classification &&
          INFORMATIONAL_CATEGORIES.includes(m.classification.category)
      );
    } else if (filter === "all") {
      arr = messages.slice();
    } else {
      arr = messages.filter((m) => m.classification?.category === filter);
    }
    return arr.sort(
      (a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
    );
  }, [messages, filter]);

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((m) => selectedIds.has(m.id));

  function toggleSelect(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (allFilteredSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((m) => m.id)));
    }
  }

  function applyMessageUpdate(updated) {
    setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
  }

  function applyManyStatus(ids, status) {
    setMessages((prev) =>
      prev.map((m) => (ids.includes(m.id) ? { ...m, status } : m))
    );
    setSelectedIds(new Set());
  }

  async function handleReclassifyAll() {
    setBusy("reclassify_all");
    setError(null);
    try {
      const resp = await fetch("/api/classify-referral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.message || `Reclassify failed (${resp.status})`);
      }
      const { classifications } = await resp.json();
      setMessages((prev) =>
        prev.map((m, i) => {
          const c = classifications[i];
          if (!c || c.error) return m;
          return { ...m, classification: c, status: "classified" };
        })
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  }

  async function handleReclassifyOne(messageId) {
    setBusy(`one_${messageId}`);
    setError(null);
    try {
      const resp = await fetch("/api/classify-referral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.message || `Reclassify failed (${resp.status})`);
      }
      const { message: updated } = await resp.json();
      applyMessageUpdate(updated);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  }

  function handleMarkAllInformationalRead() {
    const informationalIds = messages
      .filter(
        (m) =>
          m.classification &&
          INFORMATIONAL_CATEGORIES.includes(m.classification.category) &&
          m.status !== "actioned"
      )
      .map((m) => m.id);
    if (informationalIds.length === 0) return;
    applyManyStatus(informationalIds, "actioned");
  }

  function handleBulkMarkRead() {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    applyManyStatus(ids, "actioned");
  }

  function handleBulkSendToReview() {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setMessages((prev) =>
      prev.map((m) => {
        if (!ids.includes(m.id)) return m;
        if (!m.classification) return m;
        return {
          ...m,
          classification: {
            ...m.classification,
            routeTo: "provider_review",
          },
        };
      })
    );
    setSelectedIds(new Set());
  }

  async function handleBulkReclassify() {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    const subset = messages.filter((m) => ids.includes(m.id));
    setBusy("bulk_reclassify");
    setError(null);
    try {
      const resp = await fetch("/api/classify-referral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: subset }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.message || `Reclassify failed (${resp.status})`);
      }
      const { classifications } = await resp.json();
      setMessages((prev) => {
        const next = prev.slice();
        subset.forEach((m, i) => {
          const c = classifications[i];
          if (!c || c.error) return;
          const idx = next.findIndex((x) => x.id === m.id);
          if (idx >= 0) {
            next[idx] = { ...next[idx], classification: c, status: "classified" };
          }
        });
        return next;
      });
      setSelectedIds(new Set());
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={handleReclassifyAll}
          disabled={busy === "reclassify_all"}
          className="inline-flex items-center gap-1.5 rounded-button border border-line px-3 py-1.5 text-[13px] text-fg-muted transition-colors hover:bg-muted hover:text-fg disabled:opacity-50"
        >
          <RefreshCw
            size={13}
            strokeWidth={1.75}
            className={busy === "reclassify_all" ? "animate-spin" : ""}
          />
          {busy === "reclassify_all" ? "Reclassifying…" : "Reclassify all"}
        </button>
        <button
          type="button"
          onClick={handleMarkAllInformationalRead}
          className="inline-flex items-center gap-1.5 rounded-button bg-[color:var(--color-accent)] px-3 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-[color:var(--color-accent-hover)]"
        >
          <MailCheck size={13} strokeWidth={1.75} />
          Mark all informational as read
        </button>
      </div>

      {error && (
        <div className="rounded-card border border-line bg-[color:var(--color-flag-high-soft)] px-4 py-2 text-[13px] text-[color:var(--color-flag-high)]">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[200px_1fr]">
        <aside className="space-y-1">
          <SidebarRow
            label={FILTER_LABELS.actionable_all}
            count={totalActionable}
            active={filter === "actionable_all"}
            onClick={() => setFilter("actionable_all")}
            tone="accent"
          />
          <SidebarRow
            label={FILTER_LABELS.informational_all}
            count={totalInformational}
            active={filter === "informational_all"}
            onClick={() => setFilter("informational_all")}
          />
          <div className="my-2 border-t border-line-faint" />
          {REFERRAL_CATEGORIES.map((c) => (
            <SidebarRow
              key={c}
              label={categoryLabel(c)}
              count={counts[c] || 0}
              active={filter === c}
              onClick={() => setFilter(c)}
              actionable={isActionable(c)}
              ambiguous={c === "unable_to_classify"}
              indent
            />
          ))}
        </aside>

        <section className="min-w-0 space-y-2">
          <div className="flex items-center gap-3 px-2 text-[12px] text-fg-faint">
            <input
              type="checkbox"
              checked={allFilteredSelected}
              onChange={toggleSelectAll}
              aria-label="Select all"
              className="h-3.5 w-3.5"
            />
            <span>
              {filtered.length} message{filtered.length === 1 ? "" : "s"}
              {selectedIds.size > 0 && (
                <> · {selectedIds.size} selected</>
              )}
            </span>
          </div>

          {selectedIds.size > 0 && (
            <div className="flex flex-wrap items-center gap-2 rounded-card border border-line bg-muted px-3 py-2">
              <span className="text-[12px] text-fg-muted">
                {selectedIds.size} selected
              </span>
              <button
                type="button"
                onClick={handleBulkMarkRead}
                className="rounded-button px-2 py-1 text-[12px] text-fg-muted transition-colors hover:bg-surface hover:text-fg"
              >
                Mark as read
              </button>
              <button
                type="button"
                onClick={handleBulkSendToReview}
                className="rounded-button px-2 py-1 text-[12px] text-fg-muted transition-colors hover:bg-surface hover:text-fg"
              >
                Send to nurse review
              </button>
              <button
                type="button"
                onClick={handleBulkReclassify}
                disabled={busy === "bulk_reclassify"}
                className="rounded-button px-2 py-1 text-[12px] text-fg-muted transition-colors hover:bg-surface hover:text-fg disabled:opacity-50"
              >
                {busy === "bulk_reclassify" ? "Reclassifying…" : "Reclassify selected"}
              </button>
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="ml-auto inline-flex items-center gap-1 rounded-button px-2 py-1 text-[12px] text-fg-faint transition-colors hover:bg-surface hover:text-fg"
              >
                <X size={12} strokeWidth={1.75} />
                Clear
              </button>
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="flex min-h-[30vh] flex-col items-center justify-center gap-2 rounded-card border border-line-faint bg-surface text-center">
              <Sparkles size={20} strokeWidth={1.5} className="text-fg-faint" />
              <p className="text-[13px] text-fg-muted">No messages in this view.</p>
            </div>
          ) : (
            <ul className="divide-y divide-line-faint overflow-hidden rounded-card border border-line-faint bg-surface">
              {filtered.map((m) => (
                <MessageRow
                  key={m.id}
                  message={m}
                  selected={selectedIds.has(m.id)}
                  expanded={expandedId === m.id}
                  onToggleSelect={() => toggleSelect(m.id)}
                  onToggleExpand={() =>
                    setExpandedId((prev) => (prev === m.id ? null : m.id))
                  }
                  onOverride={() => setOverrideId(m.id)}
                  onReclassify={() => handleReclassifyOne(m.id)}
                  busy={busy === `one_${m.id}`}
                />
              ))}
            </ul>
          )}
        </section>
      </div>

      {overrideId && (
        <OverrideModal
          message={messages.find((m) => m.id === overrideId)}
          onClose={() => setOverrideId(null)}
          onApplied={(updated) => {
            applyMessageUpdate(updated);
            setOverrideId(null);
          }}
        />
      )}
    </div>
  );
}

function SidebarRow({ label, count, active, onClick, tone, actionable, ambiguous, indent }) {
  const labelClass = active
    ? "text-fg"
    : tone === "accent"
      ? "text-[color:var(--color-accent)]"
      : actionable
        ? "text-fg"
        : ambiguous
          ? "text-[color:var(--color-flag-low)]"
          : "text-fg-muted";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between gap-2 rounded-button px-2 py-1.5 text-[12px] transition-colors ${active ? "bg-muted" : "hover:bg-muted"} ${indent ? "pl-3" : ""}`}
    >
      <span className={labelClass}>{label}</span>
      <span
        className={`inline-flex min-w-[1.5rem] justify-center rounded-pill px-1.5 py-0.5 text-[11px] font-medium ${active ? "bg-surface text-fg" : "bg-muted text-fg-muted"}`}
      >
        {count}
      </span>
    </button>
  );
}

function MessageRow({
  message,
  selected,
  expanded,
  onToggleSelect,
  onToggleExpand,
  onOverride,
  onReclassify,
  busy,
}) {
  const c = message.classification;
  const tone = confidenceTone(c?.confidence);
  const isAct = c && isActionable(c.category);
  const isInformationalActioned = message.status === "actioned";

  return (
    <li
      className={`text-[13px] transition-colors ${selected ? "bg-muted" : "hover:bg-muted/40"} ${isInformationalActioned ? "opacity-60" : ""}`}
    >
      <div className="flex min-h-[64px] items-center gap-3 px-3 py-2">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          aria-label="Select message"
          className="h-3.5 w-3.5 shrink-0"
        />
        <span
          aria-label={`Confidence ${Math.round((c?.confidence || 0) * 100)}%`}
          title={`Confidence ${Math.round((c?.confidence || 0) * 100)}%`}
          className={`h-2 w-2 shrink-0 rounded-full ${TONE_DOT[tone]}`}
        />
        <button
          type="button"
          onClick={onToggleExpand}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-baseline gap-2">
              <span className="truncate text-[14px] font-medium text-fg">
                {message.senderName}
              </span>
              <span className="truncate text-[12px] text-fg-faint">
                · {message.senderOrg}
              </span>
              {c && (
                <span
                  className={`shrink-0 rounded-pill px-1.5 py-0.5 text-[10px] font-medium ${isAct ? "bg-[color:var(--color-accent-soft)] text-[color:var(--color-accent)]" : c.category === "unable_to_classify" ? "bg-[color:var(--color-flag-low-soft)] text-[color:var(--color-flag-low)]" : "bg-muted text-fg-muted"}`}
                >
                  {categoryLabel(c.category)}
                </span>
              )}
              {c?.humanOverridden && (
                <span className="shrink-0 rounded-pill bg-[color:var(--color-source-clinician-soft)] px-1.5 py-0.5 text-[10px] font-medium text-[color:var(--color-source-clinician)]">
                  Overridden
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="truncate text-[12px] text-fg-muted">
                {message.subject}
              </span>
            </div>
            {isAct && c.suggestedAction && (
              <div className="mt-0.5 truncate text-[11px] italic text-fg-muted">
                → {c.suggestedAction}
              </div>
            )}
          </div>
        </button>
        <div className="shrink-0 text-right text-[11px] text-fg-faint">
          {relativeTime(message.receivedAt)}
        </div>
        <ChevronRight
          size={14}
          strokeWidth={1.5}
          className={`shrink-0 text-fg-faint transition-transform ${expanded ? "rotate-90" : ""}`}
        />
      </div>
      {expanded && (
        <div className="space-y-3 border-t border-line-faint bg-canvas px-3 py-3">
          <div className="text-[13px] leading-relaxed text-fg whitespace-pre-wrap">
            {message.body}
          </div>
          <div className="grid grid-cols-1 gap-3 text-[12px] sm:grid-cols-2">
            <div className="space-y-1">
              <div className="text-fg-faint">
                <span className="font-medium text-fg-muted">Patient:</span>{" "}
                {message.patientName || "—"}
              </div>
              <div className="text-fg-faint">
                <span className="font-medium text-fg-muted">Route:</span>{" "}
                {routeLabel(c?.routeTo)}
              </div>
              <div className="text-fg-faint">
                <span className="font-medium text-fg-muted">Confidence:</span>{" "}
                {c ? `${Math.round(c.confidence * 100)}%` : "—"}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-fg-muted">
                <span className="font-medium text-fg">Reasoning:</span>{" "}
                <span className="text-fg-muted">{c?.reasoning || "—"}</span>
              </div>
              {c?.humanOverridden && c?.humanOverrideNote && (
                <div className="text-fg-muted">
                  <span className="font-medium text-fg">Override note:</span>{" "}
                  <span className="text-fg-muted">{c.humanOverrideNote}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onOverride}
              className="rounded-button border border-line px-2.5 py-1 text-[12px] text-fg-muted transition-colors hover:bg-muted hover:text-fg"
            >
              Override classification
            </button>
            <button
              type="button"
              onClick={onReclassify}
              disabled={busy}
              className="inline-flex items-center gap-1 rounded-button border border-line px-2.5 py-1 text-[12px] text-fg-muted transition-colors hover:bg-muted hover:text-fg disabled:opacity-50"
            >
              <RefreshCw
                size={11}
                strokeWidth={1.75}
                className={busy ? "animate-spin" : ""}
              />
              {busy ? "Reclassifying…" : "Reclassify"}
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

function OverrideModal({ message, onClose, onApplied }) {
  const c = message?.classification;
  const [category, setCategory] = useState(c?.category || "unable_to_classify");
  const [routeTo, setRouteTo] = useState(c?.routeTo || "");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  if (!message) return null;

  async function submit() {
    if (!note.trim()) {
      setErr("Override reason is required.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const resp = await fetch("/api/classify-referral/override", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId: message.id,
          newCategory: category,
          newRouteTo: routeTo || null,
          overrideNote: note.trim(),
        }),
      });
      if (!resp.ok) {
        const e = await resp.json().catch(() => ({}));
        throw new Error(e.error || `Override failed (${resp.status})`);
      }
      const { message: updated } = await resp.json();
      onApplied(updated);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-fg/30 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-card border border-line bg-surface p-5 shadow-lg">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-[18px] font-medium text-fg">Override classification</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-button p-1 text-fg-faint transition-colors hover:bg-muted hover:text-fg"
          >
            <X size={14} strokeWidth={1.75} />
          </button>
        </div>
        <div className="mt-3 space-y-3 text-[13px]">
          <div className="rounded-card bg-muted px-3 py-2">
            <div className="text-[11px] font-medium uppercase tracking-[0.05em] text-fg-faint">
              Current
            </div>
            <div className="text-fg">
              {categoryLabel(c?.category)}{" "}
              <span className="text-fg-faint">
                · {Math.round((c?.confidence || 0) * 100)}%
              </span>
            </div>
            <div className="text-[12px] text-fg-muted">{c?.reasoning}</div>
          </div>
          <label className="block">
            <span className="text-[12px] font-medium text-fg-muted">New category</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full rounded-button border border-line bg-surface px-2 py-1.5 text-[13px] text-fg"
            >
              {REFERRAL_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {categoryLabel(c)}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-[12px] font-medium text-fg-muted">Route to (optional)</span>
            <select
              value={routeTo}
              onChange={(e) => setRouteTo(e.target.value)}
              className="mt-1 w-full rounded-button border border-line bg-surface px-2 py-1.5 text-[13px] text-fg"
            >
              <option value="">— none —</option>
              <option value="patient_call_basket">Patient Call basket</option>
              <option value="pt_advice_request">Pt Advice Request</option>
              <option value="rx_request">Rx Request</option>
              <option value="scheduling">Scheduling</option>
              <option value="provider_review">Provider review</option>
            </select>
          </label>
          <label className="block">
            <span className="text-[12px] font-medium text-fg-muted">Override reason</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              required
              className="mt-1 w-full rounded-card border border-line bg-surface px-2.5 py-1.5 text-[13px] text-fg"
              placeholder="Why are you changing the classification?"
            />
          </label>
          {err && (
            <div className="rounded-card border border-line bg-[color:var(--color-flag-high-soft)] px-3 py-2 text-[12px] text-[color:var(--color-flag-high)]">
              {err}
            </div>
          )}
        </div>
        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-button px-3 py-1.5 text-[13px] text-fg-muted transition-colors hover:bg-muted hover:text-fg"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={busy}
            className="rounded-button bg-[color:var(--color-accent)] px-3 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-[color:var(--color-accent-hover)] disabled:opacity-50"
          >
            {busy ? "Saving…" : "Confirm override"}
          </button>
        </div>
      </div>
    </div>
  );
}
