import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getIncomingFaxes } from "@/lib/state/incomingFaxes";
import FaxInboxBoard from "@/components/FaxInboxBoard";

export const dynamic = "force-dynamic";

export default function FaxInboxPage() {
  const faxes = getIncomingFaxes();
  const awaiting = faxes.filter((f) => f.status === "awaiting_review").length;
  const autoMatched = faxes.filter((f) => f.status === "auto_matched").length;
  const humanMatched = faxes.filter((f) => f.status === "human_matched").length;
  const processed = faxes.filter((f) => f.status === "processed").length;
  const rejected = faxes.filter((f) => f.status === "rejected").length;

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-[28px] font-medium tracking-[-0.01em] leading-[1.3] text-fg">
            Fax Inbox
          </h1>
          <p className="text-[14px] text-fg-muted">
            {awaiting} awaiting review · {processed} auto-processed today
          </p>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 rounded-button px-2 py-1 text-[13px] text-fg-muted transition-colors duration-100 hover:bg-muted hover:text-fg"
        >
          <ArrowLeft size={14} strokeWidth={1.75} />
          Dashboard
        </Link>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Awaiting review" value={awaiting} tone={awaiting > 0 ? "amber" : "muted"} />
        <Stat label="Auto-matched" value={autoMatched} tone="success" />
        <Stat
          label="Manually matched today"
          value={humanMatched + processed}
          tone="muted"
        />
        <Stat label="Rejected" value={rejected} tone="muted" />
      </div>

      <FaxInboxBoard initialFaxes={faxes} />
    </div>
  );
}

function Stat({ label, value, tone }) {
  const valueClass =
    tone === "amber"
      ? "text-[color:var(--color-flag-low)]"
      : tone === "success"
        ? "text-[color:var(--color-flag-success)]"
        : "text-fg";
  return (
    <div className="rounded-card border border-line-faint bg-surface p-4">
      <div className="text-[11px] font-medium uppercase tracking-[0.05em] text-fg-faint">
        {label}
      </div>
      <div className={`mt-1 text-[24px] font-semibold leading-none ${valueClass}`}>
        {value}
      </div>
    </div>
  );
}
