// Phase 3.3 — patient header strip for the encounter detail view.
// Renders patient identifiers + the MyChart status badge per per-box rule
// from lib/routing.js. Above the 4-pane grid.

"use client";

function statusLabel(s) {
  if (!s) return "Unknown";
  switch (s) {
    case "active":
      return "Active";
    case "active-recent":
      return "Active (recent)";
    case "stale":
      return "Active (stale)";
    case "pending":
      return "Pending";
    case "inactive":
      return "Inactive";
    case "none":
      return "None";
    default:
      return s;
  }
}

function statusTone(s) {
  if (s === "active" || s === "active-recent") return "text-sage";
  if (s === "stale") return "text-amber";
  return "text-bone-muted";
}

export default function PatientHeader({ fixture, route }) {
  const p = fixture.patient || {};
  const showBadge = route && route.badgeVisible;

  return (
    <div className="kairos-card p-4 mb-4 flex items-center justify-between gap-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-3 flex-wrap">
          <h1 className="kairos-display text-bone text-[20px] font-medium leading-tight tracking-tightest truncate">
            {p.name}
          </h1>
          <span className="kairos-data text-[12px] text-bone-muted">
            {p.age}
            {p.sex} · DOB {p.dob || "—"} · MRN {p.mrn || "—"}
          </span>
        </div>
        <div className="kairos-kicker text-bone-muted/80 mt-1">
          {p.primary || ""}
          {p.coverage ? <span className="ml-3">· {p.coverage}</span> : null}
          {p.proxyName ? (
            <span className="ml-3">· Proxy: {p.proxyName}</span>
          ) : null}
        </div>
      </div>
      {showBadge && (
        <div className="shrink-0 text-right">
          <div className="kairos-kicker text-bone-muted/70">MyChart</div>
          <div className={`text-[12px] font-medium ${statusTone(fixture.mychartStatus)}`}>
            {statusLabel(fixture.mychartStatus)}
          </div>
        </div>
      )}
    </div>
  );
}
