// Investigation primitive — the unifying object that links touchpoints across
// time and across Epic buckets. An investigation is a single clinical thread:
// the lab result that started it, the SecureChat thread with the home health
// RN, the patient call that confirmed adherence, the recheck encounter that
// reopened it. Encounters belong to investigations; investigations belong to
// patients.
//
// In v3 this is in-memory state (lib/state/investigations.js). The Supabase
// migration is deferred — when it lands, only the storage module changes,
// these helpers stay identical.

/**
 * @typedef {Object} Investigation
 * @property {string} id - uuid (or `investigation_<slug>` for seeded ones)
 * @property {string} patientId
 * @property {string} title - human-readable thread title
 * @property {string} clinicalConcern - short summary
 * @property {string} createdAt - ISO timestamp of first touchpoint
 * @property {string} lastActivityAt - ISO timestamp of most recent touchpoint
 * @property {'open' | 'pending_patient' | 'pending_provider' | 'closed'} status
 * @property {InvestigationTouchpoint[]} touchpoints - chronological events
 */

/**
 * @typedef {Object} InvestigationTouchpoint
 * @property {string} id - uuid
 * @property {'encounter' | 'evidence' | 'sbar' | 'secure_chat' | 'mychart_outbound' | 'mychart_inbound' | 'result_note' | 'lab_result'} kind
 * @property {string} bucket - which Epic bucket this lives in
 * @property {string} occurredAt - ISO timestamp
 * @property {string} summary - one-line description
 * @property {Object} data - kind-specific payload
 * @property {string} sourceActor - 'nurse' | 'patient' | 'provider' | 'outside_clinician' | 'system'
 * @property {string} [sourceDetail] - optional context (e.g. "Amanda Trahan, home health RN")
 */

export const INVESTIGATION_STATUSES = ["open", "pending_patient", "pending_provider", "closed"];

export const TOUCHPOINT_KINDS = [
  "encounter",
  "evidence",
  "sbar",
  "secure_chat",
  "mychart_outbound",
  "mychart_inbound",
  "result_note",
  "lab_result",
];

/**
 * Append a touchpoint chronologically (sorted by occurredAt). Returns a new
 * investigation object — pure, never mutates input. Updates lastActivityAt
 * to the latest occurredAt across all touchpoints.
 */
export function addTouchpoint(investigation, touchpoint) {
  const touchpoints = [...investigation.touchpoints, touchpoint].sort((a, b) =>
    String(a.occurredAt).localeCompare(String(b.occurredAt))
  );
  const lastActivityAt = touchpoints[touchpoints.length - 1].occurredAt;
  return { ...investigation, touchpoints, lastActivityAt };
}

/**
 * Find the investigation that contains the given encounterId in any of its
 * encounter touchpoints. Returns null if none match.
 */
export function findInvestigationForEncounter(investigations, encounterId) {
  if (!encounterId) return null;
  for (const inv of investigations || []) {
    for (const tp of inv.touchpoints || []) {
      if (tp.kind === "encounter" && tp.data?.encounterId === encounterId) {
        return inv;
      }
    }
  }
  return null;
}

/**
 * Add an encounter touchpoint to an existing investigation. No-op (returns
 * unchanged) if the encounter is already linked.
 */
export function linkEncounterToInvestigation(investigations, encounterId, investigationId) {
  return (investigations || []).map((inv) => {
    if (inv.id !== investigationId) return inv;
    const already = inv.touchpoints.some(
      (tp) => tp.kind === "encounter" && tp.data?.encounterId === encounterId
    );
    if (already) return inv;
    return addTouchpoint(inv, {
      id: crypto.randomUUID(),
      kind: "encounter",
      bucket: "patient_call",
      occurredAt: new Date().toISOString(),
      summary: `Encounter ${encounterId} linked`,
      sourceActor: "nurse",
      data: { encounterId },
    });
  });
}

/**
 * Display-friendly summary of an investigation. Fed to the timeline header
 * stats row and the dashboard badge.
 *
 * @returns {{
 *   touchpointCount: number,
 *   bucketsTouched: string[],
 *   daySpan: number,
 *   sourcesTouched: string[],
 * }}
 */
export function summarizeInvestigation(investigation) {
  const tps = investigation?.touchpoints || [];
  const bucketsTouched = Array.from(new Set(tps.map((t) => t.bucket).filter(Boolean)));
  const sourcesTouched = Array.from(new Set(tps.map((t) => t.sourceActor).filter(Boolean)));
  let daySpan = 0;
  if (tps.length > 1) {
    const sorted = [...tps].sort((a, b) =>
      String(a.occurredAt).localeCompare(String(b.occurredAt))
    );
    const first = new Date(sorted[0].occurredAt).getTime();
    const last = new Date(sorted[sorted.length - 1].occurredAt).getTime();
    daySpan = Math.max(1, Math.ceil((last - first) / (1000 * 60 * 60 * 24)));
  } else if (tps.length === 1) {
    daySpan = 1;
  }
  return {
    touchpointCount: tps.length,
    bucketsTouched,
    daySpan,
    sourcesTouched,
  };
}
