// Prior Authorization primitive — multi-stage persistent object with required
// transitions and artifacts per stage. Demonstrates the state-machine
// workflow primitive: the PA itself is the durable object, encounters are
// just touchpoints when the PA crosses the inbox.
//
// Allowed transitions:
//   submitted          → insurance_review
//   insurance_review   → approved | denied | info_requested
//   info_requested     → insurance_review (after info supplied)
//   denied             → appealing | closed
//   appealing          → approved | denied
//   approved           → medication_dispensed
//   medication_dispensed → closed
//
// Closed is terminal. Any transition not listed above is illegal — the
// helpers below enforce that invariant.

/**
 * @typedef {Object} PriorAuthRequest
 * @property {string} id
 * @property {string} patientId
 * @property {string} medicationName
 * @property {string} indication
 * @property {string} prescribingProvider
 * @property {string} insurancePlan
 * @property {string} pharmacy
 * @property {PriorAuthStage} currentStage
 * @property {PriorAuthStageEntry[]} stageHistory
 * @property {string} createdAt
 * @property {string} lastUpdatedAt
 * @property {Object} latestPatientCommunication
 */

/**
 * @typedef {'submitted' | 'insurance_review' | 'info_requested' | 'approved' | 'denied' | 'appealing' | 'medication_dispensed' | 'closed'} PriorAuthStage
 */

/**
 * @typedef {Object} PriorAuthStageEntry
 * @property {string} id
 * @property {PriorAuthStage} stage
 * @property {string} enteredAt
 * @property {string} actor
 * @property {string} note
 * @property {{ type: string, summary: string }[]} artifacts
 */

export const PA_STAGES = [
  "submitted",
  "insurance_review",
  "info_requested",
  "approved",
  "denied",
  "appealing",
  "medication_dispensed",
  "closed",
];

const ALLOWED_TRANSITIONS = {
  submitted: ["insurance_review"],
  insurance_review: ["approved", "denied", "info_requested"],
  info_requested: ["insurance_review"],
  denied: ["appealing", "closed"],
  appealing: ["approved", "denied"],
  approved: ["medication_dispensed"],
  medication_dispensed: ["closed"],
  closed: [],
};

const STAGE_LABEL = {
  submitted: "Submitted",
  insurance_review: "Insurance review",
  info_requested: "Info requested",
  approved: "Approved",
  denied: "Denied",
  appealing: "Appealing",
  medication_dispensed: "Dispensed",
  closed: "Closed",
};

const STAGE_TONE = {
  submitted: "amber",
  insurance_review: "amber",
  info_requested: "amber",
  approved: "green",
  denied: "red",
  appealing: "purple",
  medication_dispensed: "green",
  closed: "neutral",
};

// Canonical visual order for the progress-bar step indicator. The history
// will follow this order; appeal loops are rendered as branching back into
// insurance_review or appealing.
export const PA_DISPLAY_ORDER = [
  "submitted",
  "insurance_review",
  "info_requested",
  "appealing",
  "approved",
  "denied",
  "medication_dispensed",
  "closed",
];

export function stageLabel(stage) {
  return STAGE_LABEL[stage] || stage;
}

export function stageTone(stage) {
  return STAGE_TONE[stage] || "neutral";
}

export function allowedNextStages(stage) {
  return ALLOWED_TRANSITIONS[stage] || [];
}

export function isTransitionAllowed(from, to) {
  return (ALLOWED_TRANSITIONS[from] || []).includes(to);
}

/**
 * Append a stage transition. Returns a new PriorAuthRequest. Throws if the
 * transition is illegal so callers fail loudly during demo wiring.
 */
export function advanceStage(pa, { stage, actor, note, artifacts }) {
  if (!isTransitionAllowed(pa.currentStage, stage)) {
    throw new Error(
      `Illegal PA transition: ${pa.currentStage} → ${stage}`
    );
  }
  const entry = {
    id: `pa_evt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    stage,
    enteredAt: new Date().toISOString(),
    actor: actor || "nurse",
    note: note || "",
    artifacts: artifacts || [],
  };
  return {
    ...pa,
    currentStage: stage,
    stageHistory: [...pa.stageHistory, entry],
    lastUpdatedAt: entry.enteredAt,
  };
}

export function summarizeStageHistory(pa) {
  return {
    totalStages: pa.stageHistory.length,
    daysActive: Math.max(
      1,
      Math.round(
        (Date.now() - new Date(pa.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      )
    ),
  };
}
