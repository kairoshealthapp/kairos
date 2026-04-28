// Pre-visit task primitive — the temporal phase BEFORE an encounter.
//
// In production the inputs come from MyChart pre-visit task forms, kiosk
// tablets at rooming, OCR of paper intake forms, or phone intake notes. v5
// mocks the input — the data has already arrived. The primitive is the
// container that holds patient-reported state captured BEFORE the patient
// is roomed.
//
// Why a separate primitive? Encounters live in Epic's encounter table; pre-
// visit tasks live in a different table on a different temporal phase. They
// link to an upcoming encounter (foreign key) but their lifecycle is its
// own: submitted → reviewed_by_ma → flagged_to_nurse → closed.

/**
 * @typedef {Object} PreVisitTask
 * @property {string} id
 * @property {string} patientId
 * @property {string} appointmentDate - ISO timestamp of upcoming encounter
 * @property {'mychart_form' | 'kiosk_tablet' | 'paper_ocr' | 'phone_intake'} captureMethod
 * @property {string} capturedAt - when patient submitted the response
 * @property {'pending' | 'submitted' | 'reviewed_by_ma' | 'flagged_to_nurse' | 'closed'} status
 * @property {PatientReportedMed[]} patientReportedMeds
 * @property {string} patientNotes - free-text additions from the patient
 */

/**
 * @typedef {Object} PatientReportedMed
 * @property {string} id
 * @property {string} reportedName - what the patient called it (brand vs generic)
 * @property {string} reportedDose
 * @property {string} reportedFrequency
 * @property {boolean} stillTaking - patient confirms active use
 * @property {string} reportedReason - patient's understanding of the indication
 * @property {string|null} matchedRxNorm - resolved generic name, null if unmatched
 * @property {string|null} matchedEpicMedId - link to the Epic med list entry, null if patient added a med Epic doesn't have
 */

/**
 * @typedef {Object} Discrepancy
 * @property {string} id
 * @property {'dose_mismatch' | 'frequency_mismatch' | 'patient_added' | 'patient_dropped' | 'duplicate_class' | 'drug_interaction' | 'unknown_to_patient'} kind
 * @property {'low' | 'medium' | 'high'} severity
 * @property {string} epicMedDescription - what's in Epic (or null for patient_added)
 * @property {string|null} patientReportedDescription - what the patient said (null for patient_dropped)
 * @property {string} clinicalNote - one-line context
 * @property {DiscrepancyResolution|null} resolution - null while unresolved
 */

/**
 * @typedef {Object} DiscrepancyResolution
 * @property {'dismissed' | 'escalated' | 'updated'} action
 * @property {string} actor - 'ma_id' or 'nurse_id'
 * @property {string} reason
 * @property {string} timestamp
 */

/**
 * @typedef {Object} AttestationLog
 * @property {string} id
 * @property {string} taskId
 * @property {string} actor - 'ma_id' or 'nurse_id'
 * @property {'MA' | 'RN'} actorRole
 * @property {'medications_reviewed' | 'allergies_reviewed' | 'history_reviewed'} clickType
 * @property {string} clickedAt - ISO timestamp
 * @property {boolean} earned - true if all discrepancies were resolved before this click
 * @property {number} discrepancyCount - total at click time
 * @property {number} unresolvedCount - remaining at click time
 * @property {string} patientId - denormalized for the personal log surface
 * @property {string} patientName - denormalized for display
 * @property {string} encounterId - originating encounter id
 */

export const DISCREPANCY_KINDS = [
  "dose_mismatch",
  "frequency_mismatch",
  "patient_added",
  "patient_dropped",
  "duplicate_class",
  "drug_interaction",
  "unknown_to_patient",
];

export const DISCREPANCY_SEVERITIES = ["low", "medium", "high"];

export const ATTESTATION_CLICK_TYPES = [
  "medications_reviewed",
  "allergies_reviewed",
  "history_reviewed",
];

const DISCREPANCY_KIND_LABEL = {
  dose_mismatch: "Dose mismatch",
  frequency_mismatch: "Frequency mismatch",
  patient_added: "Patient added",
  patient_dropped: "Patient stopped",
  duplicate_class: "Duplicate class",
  drug_interaction: "Drug interaction",
  unknown_to_patient: "Unknown to patient",
};

const SEVERITY_RANK = { high: 0, medium: 1, low: 2 };

export function discrepancyKindLabel(kind) {
  return DISCREPANCY_KIND_LABEL[kind] || kind;
}

export function discrepancyComparator(a, b) {
  const sr = (SEVERITY_RANK[a.severity] ?? 99) - (SEVERITY_RANK[b.severity] ?? 99);
  if (sr !== 0) return sr;
  // Resolved items sink to the bottom within the same severity.
  const ra = a.resolution ? 1 : 0;
  const rb = b.resolution ? 1 : 0;
  if (ra !== rb) return ra - rb;
  return String(a.kind).localeCompare(String(b.kind));
}

export function countUnresolved(discrepancies) {
  return (discrepancies || []).filter((d) => !d.resolution).length;
}
