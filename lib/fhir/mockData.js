// Loads canonical mock FHIR Bundles from data/patients/*.json plus per-encounter
// supplementary structured data (e.g. home BP log) from data/encounters/*.json.
//
// This is a thin file-system reader. The shapes returned match Epic's FHIR
// R4 wire format exactly so the rest of the app can be written against the
// real-world response shape from day one.
//
// Add a new patient: drop another JSON file in data/patients/ and add it to
// PATIENT_FILES below. Add per-encounter supplementary data (BP logs, OCR'd
// fax content, kiosk pre-visit responses) to data/encounters/ and register
// it in ENCOUNTER_DATA.

import fs from "node:fs";
import path from "node:path";

const PATIENT_FILES = {
  // Encounter IDs map to the same bundle as the patient since Epic returns
  // the encounter's patient's full chart on $everything-style fetches.
  whitfield_sample_001: "whitfield.json",
  whitfield_encounter_001: "whitfield.json",

  marbury_sample_001: "marbury.json",
  marbury_encounter_001: "marbury.json",
  marbury_encounter_prior_001: "marbury.json",

  linnehan_sample_001: "linnehan.json",
  linnehan_encounter_001: "linnehan.json",
  linnehan_encounter_002: "linnehan.json",
  linnehan_encounter_003: "linnehan.json",

  hartwell_sample_001: "hartwell.json",
  hartwell_encounter_001: "hartwell.json",

  halberg_sample_001: "halberg.json",
  halberg_encounter_001: "halberg.json",
};

const ENCOUNTER_DATA = {
  marbury_encounter_001: { bpLog: "marbury_bp_log.json" },
};

const cache = new Map();

function loadJSON(relPath) {
  if (cache.has(relPath)) return cache.get(relPath);
  const filePath = path.join(process.cwd(), relPath);
  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = JSON.parse(raw);
  cache.set(relPath, parsed);
  return parsed;
}

function loadBundle(fileName) {
  return loadJSON(path.join("data", "patients", fileName));
}

export function getBundleForPatient(patientId) {
  const fileName = PATIENT_FILES[patientId];
  if (!fileName) return null;
  return loadBundle(fileName);
}

export function getBundleForEncounter(encounterId) {
  const fileName = PATIENT_FILES[encounterId];
  if (!fileName) return null;
  return loadBundle(fileName);
}

export function getEncounterSupplementary(encounterId) {
  const entry = ENCOUNTER_DATA[encounterId];
  if (!entry) return null;
  const result = {};
  if (entry.bpLog) {
    result.bpLog = loadJSON(path.join("data", "encounters", entry.bpLog));
  }
  return result;
}
