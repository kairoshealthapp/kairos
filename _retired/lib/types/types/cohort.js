// Cohort primitive — proactive surveillance over a patient population that
// meets clinical criteria. Fundamentally different from Encounter (a single
// inbox event) or Investigation (a thread spanning encounters): a cohort is
// a *population* surfaced on a recurring schedule.
//
// In v4 the cohort is in-memory and seeded from data/cohorts/*.json. The
// cohort definition is the rule (criteria + cadence + ownership); a snapshot
// is the cohort definition applied to a point in time, producing a member
// list. Real production: snapshots are recomputed on a cron + invalidated
// when underlying labs/encounters change. v4: snapshots are loaded from
// seed JSON and held in-memory for the process lifetime.

/**
 * @typedef {Object} CohortDefinition
 * @property {string} id
 * @property {string} name
 * @property {string} clinicalRationale - why this cohort exists in one line
 * @property {string} criteriaDescription - human-readable inclusion rule
 * @property {'nurse' | 'provider' | 'pharmacist'} ownedBy
 * @property {number} reviewCadenceDays - how often this cohort should be reviewed
 */

/**
 * @typedef {Object} CohortMember
 * @property {string} patientId
 * @property {string} patientName
 * @property {string} ageSex - "71M", "68F"
 * @property {Object} keyData - cohort-specific fields (lastINR, daysOverdue, trend, etc.)
 * @property {('overdue' | 'drift' | 'unseen' | 'stable')[]} flags
 * @property {number} priorityScore - 0–100, sortable
 * @property {string|null} lastReviewedAt - ISO timestamp or null
 */

/**
 * @typedef {Object} CohortSnapshot
 * @property {string} definitionId
 * @property {string} computedAt - ISO timestamp
 * @property {CohortMember[]} members
 * @property {{
 *   totalCount: number,
 *   overdueCount: number,
 *   driftCount: number,
 *   unseenCount: number,
 *   stableCount: number,
 * }} summary
 */

export const COHORT_FLAGS = ["overdue", "drift", "unseen", "stable"];

/**
 * Sort comparator: highest priorityScore first; ties broken by daysOverdue
 * descending; further ties by patient name ascending.
 */
export function priorityComparator(a, b) {
  const ps = (b.priorityScore || 0) - (a.priorityScore || 0);
  if (ps !== 0) return ps;
  const da = a.keyData?.daysOverdue ?? -Infinity;
  const db = b.keyData?.daysOverdue ?? -Infinity;
  if (db !== da) return db - da;
  return String(a.patientName || "").localeCompare(String(b.patientName || ""));
}

/**
 * Group members by their first/primary flag. A member with multiple flags is
 * counted under each flag bucket so the UI can show overlap correctly.
 *
 * @param {CohortMember[]} members
 * @returns {{ overdue: CohortMember[], drift: CohortMember[], unseen: CohortMember[], stable: CohortMember[] }}
 */
export function groupByFlag(members) {
  const out = { overdue: [], drift: [], unseen: [], stable: [] };
  for (const m of members || []) {
    for (const f of m.flags || []) {
      if (out[f]) out[f].push(m);
    }
  }
  return out;
}
