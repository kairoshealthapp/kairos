// /provider — clinic dropdown menu. Shows the clinic's patient list as
// vertical rows beneath the active clinic button. Solid #0B0E13
// background. Each row is a tour-targetable element via
// data-encounter-id. Click a row → opens the patient card.

"use client";

function PatientRow({ visit, onSelect }) {
  const isPostHospital = visit.isPostHospital;
  return (
    <button
      type="button"
      data-encounter-id={visit.id}
      data-tour-card={visit.id}
      data-post-hospital={isPostHospital ? "true" : "false"}
      onClick={() => onSelect(visit)}
      className={
        "group relative w-full text-left flex items-center gap-3 px-4 py-2.5 " +
        "hover:bg-platinum/40 transition-colors focus:outline-none " +
        "focus:bg-platinum/40 border-b border-mist/20 last:border-b-0"
      }
    >
      {isPostHospital && (
        <span
          aria-hidden="true"
          className="absolute left-0 top-0 bottom-0 w-[2px] bg-amber"
        />
      )}
      <div className="kairos-data text-[13px] text-bone font-medium tabular-nums w-[68px] shrink-0">
        {visit.time}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] text-bone font-medium truncate">
          {visit.name}
          <span className="text-bone-muted font-normal ml-1.5 text-[12px]">
            · {visit.age}{visit.sex}
          </span>
        </div>
        {visit.context && (
          <div className="text-[11px] text-bone-muted mt-0.5 truncate">
            {visit.visitType} · {visit.context}
          </div>
        )}
        {!visit.context && (
          <div className="text-[11px] text-bone-muted mt-0.5 truncate">
            {visit.visitType}
          </div>
        )}
      </div>
    </button>
  );
}

export default function ClinicDropdown({ schedule, onSelect }) {
  return (
    <div
      role="menu"
      data-tour-anchor="clinic-dropdown"
      style={{ backgroundColor: "#0B0E13" }}
      className={
        "absolute left-0 top-full mt-1 z-40 w-[420px] max-h-[70vh] " +
        "overflow-y-auto border border-mist/60 rounded-md shadow-2xl"
      }
    >
      {schedule.map((visit) => (
        <PatientRow key={visit.id} visit={visit} onSelect={onSelect} />
      ))}
    </div>
  );
}
