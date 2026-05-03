// Phase 3.2-fix5 + fix6 + Phase 3.3 — kairoshealth.app panel chrome
// wrapping the 14-pattern fixture set. Card click → /encounter/{id} with
// tab state preserved via ?tab=. Authorized cards are filtered out of the
// dashboard via sessionStorage between visits.

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { listFixtures } from "@/data/fixtures/encounters";
import PatientCard from "@/components/PatientCard";
import TourLauncher from "@/components/TourLauncher";

// Phase-3.5: nav restructure — six In Basket folders mirroring Epic
// labels exactly. No invented categories.
const TABS = [
  { key: "results", label: "RESULTS" },
  { key: "resultsfu", label: "RESULTS F/U" },
  { key: "rxrequest", label: "RX REQUEST" },
  { key: "patientcall", label: "PATIENT CALL" },
  { key: "patientadvice", label: "PATIENT ADVICE REQUEST" },
  { key: "securechat", label: "SECURE CHAT" },
];

const PRIMARY_TYPES = new Set([
  "results",
  "resultsfu",
  "rxrequest",
  "patientcall",
  "patientadvice",
  "securechat",
]);
const STORAGE_KEY = "kairos.authorizedCards.v1";

function categoryFor(card) {
  return PRIMARY_TYPES.has(card.tab) ? card.tab : "resultsfu";
}

function adaptPatient(fixture) {
  const p = fixture.patient || {};
  // Phase-3.4 polish: dropped the green/amber/red severity dots in favour
  // of a single boolean. Only fixtures with urgency: "high" surface a red
  // urgent triangle on the card; everything else has no icon.
  return {
    id: fixture.id,
    name: p.displayName || p.name,
    age: p.age || "",
    sex: p.sex || "",
    urgent: fixture.urgency === "high",
    reasonForColumn: (fixture.card && fixture.card.subject) || "",
    issueLine: (fixture.card && fixture.card.subject) || "",
  };
}

function sortInTab(list) {
  return [...list].sort((a, b) => {
    const u =
      (a.urgency === "high" ? 0 : 1) - (b.urgency === "high" ? 0 : 1);
    if (u !== 0) return u;
    return new Date(a.receivedAt || 0) - new Date(b.receivedAt || 0);
  });
}

function ResetIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
    </svg>
  );
}

// Demo-state reset: clears every sessionStorage / localStorage key the
// dashboard uses to remember per-fixture state (authorized cards, triage
// responses, tour flags). Then forces a clean reload so /rn renders
// fixtures in their original starting state. Called both manually
// (the "Reset demo" affordance in the top nav) and automatically on
// every /rn mount when the tour is not active — so anyone landing on
// the demo always sees a fresh dashboard.
function clearDemoState() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem("kairos.authorizedCards.v1.backup");
    // Tour flags — only safe to clear if the tour isn't currently running.
    if (sessionStorage.getItem("kairos-tour-active") !== "1") {
      sessionStorage.removeItem("kairos-tour-active");
      sessionStorage.removeItem("kairos-tour-speed");
    }
    // Triage stage responses (per-fixture localStorage) and any other
    // kairos-namespaced keys.
    const lsKeysToDrop = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      if (k.startsWith("kairos.triage.responses.v1.")) lsKeysToDrop.push(k);
      else if (k.startsWith("kairos-fixture-")) lsKeysToDrop.push(k);
      else if (k.startsWith("kairos-card-state-")) lsKeysToDrop.push(k);
    }
    for (const k of lsKeysToDrop) localStorage.removeItem(k);
  } catch {
    /* noop */
  }
}

function startTour() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("kairos-tour:start"));
  }
}

function readAuthorized() {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw));
  } catch {
    return new Set();
  }
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("resultsfu");
  const [authorized, setAuthorized] = useState(() => new Set());
  const mobileNavRef = useRef(null);

  // On mount: pick up ?tab= from the URL (preserves dashboard tab when the
  // user navigates back from the encounter detail route). Reading via
  // window.location avoids the Suspense boundary required for useSearchParams
  // during static export.
  useEffect(() => {
    // v3.0 — panel-terminated cards (Done / Reply / Approve / Forward
    // / Approve & Send Packet) persist for the session and stay hidden
    // from the inbox until the user clicks "Reset demo". Previously the
    // dashboard auto-cleared on every mount, which wiped panel
    // completion the moment the user navigated back from a card.
    const auth = readAuthorized();
    setAuthorized(auth);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const t = params.get("tab");
      if (t) {
        // Race guard: when EncounterDetail navigates back to /rn after a
        // tour auto-authorize, the URL ?tab= reflects the just-authorized
        // fixture's basket. If that basket is now empty (because all of
        // its fixtures are authorized), committing to it would flash
        // "None today in this basket" until the tour's
        // kairos-tour:set-tab event switches us to the next card's
        // basket ~250ms later. Skip the URL commit when the tour is
        // active and the URL tab has zero unauthorized fixtures — stay
        // on the default tab until the tour dispatches the right one.
        const tourActive =
          typeof sessionStorage !== "undefined" &&
          sessionStorage.getItem("kairos-tour-active") === "1";
        const tabHasCards = listFixtures().some(
          (f) => categoryFor(f) === t && !auth.has(f.id)
        );
        if (!tourActive || tabHasCards) setActiveTab(t);
      }
    }
    const onFocus = () => setAuthorized(readAuthorized());
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    // Tour drives the active tab mid-run (PatientCard can only pulse on a
    // card that's actually rendered, which requires the fixture's basket
    // to be the active tab when its pre-arrival beat fires).
    const onTourSetTab = (e) => {
      const t = e && e.detail && e.detail.tab;
      if (t) setActiveTab(t);
    };
    window.addEventListener("kairos-tour:set-tab", onTourSetTab);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
      window.removeEventListener("kairos-tour:set-tab", onTourSetTab);
    };
  }, []);

  const visibleFixtures = useMemo(() => {
    return listFixtures().filter((f) => !authorized.has(f.id));
  }, [authorized]);

  const counts = useMemo(() => {
    const c = {
      results: 0,
      resultsfu: 0,
      rxrequest: 0,
      patientcall: 0,
      patientadvice: 0,
      securechat: 0,
    };
    for (const f of visibleFixtures) c[categoryFor(f)]++;
    return c;
  }, [visibleFixtures]);

  const visibleCards = useMemo(() => {
    return sortInTab(visibleFixtures.filter((f) => categoryFor(f) === activeTab));
  }, [visibleFixtures, activeTab]);

  useEffect(() => {
    const container = mobileNavRef.current;
    if (!container) return;
    const active = container.querySelector('[data-active="true"]');
    if (!active) return;
    active.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [activeTab]);

  function selectTab(key) {
    if (activeTab === key) return;
    setActiveTab(key);
  }

  return (
    <>
      <header className="border-b border-mist/60 -mx-6 -mt-8 mb-8">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <div className="h-14 flex items-center gap-3 sm:gap-8 justify-between sm:justify-start">
            <Link
              href="/rn"
              className="kairos-nav-wordmark shrink-0"
              aria-label="Kairos — dashboard home"
            >
              KAIROS
            </Link>
            <nav className="hidden sm:flex items-center gap-1 ml-4">
              {TABS.map((tab) => {
                const active = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => selectTab(tab.key)}
                    className={
                      "relative px-3 py-2 text-[13px] font-medium transition-colors " +
                      (active ? "text-bone" : "text-bone-muted hover:text-bone")
                    }
                    aria-pressed={active}
                  >
                    <span>{tab.label}</span>
                    <span className="kairos-data text-[11px] text-bone-muted/70 ml-2">
                      {counts[tab.key]}
                    </span>
                    {active && (
                      <span className="absolute -bottom-[1px] left-3 right-3 h-[2px] bg-amber" />
                    )}
                  </button>
                );
              })}
              <span className="ml-2">
                <TourLauncher onStart={startTour} />
              </span>
            </nav>
            <div className="ml-auto flex items-center gap-3 text-[12px] shrink-0">
              <span className="hidden sm:inline text-bone-muted">Brandon S., RN BSN</span>
              <button
                type="button"
                aria-label="Reset demo"
                title="Reset demo — clears any clicks and reloads fixtures in their original state"
                onClick={() => {
                  clearDemoState();
                  window.location.reload();
                }}
                className="flex items-center gap-1.5 h-8 px-2 text-bone-muted hover:text-bone hover:bg-platinum rounded-sm transition-colors text-[12px]"
              >
                <ResetIcon />
                <span className="hidden sm:inline">Reset demo</span>
              </button>
            </div>
          </div>
          <nav
            ref={mobileNavRef}
            className="sm:hidden flex items-center gap-1 -mx-4 px-4 pb-2 overflow-x-auto"
            style={{ scrollbarWidth: "none" }}
            aria-label="Inbox category tabs (mobile)"
          >
            {TABS.map((tab) => {
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  data-active={active ? "true" : "false"}
                  onClick={() => selectTab(tab.key)}
                  className={
                    "relative px-3 py-1.5 text-[13px] font-medium whitespace-nowrap transition-colors " +
                    (active ? "text-bone" : "text-bone-muted hover:text-bone")
                  }
                  aria-pressed={active}
                >
                  <span>{tab.label}</span>
                  <span className="kairos-data text-[11px] text-bone-muted/70 ml-2">
                    {counts[tab.key]}
                  </span>
                  {active && (
                    <span className="absolute -bottom-[1px] left-3 right-3 h-[2px] bg-amber" />
                  )}
                </button>
              );
            })}
            <span className="ml-1 shrink-0">
              <TourLauncher onStart={startTour} />
            </span>
          </nav>
        </div>
      </header>

      {visibleCards.length === 0 ? (
        <div className="text-[13px] text-bone-muted/70 italic">
          None today in this basket.
        </div>
      ) : (
        <section
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 kairos-stagger"
          key={activeTab}
        >
          {visibleCards.map((f) => (
            <PatientCard
              key={f.id}
              patient={adaptPatient(f)}
              label={f.card && f.card.kicker}
              fromTab={activeTab}
            />
          ))}
        </section>
      )}
    </>
  );
}
