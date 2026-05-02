// Feature flags for the Kairos tour. Cinematic pacing is rolled out behind
// a flag so the team can bisect any regressions: flip the constant to
// false and the tour falls back to the pre-cinematic event protocol.
//
// During autonomous build (May 2 2026) this defaults to true for dev
// testing; Brandon flips it on/off after smoke-testing.

export const cinematicMode = true;

// Allow runtime overrides via the URL (?cinematic=0 or ?cinematic=1) and
// sessionStorage. Falls back to the build-time constant when no override
// is present. Safe to call from client components only.
export function isCinematicMode() {
  if (typeof window === "undefined") return cinematicMode;
  try {
    const params = new URLSearchParams(window.location.search);
    const qp = params.get("cinematic");
    if (qp === "0") return false;
    if (qp === "1") return true;
    const stored = sessionStorage.getItem("kairos.cinematicMode");
    if (stored === "0") return false;
    if (stored === "1") return true;
  } catch {
    // ignore
  }
  return cinematicMode;
}
