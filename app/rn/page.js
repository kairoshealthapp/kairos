// Phase 3.2-fix5 + fix6 + Phase 3.3 — kairoshealth.app panel chrome
// wrapping the 14-pattern fixture set. Card click → /encounter/{id} with
// tab state preserved via ?tab=. Authorized cards are filtered out of the
// dashboard via sessionStorage between visits.

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

function CogIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
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
    setAuthorized(readAuthorized());
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const t = params.get("tab");
      if (t) setActiveTab(t);
    }
    const onFocus = () => setAuthorized(readAuthorized());
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
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
            <span className="kairos-display text-bone text-xl tracking-tightest shrink-0">
              Kairos
            </span>
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
                aria-label="Settings"
                className="w-8 h-8 grid place-items-center text-bone-muted hover:text-bone hover:bg-platinum rounded-sm transition-colors"
              >
                <CogIcon />
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
