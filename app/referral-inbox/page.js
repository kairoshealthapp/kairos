import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getReferralMessages } from "@/lib/state/referralMessages";
import {
  ACTIONABLE_CATEGORIES,
  INFORMATIONAL_CATEGORIES,
} from "@/lib/types/referralMessage";
import ReferralInboxBoard from "@/components/ReferralInboxBoard";

export const dynamic = "force-dynamic";

export default function ReferralInboxPage() {
  const messages = getReferralMessages();
  const total = messages.length;
  const actionableCount = messages.filter(
    (m) => m.classification && ACTIONABLE_CATEGORIES.includes(m.classification.category)
  ).length;
  const informationalCount = messages.filter(
    (m) =>
      m.classification && INFORMATIONAL_CATEGORIES.includes(m.classification.category)
  ).length;
  const unclassifiedCount = messages.filter(
    (m) =>
      !m.classification || m.classification.category === "unable_to_classify"
  ).length;
  const overriddenCount = messages.filter(
    (m) => m.classification?.humanOverridden
  ).length;
  const accuracy = total > 0 ? Math.round(((total - overriddenCount) / total) * 100) : 100;

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-[28px] font-medium tracking-[-0.01em] leading-[1.3] text-fg">
            Referral Inbox
          </h1>
          <p className="text-[14px] text-fg-muted">
            {total} messages received today · {actionableCount} need attention
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
        <Stat
          label="Actionable"
          value={actionableCount}
          tone="accent"
        />
        <Stat
          label="Informational (suppressed)"
          value={informationalCount}
          tone="muted"
        />
        <Stat
          label="Unclassified"
          value={unclassifiedCount}
          tone={unclassifiedCount > 0 ? "amber" : "muted"}
        />
        <Stat
          label="Auto-classified accuracy"
          value={`${accuracy}%`}
          tone="muted"
          subtitle={`${overriddenCount} overridden`}
        />
      </div>

      <ReferralInboxBoard initialMessages={messages} />
    </div>
  );
}

function Stat({ label, value, tone, subtitle }) {
  const valueClass =
    tone === "accent"
      ? "text-[color:var(--color-accent)]"
      : tone === "amber"
        ? "text-[color:var(--color-flag-low)]"
        : "text-fg";
  return (
    <div className="rounded-card border border-line-faint bg-surface p-4">
      <div className="text-[11px] font-medium uppercase tracking-[0.05em] text-fg-faint">
        {label}
      </div>
      <div className={`mt-1 text-[24px] font-semibold leading-none ${valueClass}`}>
        {value}
      </div>
      {subtitle && (
        <div className="mt-1 text-[11px] text-fg-faint">{subtitle}</div>
      )}
    </div>
  );
}
