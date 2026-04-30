// Phase 3.3 — investigation object types + transition validators ONLY.
// No live state machine in 3.3. Wired in 3.4 for Pattern 7b and v1.5 for
// Pattern 13. Source: docs/PHASE-3.3-DESIGN.md Section 6.

export const INVESTIGATION_STATES = [
  "NEW",
  "AWAITING_NURSE",
  "IN_PROGRESS",
  "AWAITING_PATIENT",
  "REPLY_RECEIVED",
  "AWAITING_PROVIDER",
  "PROVIDER_PLAN",
  "CALLBACK_PENDING",
  "SIGNED",
  "CLOSED",
  "DEFERRED",
  "HOLD",
  "ESCALATED",
  "AUTO_CLEARED",
];

const TRANSITIONS = {
  NEW: ["AWAITING_NURSE"],
  AWAITING_NURSE: ["IN_PROGRESS", "DEFERRED", "HOLD"],
  IN_PROGRESS: [
    "AWAITING_PATIENT",
    "AWAITING_PROVIDER",
    "DEFERRED",
    "HOLD",
    "SIGNED",
  ],
  AWAITING_PATIENT: ["REPLY_RECEIVED", "ESCALATED", "DEFERRED"],
  REPLY_RECEIVED: ["AWAITING_PROVIDER", "ESCALATED", "DEFERRED"],
  AWAITING_PROVIDER: ["PROVIDER_PLAN", "DEFERRED"],
  PROVIDER_PLAN: ["CALLBACK_PENDING", "SIGNED"],
  CALLBACK_PENDING: ["SIGNED", "ESCALATED"],
  SIGNED: ["CLOSED"],
  CLOSED: [],
  DEFERRED: ["AWAITING_NURSE", "IN_PROGRESS"],
  HOLD: ["IN_PROGRESS", "AWAITING_PROVIDER"],
  ESCALATED: ["IN_PROGRESS", "CALLBACK_PENDING"],
  AUTO_CLEARED: ["CLOSED"],
};

export const PATTERN_7B_LIFECYCLE = [
  "PHONE_INBOUND",
  "CHART_CONTEXT_PULL",
  "SBAR_DRAFT_INITIAL",
  "PATIENT_CALL_1",
  "SBAR_REGENERATION",
  "PROVIDER_REVIEW",
  "PROVIDER_PLAN_RECEIVED",
  "CALLBACK_NOTE_SYNTHESIS",
];

export function isValidTransition(from, to) {
  if (!TRANSITIONS[from]) return false;
  return TRANSITIONS[from].includes(to);
}

export function makeInvestigation(seed = {}) {
  return {
    investigationId:
      seed.investigationId ||
      `inv-${Math.random().toString(36).slice(2, 10)}`,
    patientId: seed.patientId || null,
    patternId: seed.patternId || null,
    state: seed.state || "NEW",
    encounterIds: seed.encounterIds || [],
    orderChain: seed.orderChain || [],
    threadIds: seed.threadIds || [],
    noteRefs: seed.noteRefs || [],
    clinicalQuestion: seed.clinicalQuestion || "",
    authState: seed.authState || null,
    channelHistory: seed.channelHistory || [],
    createdAt: seed.createdAt || new Date().toISOString(),
    lastTouchedAt: seed.lastTouchedAt || new Date().toISOString(),
    windowOpen: seed.windowOpen !== undefined ? seed.windowOpen : true,
  };
}
