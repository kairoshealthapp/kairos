"use client";

import { useEffect, useState } from "react";
import { APP_VERSION, BUILD_PHASE } from "@/lib/version";

export default function VersionStamp() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("kairos-tour-active") === "1") {
      setHidden(true);
    }
    const onStart = () => setHidden(true);
    const onEnd = () => setHidden(false);
    window.addEventListener("kairos-tour:start", onStart);
    window.addEventListener("kairos-tour:end", onEnd);
    return () => {
      window.removeEventListener("kairos-tour:start", onStart);
      window.removeEventListener("kairos-tour:end", onEnd);
    };
  }, []);

  if (hidden) return null;

  return (
    <div
      title={`Phase ${BUILD_PHASE}`}
      className="fixed bottom-2 right-3 z-30 select-none font-mono text-[10px] text-[var(--kairos-bone-muted)] opacity-40 hover:opacity-80 transition-opacity duration-200 pointer-events-auto"
      style={{ fontFamily: "var(--font-jetbrains), ui-monospace, monospace" }}
    >
      v{APP_VERSION}
    </div>
  );
}
