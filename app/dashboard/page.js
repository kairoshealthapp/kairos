// Phase 3.2-fix5 + fix6 — kairoshealth.app panel chrome wrapping HVC clinical data.
//
// fix6 changes:
//   #1 — equal-height cards (handled in PatientCard via h-full + flex flex-col;
//        CSS Grid auto-stretches cells to the tallest card in the row)
//   #3 — full Nav layout ported from firekraker-monorepo/kairos/components/Nav.js
//        (wordmark left, 6 category tabs, "Take the tour" pill, identity right
//        with cog). Mobile fallback strip below. Scroll-active-into-view on
//        mobile preserved from source.
//
// Per fix5 decisions:
//   • Client component (useState for activeTab + selectedCardId).
//   • Nav lives here, not in AppChrome — uses negative margins to escape
//     AppChrome's `<main className="max-w-[1400px] mx-auto px-6 py-8">` so the
//     header border-b spans the full main-width seam.
//   • TourOverlay was dropped in fix5 — the "Take the tour" button stays
//     visible per fix6 spec, but its onClick is a no-op (logs intent).
//   • HVC chat wiring + opening a card to a detail view = Phase 3.3.

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import cards from "@/data/mock-queue/cards.json";
import PatientCard from "@/components/PatientCard";

const TABS = [
  { key: "notify", label: "NOTIFY" },
  { key: "refill", label: "REFILL" },
  { key: "triage", label: "TRIAGE" },
  { key: "advice", label: "ADVICE" },
  { key: "inr",    label: "INR" },
  { key: "other",  label: "OTHER" },
];

const PRIMARY_TYPES = new Set(["notify", "refill", "triage", "advice", "inr"]);

function categoryFor(card) {
  return PRIMARY_TYPES.has(card.type) ? card.type : "other";
}

function ageFromDOB(dob) {
  if (!dob) return "";
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return "";
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

function adaptPatient(card) {
  return {
    id: card.id,
    name: card.patient.name,
    age: ageFromDOB(card.patient.dob),
    sex: "",
    severity: card.urgency_signal === "red" ? "red" : "green",
    reasonForColumn: card.message?.subject || "",
    issueLine: card.message?.subject || "",
  };
}

function sortInTab(list) {
  return [...list].sort((a, b) => {
    const u =
      (a.urgency_signal === "red" ? 0 : 1) -
      (b.urgency_signal === "red" ? 0 : 1);
    if (u !== 0) return u;
    return new Date(a.received_at) - new Date(b.received_at);
  });
}

// Settings cog SVG matches firekraker-monorepo/kairos/components/Nav.js verbatim.
function CogIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function startTour() {
  // No-op for now — TourOverlay was dropped in fix5 #7. Phase 3.3+ may wire
  // an actual product tour. Keeping the button visible per fix6 #3 spec.
  // eslint-disable-next-line no-console
  console.log("tour pending — TourOverlay not ported");
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("notify");
  const [selectedId, setSelectedId] = useState(null);
  const mobileNavRef = useRef(null);

  const counts = useMemo(() => {
    const c = { notify: 0, refill: 0, triage: 0, advice: 0, inr: 0, other: 0 };
    for (const card of cards) c[categoryFor(card)]++;
    return c;
  }, []);

  const visibleCards = useMemo(() => {
    return sortInTab(cards.filter((c) => categoryFor(c) === activeTab));
  }, [activeTab]);

  // Scroll the active tab into view inside the mobile scrollable strip.
  // Ported from source Nav.js — only fires when the active key changes.
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
    setSelectedId(null);
  }

  function toggleSelect(id) {
    setSelectedId((prev) => (prev === id ? null : id));
  }

  return (
    <>
      {/* Header strip — wordmark + tabs + tour + identity. Negative margins
          escape AppChrome's <main> padding (px-6 py-8) so the border-b spans
          the main width. */}
      <header className="border-b border-mist/60 -mx-6 -mt-8 mb-8">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          {/* TOP ROW — wordmark + (desktop nav inline) + identity */}
          <div className="h-14 flex items-center gap-3 sm:gap-8 justify-between sm:justify-start">
            <span className="kairos-display text-bone text-xl tracking-tightest shrink-0">
              Kairos
            </span>

            {/* Desktop nav — inline alongside wordmark (>=sm) */}
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
              <button
                type="button"
                onClick={startTour}
                className="ml-2 text-[12px] font-semibold text-graphite bg-amber hover:bg-amber/90 px-3 py-1.5 rounded-full transition-colors whitespace-nowrap"
              >
                Take the tour
              </button>
            </nav>

            {/* Identity — name hidden on mobile, cog kept */}
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

          {/* MOBILE NAV ROW — horizontally scrollable tab strip (<sm only) */}
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
            <button
              type="button"
              onClick={startTour}
              className="ml-1 shrink-0 text-[12px] font-semibold text-graphite bg-amber hover:bg-amber/90 px-3 py-1 rounded-full transition-colors whitespace-nowrap"
            >
              Take the tour
            </button>
          </nav>
        </div>
      </header>

      {/* 4-col card grid — matches source panel/page.js workspace. */}
      {visibleCards.length === 0 ? (
        <div className="text-[13px] text-bone-muted/70 italic">
          None today in this basket.
        </div>
      ) : (
        <section
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 kairos-stagger"
          key={activeTab}
        >
          {visibleCards.map((card) => (
            <PatientCard
              key={card.id}
              patient={adaptPatient(card)}
              isSelected={selectedId === card.id}
              onSelect={() => toggleSelect(card.id)}
            />
          ))}
        </section>
      )}
    </>
  );
}
