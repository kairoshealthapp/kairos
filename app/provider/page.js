// /provider — Provider surface placeholder.
// Morning prep + pre-visit chart review. Stub; activation pending RN surface validation.

"use client";

import Link from "next/link";

export default function ProviderPage() {
  return (
    <main className="min-h-screen px-6 py-12 flex items-start justify-center">
      <div className="max-w-[640px] w-full">
        <Link
          href="/rn"
          className="text-[12px] text-bone-muted hover:text-bone underline-offset-2 hover:underline"
        >
          ← Back to RN dashboard
        </Link>
        <span className="kairos-kicker text-amber/80 mt-8 inline-block">
          KAIROS · PROVIDER SURFACE
        </span>
        <h1 className="kairos-display text-bone text-[34px] font-medium leading-tight tracking-tightest mt-2 mb-4">
          Provider Surface — coming soon.
        </h1>
        <p className="text-[15px] text-bone leading-relaxed mb-3">
          Morning prep, loop-closure on prior recommendations, pre-visit chart
          review. In planning.
        </p>
        <p className="text-[13px] text-bone-muted leading-relaxed">
          This surface is reserved for future development. Activation is
          contingent on the RN surface being demoed and validated. See
          docs/PROVIDER-SURFACE-PLANNING.md when work begins.
        </p>
      </div>
    </main>
  );
}
