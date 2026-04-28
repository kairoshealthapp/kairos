// In-memory store for encounters created from faxes. The hardcoded
// ENCOUNTERS list in lib/fhir/encounters.js holds the v2-v5 demo set;
// this module holds anything created at runtime from the fax inbox so
// it can show up in the dashboard inbox without mutating that list.

let _encounters = [];

export function listFaxEncounters() {
  return [..._encounters];
}

export function appendFaxEncounter(encounter) {
  _encounters.push(encounter);
  return encounter;
}

export function getFaxEncounter(id) {
  return _encounters.find((e) => e.id === id) || null;
}
