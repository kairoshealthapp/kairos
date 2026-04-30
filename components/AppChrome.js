// Phase 3.2-fix5 + Phase 3.3 — adapted from firekraker-monorepo/kairos.
// Phase 3.3 addition: mount TourMode at this level so it persists across
// route navigations between /rn and /encounter/[id]. TourMode
// renders nothing unless tour is active.

"use client";

import { usePathname } from "next/navigation";
import Banner from "./Banner";
import TourMode from "./TourMode";
import VersionStamp from "./VersionStamp";

export default function AppChrome({ children }) {
  const pathname = usePathname();
  if (pathname === "/") return <>{children}</>;
  return (
    <>
      <Banner />
      <main className="max-w-[1400px] mx-auto px-6 py-8">{children}</main>
      <TourMode />
      <VersionStamp />
    </>
  );
}
