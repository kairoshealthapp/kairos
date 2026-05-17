// /provider — 4-column day-in-the-life surface. One column per clinic
// (Cardiology / Family Practice / Internal Medicine / Pulmonology),
// equal width on desktop, vertical-stack on mobile with tap-to-
// collapse. Each card runs the clinical engine against its patient
// bundle and shows firing rule findings inline.
//
// Tour control flows through the same callbacks the user uses, so
// tour-driven and user-driven interactions are indistinguishable from
// the data layer's perspective. Per-clinic tour buttons sit in each
// column's header and dispatch a "kairos-provider-tour:start-clinic"
// event handled by ProviderTour.

"use client";

import { useCallback, useState } from "react";
import Link from "next/link";

import CARDIOLOGY_SCHEDULE from "@/lib/fixtures/providerSchedule.cardiology";
import FAMILY_PRACTICE_SCHEDULE from "@/lib/fixtures/providerSchedule.familyPractice";
import INTERNAL_MEDICINE_SCHEDULE from "@/lib/fixtures/providerSchedule.internalMedicine";
import PULMONOLOGY_SCHEDULE from "@/lib/fixtures/providerSchedule.pulmonology";

import CARDIOLOGY_BRIEFINGS from "@/lib/fixtures/providerBriefings.cardiology";
import FAMILY_PRACTICE_BRIEFINGS from "@/lib/fixtures/providerBriefings.familyPractice";
import INTERNAL_MEDICINE_BRIEFINGS from "@/lib/fixtures/providerBriefings.internalMedicine";
import PULMONOLOGY_BRIEFINGS from "@/lib/fixtures/providerBriefings.pulmonology";

import PatientColumn from "./components/PatientColumn";
import BriefingDrawer from "./components/BriefingDrawer";
import ProviderTour from "./components/ProviderTour";

const SCHEDULES = {
  cardiology: CARDIOLOGY_SCHEDULE,
  familyPractice: FAMILY_PRACTICE_SCHEDULE,
  internalMedicine: INTERNAL_MEDICINE_SCHEDULE,
  pulmonology: PULMONOLOGY_SCHEDULE,
};

const BRIEFINGS = {
  cardiology: CARDIOLOGY_BRIEFINGS,
  familyPractice: FAMILY_PRACTICE_BRIEFINGS,
  internalMedicine: INTERNAL_MEDICINE_BRIEFINGS,
  pulmonology: PULMONOLOGY_BRIEFINGS,
};

// Column order left-to-right.
const CLINIC_COLUMNS = [
  { key: "cardiology", label: "Cardiology" },
  { key: "familyPractice", label: "Family Practice" },
  { key: "internalMedicine", label: "Internal Medicine" },
  { key: "pulmonology", label: "Pulmonology" },
];

// Mobile-default expanded state — all 4 columns expanded on first
// render so a viewer sees every clinic. User can tap headers to
// collapse on mobile. md+ ignores collapsed state.
function makeInitialCollapsed() {
  const out = {};
  for (const c of CLINIC_COLUMNS) out[c.key] = false;
  return out;
}

// Visual "highlighted" clinic — replaces the old openClinic dropdown
// state. Cardiology highlighted by default (preserves Fix 2 behavior).
const DEFAULT_HIGHLIGHTED = "cardiology";

function ResetIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
    </svg>
  );
}

export default function ProviderPage() {
  const [highlightedClinic, setHighlightedClinic] = useState(DEFAULT_HIGHLIGHTED);
  const [collapsed, setCollapsed] = useState(makeInitialCollapsed);
  // openVisit: { visit, specialty } or null.
  const [openVisit, setOpenVisit] = useState(null);

  const handleClinicToggleCollapse = useCallback((clinic) => {
    setCollapsed((prev) => ({ ...prev, [clinic]: !prev[clinic] }));
  }, []);
  const handleVisitOpen = useCallback((visit, specialty) => {
    if (!visit) return;
    setOpenVisit({ visit, specialty });
  }, []);
  const handleVisitClose = useCallback(() => {
    setOpenVisit(null);
  }, []);
  const handleTourStart = useCallback((clinic) => {
    if (typeof window === "undefined") return;
    setHighlightedClinic(clinic);
    window.dispatchEvent(
      new CustomEvent("kairos-provider-tour:start-clinic", {
        detail: { clinic },
      })
    );
  }, []);
  const handleResetDemo = useCallback(() => {
    setHighlightedClinic(DEFAULT_HIGHLIGHTED);
    setCollapsed(makeInitialCollapsed());
    setOpenVisit(null);
  }, []);

  const briefing = openVisit
    ? (BRIEFINGS[openVisit.specialty] || {})[openVisit.visit.briefingId] || null
    : null;

  return (
    <>
      <header className="border-b border-mist/60 -mx-6 -mt-8 mb-6">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <div className="h-14 flex items-center gap-3 sm:gap-8 justify-between">
            <Link
              href="/"
              className="kairos-nav-wordmark shrink-0"
              aria-label="Kairos — home"
            >
              KAIROS
            </Link>
            <div className="flex items-center gap-3 text-[12px] shrink-0">
              <span className="hidden sm:inline text-bone-muted">Provider</span>
              <button
                type="button"
                aria-label="Reset demo"
                title="Reset demo"
                onClick={handleResetDemo}
                className="flex items-center gap-1.5 h-8 px-2 text-bone-muted hover:text-bone hover:bg-platinum rounded-sm transition-colors text-[12px]"
              >
                <ResetIcon />
                <span className="hidden sm:inline">Reset demo</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 4-column clinic grid. Unmounted while a card is open so the
          schedule never bleeds through the drawer. */}
      {!openVisit && (
        <>
          <div data-tour-anchor="page-title" className="mb-4">
            <span className="kairos-kicker text-amber/80 mb-1 inline-block">
              KAIROS · PROVIDER
            </span>
            <h1 className="kairos-display text-bone text-[24px] sm:text-[28px] font-medium leading-tight tracking-tightest">
              Provider Schedule · May 7, 2026
            </h1>
          </div>
          <div className="flex flex-col md:flex-row md:items-stretch gap-3">
            {CLINIC_COLUMNS.map((c) => (
              <PatientColumn
                key={c.key}
                clinicKey={c.key}
                label={c.label}
                schedule={SCHEDULES[c.key] || []}
                highlighted={highlightedClinic === c.key}
                collapsed={collapsed[c.key]}
                tourMinutes={2}
                onToggleCollapse={() => handleClinicToggleCollapse(c.key)}
                onVisitOpen={handleVisitOpen}
                onTourStart={handleTourStart}
              />
            ))}
          </div>
        </>
      )}

      {/* Card drawer — opaque, full readable width. Mounts only when a
          visit is open. */}
      {openVisit && (
        <BriefingDrawer
          open={true}
          visit={openVisit.visit}
          briefing={briefing}
          briefingId={openVisit.visit.briefingId}
          specialty={openVisit.specialty}
          onClose={handleVisitClose}
        />
      )}

      <ProviderTour
        highlightedClinic={highlightedClinic}
        openVisit={openVisit}
        schedules={SCHEDULES}
        onClinicHighlight={setHighlightedClinic}
        onVisitOpen={handleVisitOpen}
        onVisitClose={handleVisitClose}
      />
    </>
  );
}
