// Cohort snapshot computation. v4 implementation is essentially a passthrough
// because the seed JSON already encodes per-member flags; the function exists
// so the eventual real implementation has a clear interface (FHIR query →
// rule application → flagged member list).

/**
 * @param {import('../types/cohort.js').CohortMember[]} members
 * @returns {import('../types/cohort.js').CohortSnapshot}
 */
export function computeINRReminderSnapshot(members) {
  const list = Array.isArray(members) ? members : [];
  const summary = {
    totalCount: list.length,
    overdueCount: 0,
    driftCount: 0,
    unseenCount: 0,
    stableCount: 0,
  };
  for (const m of list) {
    const flags = new Set(m.flags || []);
    if (flags.has("overdue")) summary.overdueCount += 1;
    if (flags.has("drift")) summary.driftCount += 1;
    if (flags.has("unseen")) summary.unseenCount += 1;
    if (flags.has("stable")) summary.stableCount += 1;
  }
  return {
    definitionId: "inr_reminder",
    computedAt: new Date().toISOString(),
    members: list,
    summary,
  };
}
