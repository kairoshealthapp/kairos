// IncomingFax primitive — analog ingestion (OCR + match resolution).
//
// The "rescue from paper" pitch surface. Real Riverbend home INR fax volume
// is 5-10/day, fully manual today: front desk pulls from fax tray, walks
// paper to nurse, nurse manually creates Anticoagulation Visit encounter,
// types result + history. v6 mocks the OCR — assume the extraction step has
// already happened and the model output (with confidence + bbox) is the
// input to this primitive.

/**
 * @typedef {Object} IncomingFax
 * @property {string} id
 * @property {string} receivedAt
 * @property {'home_inr' | 'outside_records' | 'lab_result' | 'unknown'} faxType
 * @property {string} senderHeader
 * @property {number} pageCount
 * @property {string} previewUrl
 * @property {ExtractedField[]} extractedFields
 * @property {PatientMatchCandidate[]} matchCandidates
 * @property {string|null} resolvedPatientId
 * @property {'awaiting_review' | 'auto_matched' | 'human_matched' | 'rejected' | 'processed'} status
 * @property {string|null} processedEncounterId
 */

/**
 * @typedef {Object} ExtractedField
 * @property {'patient_name' | 'patient_dob' | 'patient_mrn' | 'inr_value' | 'inr_draw_date' | 'ordering_provider' | 'lab_facility' | 'note'} fieldName
 * @property {string} extractedValue
 * @property {number} confidence
 * @property {string} bbox
 */

/**
 * @typedef {Object} PatientMatchCandidate
 * @property {string} patientId
 * @property {string} patientName
 * @property {string} dob
 * @property {string|null} mrn
 * @property {number} matchScore
 * @property {string[]} matchSignals
 * @property {string[]} mismatchSignals
 * @property {boolean} requiresHumanConfirmation
 */

export const FAX_TYPES = ["home_inr", "outside_records", "lab_result", "unknown"];

export const FAX_STATUSES = [
  "awaiting_review",
  "auto_matched",
  "human_matched",
  "rejected",
  "processed",
];

const FAX_TYPE_LABELS = {
  home_inr: "Home INR",
  outside_records: "Outside Records",
  lab_result: "Lab Result",
  unknown: "Unknown",
};

const FAX_STATUS_LABELS = {
  awaiting_review: "Awaiting review",
  auto_matched: "Auto-matched",
  human_matched: "Manually matched",
  rejected: "Rejected",
  processed: "Processed",
};

const FIELD_LABELS = {
  patient_name: "Patient name",
  patient_dob: "Date of birth",
  patient_mrn: "MRN",
  inr_value: "INR",
  inr_draw_date: "Draw date",
  ordering_provider: "Ordering provider",
  lab_facility: "Lab facility",
  note: "Note",
};

const MATCH_SIGNAL_LABELS = {
  exact_name: "Name match",
  mrn_match: "MRN match",
  dob_match: "DOB match",
  name_phonetic: "Phonetic name",
  name_partial: "Partial name",
  dob_mismatch: "DOB mismatch",
  name_variant: "Name variant",
};

export function faxTypeLabel(t) {
  return FAX_TYPE_LABELS[t] || t;
}

export function faxStatusLabel(s) {
  return FAX_STATUS_LABELS[s] || s;
}

export function fieldLabel(f) {
  return FIELD_LABELS[f] || f;
}

export function matchSignalLabel(s) {
  return MATCH_SIGNAL_LABELS[s] || s;
}

export function confidenceTone(confidence) {
  if (confidence == null) return "neutral";
  if (confidence >= 0.9) return "success";
  if (confidence >= 0.75) return "low";
  return "high";
}
