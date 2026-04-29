// Phase 3.2-fix5 — adapted from firekraker-monorepo/kairos/components/AppChrome.js.
// Adaptations per fix5 decisions:
//   • Drop TourOverlay import — feature not ported.
//   • Drop Nav — moved into the dashboard page itself as in-page tabs (fix5 #5/#6).
//   • Banner stays on every non-root route (demo notice applies app-wide).

"use client";

import { usePathname } from "next/navigation";
import Banner from "./Banner";

export default function AppChrome({ children }) {
  const pathname = usePathname();
  // Root '/' redirects to /dashboard in this repo, so this short-circuit
  // never normally fires. Kept for parity with source semantics.
  if (pathname === "/") return <>{children}</>;
  return (
    <>
      <Banner />
      <main className="max-w-[1400px] mx-auto px-6 py-8">{children}</main>
    </>
  );
}
