// Referral Message primitive — high-volume noise suppression.
//
// Real Riverbend volume: ~108 referral messages per day, the vast majority
// pure receipt acknowledgments ("got it, will call patient"). The nurse's
// cognitive task here is not depth-per-item; it is triage at scale —
// identifying the ~10% that need a real response and dismissing the rest.
//
// Different shape than every other Kairos primitive:
// - encounters/investigations expect depth per item
// - referral messages expect speed per item
// The classifier is the architectural piece that makes the surface usable.

/**
 * @typedef {Object} ReferralMessage
 * @property {string} id
 * @property {string} senderName
 * @property {string} senderOrg
 * @property {string} subject
 * @property {string} body
 * @property {string} receivedAt
 * @property {string|null} patientId
 * @property {string|null} patientName
 * @property {ReferralClassification|null} classification
 * @property {'unclassified' | 'classified' | 'actioned' | 'dismissed'} status
 */

/**
 * @typedef {Object} ReferralClassification
 * @property {ReferralCategory} category
 * @property {number} confidence
 * @property {string} reasoning
 * @property {string|null} suggestedAction
 * @property {('patient_call_basket' | 'pt_advice_request' | 'rx_request' | 'scheduling' | 'provider_review')|null} routeTo
 * @property {string} classifiedAt
 * @property {string} classifierModel
 * @property {boolean} humanOverridden
 * @property {string|null} humanOverrideNote
 */

/**
 * @typedef {'informational_ack' | 'informational_appointment_confirmation' | 'informational_records_received' | 'actionable_scheduling' | 'actionable_clinical_question' | 'actionable_info_request' | 'actionable_referral_response_pending' | 'unable_to_classify'} ReferralCategory
 */

export const REFERRAL_CATEGORIES = [
  "informational_ack",
  "informational_appointment_confirmation",
  "informational_records_received",
  "actionable_scheduling",
  "actionable_clinical_question",
  "actionable_info_request",
  "actionable_referral_response_pending",
  "unable_to_classify",
];

export const ACTIONABLE_CATEGORIES = [
  "actionable_scheduling",
  "actionable_clinical_question",
  "actionable_info_request",
  "actionable_referral_response_pending",
];

export const INFORMATIONAL_CATEGORIES = [
  "informational_ack",
  "informational_appointment_confirmation",
  "informational_records_received",
];

const CATEGORY_LABELS = {
  informational_ack: "Receipt acknowledgment",
  informational_appointment_confirmation: "Appointment confirmation",
  informational_records_received: "Records received",
  actionable_scheduling: "Scheduling assistance",
  actionable_clinical_question: "Clinical question",
  actionable_info_request: "Info request",
  actionable_referral_response_pending: "Referral response pending",
  unable_to_classify: "Needs human review",
};

const ROUTE_LABELS = {
  patient_call_basket: "Patient Call basket",
  pt_advice_request: "Pt Advice Request",
  rx_request: "Rx Request",
  scheduling: "Scheduling",
  provider_review: "Provider review",
};

export function categoryLabel(category) {
  return CATEGORY_LABELS[category] || category;
}

export function routeLabel(route) {
  if (!route) return "—";
  return ROUTE_LABELS[route] || route;
}

export function isActionable(category) {
  return ACTIONABLE_CATEGORIES.includes(category);
}

export function isInformational(category) {
  return INFORMATIONAL_CATEGORIES.includes(category);
}

export function confidenceTone(confidence) {
  if (confidence == null) return "neutral";
  if (confidence >= 0.85) return "success";
  if (confidence >= 0.65) return "low";
  return "high";
}
