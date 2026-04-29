// Protocol applier — takes a protocol definition + a patient FHIR Bundle and
// returns a per-medication schedule (action, timing, resume, rationale).
// v4 uses a hardcoded generic-name → drug-class map (~30 common cardiac and
// HTN agents). Production: swap in RxNorm class lookups.
//
// The Halberg case is the architectural proof point: Clonidine, a centrally-
// acting alpha agonist, is the easily-overlooked med that the human-only
// workflow misses. The protocol catches it because the rule is data, not
// memory.

import fs from "node:fs";
import path from "node:path";

let _protocols = null;

function loadProtocols() {
  if (_protocols) return _protocols;
  const fp = path.join(process.cwd(), "data", "protocols", "protocols.json");
  if (!fs.existsSync(fp)) {
    _protocols = [];
    return _protocols;
  }
  _protocols = JSON.parse(fs.readFileSync(fp, "utf8"));
  return _protocols;
}

export function getProtocol(id) {
  return loadProtocols().find((p) => p.id === id) || null;
}

// Hardcoded generic-name → drug class map. Lowercase keys, lowercase classes.
// Production swap: RxNorm-driven class hierarchy lookup.
const DRUG_CLASS_MAP = {
  // beta blockers
  metoprolol: "beta_blocker",
  atenolol: "beta_blocker",
  carvedilol: "beta_blocker",
  bisoprolol: "beta_blocker",
  propranolol: "beta_blocker",
  nadolol: "beta_blocker",
  labetalol: "beta_blocker",
  // CCB non-DHP
  diltiazem: "ccb_non_dhp",
  verapamil: "ccb_non_dhp",
  // CCB DHP
  amlodipine: "ccb_dhp",
  nifedipine: "ccb_dhp",
  // central alpha agonists
  clonidine: "central_alpha_agonist",
  methyldopa: "central_alpha_agonist",
  guanfacine: "central_alpha_agonist",
  // ACE / ARB
  lisinopril: "ace_inhibitor",
  enalapril: "ace_inhibitor",
  ramipril: "ace_inhibitor",
  losartan: "arb",
  valsartan: "arb",
  irbesartan: "arb",
  // diuretics
  furosemide: "loop_diuretic",
  hydrochlorothiazide: "thiazide",
  chlorthalidone: "thiazide",
  spironolactone: "potassium_sparing_diuretic",
  // statins
  atorvastatin: "statin",
  rosuvastatin: "statin",
  simvastatin: "statin",
  pravastatin: "statin",
  lovastatin: "statin",
  // antiplatelets
  aspirin: "antiplatelet",
  clopidogrel: "antiplatelet",
  ticagrelor: "antiplatelet",
  prasugrel: "antiplatelet",
  // anticoagulants
  warfarin: "anticoagulant",
  apixaban: "anticoagulant",
  rivaroxaban: "anticoagulant",
  // thyroid
  levothyroxine: "thyroid_hormone",
};

// Common abbreviations and brand-name aliases that should normalize to the
// generic drug name for class matching. Lowercase keys, lowercase values.
const DRUG_ALIASES = {
  asa: "aspirin",
  toprol: "metoprolol",
  "toprol-xl": "metoprolol",
  lopressor: "metoprolol",
  coreg: "carvedilol",
  tenormin: "atenolol",
  zestril: "lisinopril",
  prinivil: "lisinopril",
  cozaar: "losartan",
  diovan: "valsartan",
  norvasc: "amlodipine",
  cardizem: "diltiazem",
  calan: "verapamil",
  catapres: "clonidine",
  aldomet: "methyldopa",
  intuniv: "guanfacine",
  lasix: "furosemide",
  hctz: "hydrochlorothiazide",
  microzide: "hydrochlorothiazide",
  aldactone: "spironolactone",
  lipitor: "atorvastatin",
  crestor: "rosuvastatin",
  zocor: "simvastatin",
  pravachol: "pravastatin",
  plavix: "clopidogrel",
  brilinta: "ticagrelor",
  effient: "prasugrel",
  coumadin: "warfarin",
  jantoven: "warfarin",
  eliquis: "apixaban",
  xarelto: "rivaroxaban",
  synthroid: "levothyroxine",
  levoxyl: "levothyroxine",
};

function tokenize(text) {
  return text.toLowerCase().match(/[a-z][a-z0-9-]*/g) || [];
}

/**
 * Extract a normalized lowercase generic name from a FHIR MedicationRequest.
 * Tokenizes the text + RxNorm display and looks up each token against the
 * drug-name map and the alias map. Returns the first hit. Tokenization
 * prevents short generics like "asa" from matching unrelated substrings, and
 * lets a brand name like "Coumadin" normalize to "warfarin".
 */
function extractGenericName(med) {
  const text =
    (med.medicationCodeableConcept?.text || "") +
    " " +
    (med.medicationCodeableConcept?.coding?.[0]?.display || "");
  const tokens = tokenize(text);
  for (const t of tokens) {
    if (DRUG_CLASS_MAP[t]) return t;
    if (DRUG_ALIASES[t]) return DRUG_ALIASES[t];
  }
  return null;
}

function ruleMatches(rule, generic) {
  if (!generic) return false;
  if (rule.targetPattern?.drugName) {
    return rule.targetPattern.drugName.toLowerCase() === generic;
  }
  if (rule.targetPattern?.drugClass) {
    return DRUG_CLASS_MAP[generic] === rule.targetPattern.drugClass;
  }
  if (Array.isArray(rule.appliesTo)) {
    return rule.appliesTo.map((s) => s.toLowerCase()).includes(generic);
  }
  return false;
}

/**
 * Apply a protocol to a patient FHIR bundle. Returns { protocolName,
 * procedureType, scheduledDate, schedule, unmatched, warnings }.
 *
 * @param {Object} protocol
 * @param {{ bundle: Object, scheduledDate?: string, procedureType?: string }} patientCtx
 */
export function applyProtocol(protocol, patientCtx) {
  if (!protocol) {
    return {
      protocolName: null,
      schedule: [],
      unmatched: [],
      warnings: ["No protocol provided."],
    };
  }
  const bundle = patientCtx?.bundle;
  const activeMeds = bundle?.entry
    ? bundle.entry
        .map((e) => e.resource)
        .filter((r) => r?.resourceType === "MedicationRequest" && r.status === "active")
    : [];

  const schedule = [];
  const unmatched = [];
  const warnings = [];

  for (const med of activeMeds) {
    const generic = extractGenericName(med);
    const displayName = med.medicationCodeableConcept?.text || generic || "Unknown medication";
    let matchedRule = null;
    let matchedRuleKey = null;

    for (const rule of protocol.rules || []) {
      if (ruleMatches(rule, generic)) {
        matchedRule = rule;
        matchedRuleKey =
          rule.targetPattern?.drugClass || rule.targetPattern?.drugName || generic;
        break;
      }
    }

    if (matchedRule) {
      schedule.push({
        medication: displayName,
        generic,
        action: matchedRule.action,
        timing: matchedRule.timing,
        resume: matchedRule.resume,
        rationale: matchedRule.rationale,
        ruleMatched: matchedRuleKey,
      });
      // Safety chain: explicitly flag centrally-acting alpha agonists.
      if (matchedRule.targetPattern?.drugClass === "central_alpha_agonist") {
        warnings.push(
          `Patient on ${displayName} — centrally-acting alpha agonist. Frequently overlooked when reviewing pre-procedure med lists by hand. Confirm hold instructions are clearly communicated to the patient.`
        );
      }
    } else {
      unmatched.push({
        medication: displayName,
        generic,
        reason: generic
          ? `No rule in protocol covers ${generic} (class: ${DRUG_CLASS_MAP[generic] || "unknown"}).`
          : "Unable to identify generic name for protocol matching — manual review required.",
      });
    }
  }

  return {
    protocolName: protocol.name,
    procedureType: patientCtx?.procedureType || protocol.procedureTypes?.[0] || null,
    scheduledDate: patientCtx?.scheduledDate || null,
    schedule,
    unmatched,
    warnings,
  };
}
