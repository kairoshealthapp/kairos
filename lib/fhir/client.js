// Mock FHIR client. Returns FHIR R4 Bundle slices that match the shape Epic
// would return at the corresponding endpoints. Every method is async and
// returns a Promise so the swap to a real Epic client is internal — no caller
// changes.
//
// SWAP POINT: when Epic production is unblocked, replace each method's body
// with a fetch() against the OAuth-authenticated FHIR base URL. The return
// shape stays identical.
//
// Endpoint mapping (for the real client):
//   getPatient(id)                      -> GET  {base}/Patient/{id}
//   getEncounter(id)                    -> GET  {base}/Encounter/{id}
//   searchConditions(patientId)         -> GET  {base}/Condition?patient={id}
//   searchMedications(patientId)        -> GET  {base}/MedicationRequest?patient={id}
//   searchObservations(patientId, cat)  -> GET  {base}/Observation?patient={id}&category={cat}
//   searchDocumentReferences(pid, type) -> GET  {base}/DocumentReference?patient={id}&type={type}

import {
  getBundleForPatient,
  getBundleForEncounter,
} from "./mockData.js";
import { makeBundle, RESOURCE_TYPES } from "./schemas.js";

function entriesOfType(bundle, resourceType) {
  if (!bundle?.entry) return [];
  return bundle.entry.filter((e) => e.resource?.resourceType === resourceType);
}

function entryById(bundle, resourceType, id) {
  return entriesOfType(bundle, resourceType).find((e) => e.resource.id === id);
}

export const fhirClient = {
  async getPatient(id) {
    const bundle = getBundleForPatient(id);
    if (!bundle) return null;
    const entry = entryById(bundle, RESOURCE_TYPES.PATIENT, id);
    return entry ? entry.resource : null;
  },

  async getEncounter(id) {
    const bundle = getBundleForEncounter(id);
    if (!bundle) return null;
    const entry = entryById(bundle, RESOURCE_TYPES.ENCOUNTER, id);
    return entry ? entry.resource : null;
  },

  async searchConditions(patientId) {
    const bundle = getBundleForPatient(patientId);
    if (!bundle) return makeBundle([]);
    return makeBundle(entriesOfType(bundle, RESOURCE_TYPES.CONDITION));
  },

  async searchMedications(patientId) {
    const bundle = getBundleForPatient(patientId);
    if (!bundle) return makeBundle([]);
    return makeBundle(entriesOfType(bundle, RESOURCE_TYPES.MEDICATION_REQUEST));
  },

  async searchObservations(patientId, category) {
    const bundle = getBundleForPatient(patientId);
    if (!bundle) return makeBundle([]);
    let entries = entriesOfType(bundle, RESOURCE_TYPES.OBSERVATION);
    if (category) {
      entries = entries.filter((e) =>
        e.resource.category?.some((c) =>
          c.coding?.some((coding) => coding.code === category)
        )
      );
    }
    return makeBundle(entries);
  },

  async searchDocumentReferences(patientId, type) {
    const bundle = getBundleForPatient(patientId);
    if (!bundle) return makeBundle([]);
    let entries = entriesOfType(bundle, RESOURCE_TYPES.DOCUMENT_REFERENCE);
    if (type) {
      entries = entries.filter((e) =>
        e.resource.category?.some((c) =>
          c.coding?.some((coding) => coding.code === type)
        )
      );
    }
    return makeBundle(entries);
  },
};
