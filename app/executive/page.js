// /executive — Executive surface placeholder.
// Practice-level operations, throughput, and quality reporting. Stub; activation pending RN surface validation.

"use client";

import Link from "next/link";

export default function ExecutivePage() {
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
          KAIROS · EXECUTIVE SURFACE
        </span>
        <h1 className="kairos-display text-bone text-[34px] font-medium leading-tight tracking-tightest mt-2 mb-4">
          Executive Surface — coming soon.
        </h1>
        <p className="text-[15px] text-bone leading-relaxed mb-3">
          Practice-level operations, throughput, and quality reporting for
          cardiology leadership. In planning.
        </p>
        <p className="text-[13px] text-bone-muted leading-relaxed">
          This surface is reserved for future development. Activation is
          contingent on the RN surface being demoed and validated.
        </p>
      </div>
    </main>
  );
}
