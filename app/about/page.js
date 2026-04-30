"use client";

import Link from "next/link";
import {
  APP_NAME,
  APP_VERSION,
  BUILD_PHASE,
  BUILD_DATE,
  COMMIT_SHA,
  DISPLAY_NAME,
} from "@/lib/version";

export default function AboutPage() {
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
          KAIROS · ABOUT
        </span>
        <h1 className="kairos-display text-bone text-[34px] font-medium leading-tight tracking-tightest mt-2 mb-4">
          {DISPLAY_NAME}
        </h1>
        <p className="text-[15px] text-bone leading-relaxed mb-8">
          A clinical synthesis surface for cardiology nursing. Three coordinated
          surfaces — RN, Scribe, Provider — share patient identity, F-H-I-R
          adapters, and order schema across the full encounter lifecycle.
        </p>

        <dl
          className="grid grid-cols-[140px_1fr] gap-y-3 gap-x-6 text-[13px]"
          style={{
            fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
          }}
        >
          <dt className="text-bone-muted">App</dt>
          <dd className="text-bone">{APP_NAME}</dd>

          <dt className="text-bone-muted">Version</dt>
          <dd className="text-bone">v{APP_VERSION}</dd>

          <dt className="text-bone-muted">Build phase</dt>
          <dd className="text-bone">{BUILD_PHASE}</dd>

          <dt className="text-bone-muted">Build date</dt>
          <dd className="text-bone">{BUILD_DATE}</dd>

          <dt className="text-bone-muted">Commit</dt>
          <dd className="text-bone">{COMMIT_SHA}</dd>
        </dl>

        <p className="text-[12px] text-bone-muted leading-relaxed mt-10">
          This page is not linked from the main navigation. Type /about directly
          to reach it. A future settings surface will link here.
        </p>
      </div>
    </main>
  );
}
