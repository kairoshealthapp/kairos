// /provider — provider day-in-the-life surface, clinic-dropdown
// architecture. Three persistent clinic buttons at the top of the page
// each open a dropdown menu containing that clinic's patient list.
// Clicking a patient row opens the briefing card (drawer). When the
// card is open, the clinic nav and dropdowns are unmounted (not just
// hidden) so nothing bleeds through.
//
// Tour control flows through the same callbacks the user uses, so
// tour-driven and user-driven interactions are indistinguishable from
// the data layer's perspective.

"use client";

import { useCallback, useState } from "react";
import Link from "next/link";

import CARDIOLOGY_SCHEDULE from "@/lib/fixtures/providerSchedule.cardiology";
import PULMONOLOGY_SCHEDULE from "@/lib/fixtures/providerSchedule.pulmonology";
import INTERNAL_MEDICINE_SCHEDULE from "@/lib/fixtures/providerSchedule.internalMedicine";

import CARDIOLOGY_BRIEFINGS from "@/lib/fixtures/providerBriefings.cardiology";
import PULMONOLOGY_BRIEFINGS from "@/lib/fixtures/providerBriefings.pulmonology";
import INTERNAL_MEDICINE_BRIEFINGS from "@/lib/fixtures/providerBriefings.internalMedicine";

import ClinicNav from "./components/ClinicNav";
import BriefingDrawer from "./components/BriefingDrawer";
import ProviderTour from "./components/ProviderTour";
import ProviderTourLauncher from "./components/ProviderTourLauncher";

const SCHEDULES = {
  cardiology: CARDIOLOGY_SCHEDULE,
  pulmonology: PULMONOLOGY_SCHEDULE,
  internalMedicine: INTERNAL_MEDICINE_SCHEDULE,
};

const BRIEFINGS = {
  cardiology: CARDIOLOGY_BRIEFINGS,
  pulmonology: PULMONOLOGY_BRIEFINGS,
  internalMedicine: INTERNAL_MEDICINE_BRIEFINGS,
};

// Open a clinic on load (and on reset) so the page shows a schedule
// immediately instead of an empty body — a first-time visitor has no
// affordance telling them to click a dropdown.
const DEFAULT_CLINIC = "cardiology";

function ResetIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
    </svg>
  );
}

export default function ProviderPage() {
  // openClinic: which dropdown is open ('cardiology' | 'pulmonology' | 'internalMedicine' | null)
  const [openClinic, setOpenClinic] = useState(DEFAULT_CLINIC);
  // openVisit: { visit, specialty } or null. specialty is needed to
  // resolve the briefing fixture lookup.
  const [openVisit, setOpenVisit] = useState(null);

  // ── User-facing handlers (also used by tour) ──
  const handleClinicToggle = useCallback((clinic) => {
    setOpenClinic((prev) => (prev === clinic ? null : clinic));
  }, []);
  const handleClinicOpen = useCallback((clinic) => {
    setOpenClinic(clinic);
  }, []);
  const handleClinicClose = useCallback(() => {
    setOpenClinic(null);
  }, []);
  const handleVisitOpen = useCallback((visit, specialty) => {
    if (!visit) return;
    setOpenVisit({ visit, specialty });
  }, []);
  const handleVisitClose = useCallback(() => {
    setOpenVisit(null);
  }, []);
  const handleResetDemo = useCallback(() => {
    setOpenClinic(DEFAULT_CLINIC);
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
              <ProviderTourLauncher />
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

      {/* Clinic nav + dropdowns. Unmounted while a card is open so the
          schedule never bleeds through. */}
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
          <ClinicNav
            openClinic={openClinic}
            schedules={SCHEDULES}
            onClinicToggle={handleClinicToggle}
            onClinicClose={handleClinicClose}
            onVisitOpen={handleVisitOpen}
          />
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
        openClinic={openClinic}
        openVisit={openVisit}
        schedules={SCHEDULES}
        onClinicOpen={handleClinicOpen}
        onClinicClose={handleClinicClose}
        onVisitOpen={handleVisitOpen}
        onVisitClose={handleVisitClose}
      />
    </>
  );
}
