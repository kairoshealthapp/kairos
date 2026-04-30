// Legacy route — use /rn.
// /dashboard was the original RN home before the three-surface scaffold.
// Kept as a client-side redirect so external links and bookmarks don't 404.

"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function DashboardRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const qs = searchParams && searchParams.toString();
    router.replace(qs ? "/rn?" + qs : "/rn");
  }, [router, searchParams]);

  return (
    <main className="min-h-screen px-6 py-12 flex items-start justify-center">
      <p className="text-[13px] text-bone-muted">Redirecting to /rn…</p>
    </main>
  );
}

export default function DashboardLegacyRedirect() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen px-6 py-12 flex items-start justify-center">
          <p className="text-[13px] text-bone-muted">Redirecting to /rn…</p>
        </main>
      }
    >
      <DashboardRedirect />
    </Suspense>
  );
}
