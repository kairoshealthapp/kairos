"use client";

import { useEffect, useState } from "react";

function format(d) {
  if (!d) return "";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

export default function DashboardClock() {
  const [now, setNow] = useState(null);

  useEffect(() => {
    setNow(new Date());
    const tick = () => setNow(new Date());
    const ms = 60_000 - (Date.now() % 60_000);
    const align = setTimeout(() => {
      tick();
      const id = setInterval(tick, 60_000);
      // store interval on the element via closure cleanup
      align._interval = id;
    }, ms);
    return () => {
      clearTimeout(align);
      if (align._interval) clearInterval(align._interval);
    };
  }, []);

  return (
    <span
      className="inline-flex items-center rounded-pill border border-line-faint bg-surface px-2.5 py-1 font-mono text-[13px] text-fg-muted"
      suppressHydrationWarning
    >
      {now ? format(now) : " "}
    </span>
  );
}
