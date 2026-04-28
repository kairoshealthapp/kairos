// FHIR R4 resource shape helpers. These describe the slices of Epic FHIR responses
// that Kairos consumes. They are not validators — Epic is the source of truth on
// the wire. They exist so callers (and reviewers) can see what a "Bundle slice"
// returned by the FHIR client looks like without grepping through Epic docs.
//
// When the live Epic client is wired in, these shapes do not change. The mock
// returns a Bundle, the real client returns a Bundle, both match Epic's R4.

export const FHIR_BUNDLE = {
  resourceType: "Bundle",
  type: "searchset",
  total: 0,
  entry: [],
};

export const RESOURCE_TYPES = {
  PATIENT: "Patient",
  ENCOUNTER: "Encounter",
  CONDITION: "Condition",
  MEDICATION_REQUEST: "MedicationRequest",
  OBSERVATION: "Observation",
  DOCUMENT_REFERENCE: "DocumentReference",
  ALLERGY_INTOLERANCE: "AllergyIntolerance",
  DIAGNOSTIC_REPORT: "DiagnosticReport",
  SERVICE_REQUEST: "ServiceRequest",
};

export const OBSERVATION_CATEGORIES = {
  VITAL_SIGNS: "vital-signs",
  LABORATORY: "laboratory",
  CORE_CHARACTERISTICS: "core-characteristics",
};

export const DOCUMENT_TYPES = {
  CLINICAL_NOTE: "LP173421-1",
  CORRESPONDENCE: "LP173441-9",
};

export function makeBundle(entries) {
  return {
    resourceType: "Bundle",
    type: "searchset",
    total: entries.length,
    entry: entries,
  };
}
