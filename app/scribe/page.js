// /scribe — Scribe surface placeholder.
// Live-encounter capture for physician rounding. Stub for Devin's module.

"use client";

import Link from "next/link";

export default function ScribePage() {
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
          KAIROS · SCRIBE SURFACE
        </span>
        <h1 className="kairos-display text-bone text-[34px] font-medium leading-tight tracking-tightest mt-2 mb-4">
          Scribe Surface — coming soon.
        </h1>
        <p className="text-[15px] text-bone leading-relaxed mb-3">
          Live-encounter capture for physician rounding. In development.
        </p>
        <p className="text-[13px] text-bone-muted leading-relaxed">
          This surface will support note transcription, order placement, and
          plan structuring during in-room visits — sharing patient identity,
          FHIR adapters, and order schema with the RN and provider surfaces.
        </p>
      </div>
    </main>
  );
}
