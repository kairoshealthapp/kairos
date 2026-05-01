// Phase 3.2-fix6 + Phase 3.3 + Phase 3.4 — adapted from
// firekraker-monorepo/kairos.
//
// Phase 3.3: click → router.push('/encounter/{id}?tab={tab}'). Card itself
// is the navigation affordance.
// Phase 3.4: dropped severity dots; only urgent cards show a red filled
// triangle with white "!" — the universal urgency icon. Everything else
// renders without an icon for a cleaner board.
// Phase 3.4 (later pass): card pulses with the same amber border + 1.5s
// opacity oscillation as action buttons when the active tour beat carries
// `targetCard: <patient.id>`. Lets the dashboard surface follow the
// narration ("Mr. Aldington…") without the viewer hunting for the card.

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function UrgentTriangle() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      aria-hidden="true"
      className="shrink-0"
      style={{ marginTop: 2 }}
    >
      <polygon
        points="7,0.5 13.5,12.5 0.5,12.5"
        fill="var(--kairos-oxblood)"
      />
      <text
        x="7"
        y="11"
        textAnchor="middle"
        fontSize="9"
        fontWeight="700"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        fill="#FFFFFF"
      >
        !
      </text>
    </svg>
  );
}

export default function PatientCard({ patient, label, fromTab }) {
  const router = useRouter();
  const [pulsing, setPulsing] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    function onBeatStart(e) {
      const tc = e && e.detail && e.detail.targetCard;
      setPulsing(!!tc && tc === patient.id);
    }
    function clear() {
      setPulsing(false);
    }
    window.addEventListener("kairos-tour:beat-start", onBeatStart);
    window.addEventListener("kairos-tour:beat-end", clear);
    window.addEventListener("kairos-tour:end", clear);
    return () => {
      window.removeEventListener("kairos-tour:beat-start", onBeatStart);
      window.removeEventListener("kairos-tour:beat-end", clear);
      window.removeEventListener("kairos-tour:end", clear);
    };
  }, [patient.id]);

  function handleClick() {
    const q = fromTab ? `?tab=${encodeURIComponent(fromTab)}` : "";
    router.push(`/encounter/${patient.id}${q}`);
  }
  function handleKey(e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  }

  return (
    <button
      type="button"
      className="block w-full text-left h-full"
      onClick={handleClick}
      onKeyDown={handleKey}
      aria-label={`Open encounter for ${patient.name}`}
    >
      <div
        data-encounter-id={patient.id}
        className={
          "kairos-card kairos-card-hover p-4 h-full flex flex-col" +
          (pulsing ? " kairos-action-pulse" : "")
        }
      >
        <div className="flex items-start gap-2">
          {patient.urgent ? <UrgentTriangle /> : null}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="kairos-display text-bone text-[18px] font-medium leading-tight truncate">
                {patient.name}
              </h3>
              <span className="kairos-data text-[11px] text-bone-muted shrink-0">
                {patient.age}
                {patient.sex}
              </span>
            </div>
            {label && (
              <div className="kairos-kicker text-amber/80 mt-1">{label}</div>
            )}
            <p className="text-[13px] text-bone-muted mt-2 leading-relaxed line-clamp-2">
              {patient.reasonForColumn || patient.issueLine}
            </p>
          </div>
        </div>
      </div>
    </button>
  );
}
