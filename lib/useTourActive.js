// Reactive read of whether a guided tour is currently running. Both tour
// orchestrators record their live state in sessionStorage and announce
// lifecycle transitions via window events; this hook bridges that into
// React render state so a feature can be gated on tour-active.
//
// activeKey differs per surface:
//   /provider tour → "kairos-provider-tour-active"
//   /rn + /encounter tour → "kairos-tour-active"

"use client";

import { useEffect, useState } from "react";

export default function useTourActive(activeKey) {
  // Server has no sessionStorage — render inactive, then reconcile on
  // mount. For the common (no-tour) case server and client agree, so no
  // hydration mismatch; during a tour the gated feature appears on mount.
  const [active, setActive] = useState(false);

  useEffect(() => {
    const read = () => {
      try {
        setActive(sessionStorage.getItem(activeKey) === "1");
      } catch {
        setActive(false);
      }
    };
    read();
    // Re-read on any tour lifecycle event rather than assuming a
    // direction — keeps this correct no matter which tour fired which
    // event. start/beat-start fire while a tour runs; end fires once.
    window.addEventListener("kairos-tour:start", read);
    window.addEventListener("kairos-tour:beat-start", read);
    window.addEventListener("kairos-tour:end", read);
    return () => {
      window.removeEventListener("kairos-tour:start", read);
      window.removeEventListener("kairos-tour:beat-start", read);
      window.removeEventListener("kairos-tour:end", read);
    };
  }, [activeKey]);

  return active;
}
