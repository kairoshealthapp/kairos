// /provider — persistent 3-clinic dropdown header. Each button is a
// dropdown trigger; clicking opens the clinic's patient list below.
// Click outside or on the same button to close. Tour-driven and
// user-driven interactions go through the same callbacks.

"use client";

import { useEffect, useRef } from "react";
import ClinicDropdown from "./ClinicDropdown";

const CLINICS = [
  { key: "cardiology", label: "Cardiology" },
  { key: "pulmonology", label: "Pulmonology" },
  { key: "internalMedicine", label: "Internal Medicine" },
];

function CaretIcon({ open }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={
        "shrink-0 transition-transform " + (open ? "rotate-180" : "")
      }
      aria-hidden="true"
    >
      <polyline points="2,4 6,8 10,4" />
    </svg>
  );
}

export default function ClinicNav({
  openClinic,
  schedules,
  onClinicToggle,
  onClinicClose,
  onVisitOpen,
}) {
  const navRef = useRef(null);

  // Click-outside handler — closes any open dropdown.
  useEffect(() => {
    if (!openClinic) return undefined;
    function onDocClick(e) {
      if (!navRef.current) return;
      if (!navRef.current.contains(e.target)) onClinicClose();
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [openClinic, onClinicClose]);

  return (
    <div
      ref={navRef}
      data-tour-anchor="clinic-nav"
      className="relative flex items-center gap-2 mb-6"
    >
      {CLINICS.map((c) => {
        const open = openClinic === c.key;
        const schedule = schedules[c.key] || [];
        return (
          <div key={c.key} className="relative">
            <button
              type="button"
              data-clinic={c.key}
              data-tour-anchor={`clinic-button-${c.key}`}
              aria-haspopup="menu"
              aria-expanded={open}
              onClick={() => onClinicToggle(c.key)}
              className={
                "flex items-center gap-2 px-4 py-2 text-[13px] font-medium " +
                "rounded-md border transition-colors " +
                (open
                  ? "bg-amber text-graphite border-amber"
                  : "text-bone bg-platinum/40 border-mist/60 hover:bg-platinum/60")
              }
            >
              <span>{c.label}</span>
              <CaretIcon open={open} />
            </button>
            {open && (
              <ClinicDropdown schedule={schedule} onSelect={(visit) => onVisitOpen(visit, c.key)} />
            )}
          </div>
        );
      })}
    </div>
  );
}
