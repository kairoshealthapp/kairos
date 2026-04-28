// Medication reconciliation engine — compares Epic's active MedicationRequest
// list against the patient-reported med list (captured pre-visit). Returns a
// flat array of Discrepancy objects, sorted nowhere (the panel sorts).
//
// v5 ships with a small generic-name map and brand-alias map (extends the
// v4 protocol applier's coverage to more therapeutic classes), a small
// known-interaction list, and a class-keyed duplicate detector. Production
// swap point: RxNorm class hierarchy + a real interaction service.
//
// Severity scaling rules are in DETECTION_RULES at the bottom of the file.
// Whenever you adjust severity, update the comment above the relevant rule.

import { extractGenericFromText, getDrugClass } from "./drugLookup.js";

const NARROW_THERAPEUTIC = new Set([
  "warfarin",
  "digoxin",
  "lithium",
  "levothyroxine",
  "insulin",
]);

const HYPOGLYCEMIA_RISK = new Set([
  "glipizide",
  "glyburide",
  "glimepiride",
  "insulin",
]);

const ANTICOAGULANT_DROP_HIGH = new Set([
  "warfarin",
  "apixaban",
  "rivaroxaban",
  "dabigatran",
  "edoxaban",
]);

const ANTIARRHYTHMIC_OR_ANTIEPILEPTIC = new Set([
  "amiodarone",
  "sotalol",
  "flecainide",
  "phenytoin",
  "carbamazepine",
  "valproate",
  "levetiracetam",
  "lamotrigine",
]);

const OPIOID_OR_BENZO = new Set([
  "tramadol",
  "oxycodone",
  "hydrocodone",
  "morphine",
  "fentanyl",
  "alprazolam",
  "lorazepam",
  "clonazepam",
  "diazepam",
]);

const KNOWN_OTC_OR_SUPPLEMENT = new Set([
  "vitamin",
  "vitamind",
  "vitaminb12",
  "calcium",
  "fish_oil",
  "omega3",
  "magnesium",
  "turmeric",
  "tylenol",
  "acetaminophen",
  "ibuprofen",
  "naproxen",
  "asa_otc",
  "melatonin",
  "coq10",
]);

// Pairs of (genericA, genericB) with known clinically significant interactions.
// Order-insensitive — keys are sorted alphabetically when checked.
const INTERACTION_MAP = {
  "apixaban|turmeric": {
    note: "Turmeric (curcumin) has antiplatelet/anticoagulant activity. Compound bleeding risk with apixaban — confirm patient is aware.",
    severity: "medium",
  },
  "apixaban|nsaid": {
    note: "Anticoagulant + NSAID — increased bleeding risk.",
    severity: "high",
  },
  "warfarin|nsaid": {
    note: "Warfarin + NSAID — increased bleeding risk; INR may also drift.",
    severity: "high",
  },
  "warfarin|aspirin": {
    note: "Warfarin + aspirin — bleeding risk; confirm intentional dual therapy.",
    severity: "medium",
  },
  "ssri|maoi": {
    note: "SSRI + MAOI — serotonin syndrome risk. Verify washout.",
    severity: "high",
  },
  "ssri|ssri": {
    note: "Two SSRIs concurrent — pharmacologically duplicative; consider serotonin syndrome risk.",
    severity: "high",
  },
  "metoprolol|verapamil": {
    note: "Beta blocker + non-DHP CCB — bradycardia / heart block risk.",
    severity: "high",
  },
  "metoprolol|diltiazem": {
    note: "Beta blocker + non-DHP CCB — bradycardia / heart block risk.",
    severity: "high",
  },
  "tramadol|ssri": {
    note: "Tramadol + SSRI — serotonin syndrome risk; also lowers seizure threshold.",
    severity: "high",
  },
};

function interactionKey(a, b) {
  return [a, b].sort().join("|");
}

function genericFromMed(med) {
  const text =
    (med.medicationCodeableConcept?.text || "") +
    " " +
    (med.medicationCodeableConcept?.coding?.[0]?.display || "");
  return extractGenericFromText(text);
}

function genericFromReportedName(reported) {
  return extractGenericFromText(reported.reportedName || "");
}

function normalizeFreq(freq) {
  if (!freq) return "";
  const s = String(freq).toLowerCase().trim();
  // PRN wins if any "as needed"-flavored phrase is present, even alongside
  // a base interval ("at bedtime when needed" → prn so it matches an Epic
  // "qhs prn" order). This mirrors extractFreqFromEpicText().
  if (/(\bprn\b|as needed|when needed)/.test(s)) return "prn";
  // Multi-token patterns first: "twice daily" contains "daily".
  if (/(bid|twice daily|two times|2x|twice a day)/.test(s)) return "bid";
  if (/(tid|three times|3x)/.test(s)) return "tid";
  if (/(qid|four times|4x)/.test(s)) return "qid";
  if (/q6h/.test(s)) return "q6h";
  if (/q8h/.test(s)) return "q8h";
  if (/qhs|bedtime/.test(s)) return "qhs";
  if (/(^|\s)(daily|once daily|qd|q\.d\.|every day|once a day)(\s|$)/.test(s)) return "daily";
  return s;
}

function normalizeDose(dose) {
  if (!dose) return "";
  const m = String(dose).toLowerCase().match(/(\d+(?:\.\d+)?)\s*(mg|mcg|iu|g|units?)?/);
  if (!m) return String(dose).toLowerCase().trim();
  return `${m[1]}${m[2] ? m[2] : ""}`.replace(/units?$/, "u");
}

function extractDoseFromEpicText(text) {
  if (!text) return "";
  const m = text.toLowerCase().match(/(\d+(?:\.\d+)?)\s*(mg|mcg|iu|units?)/);
  if (!m) return "";
  return `${m[1]}${m[2]}`.replace(/units?$/, "u");
}

function extractFreqFromEpicText(text) {
  if (!text) return "";
  // If the order text says "prn"/"PRN" we treat the order as PRN-dominant
  // regardless of the underlying interval (e.g. "q6h prn" → "prn"), so
  // "as needed for pain" from the patient counts as a match.
  if (/\bprn\b|as needed|when needed/i.test(text)) return "prn";
  return normalizeFreq(text);
}

function severityForDoseMismatch(generic) {
  if (NARROW_THERAPEUTIC.has(generic)) return "high";
  if (HYPOGLYCEMIA_RISK.has(generic)) return "high";
  return "medium";
}

function severityForFreqMismatch(generic, patientFreqNorm, epicFreqNorm) {
  if (OPIOID_OR_BENZO.has(generic)) {
    // Patient reporting MORE frequent than prescribed = overdose risk
    if (epicFreqNorm === "prn" && patientFreqNorm !== "prn") return "high";
    if (orderFreq(patientFreqNorm) > orderFreq(epicFreqNorm)) return "high";
  }
  // Patient taking LESS frequently than prescribed (e.g. BID → prn) is the
  // common "I only take it when I feel bad" pattern — clinically meaningful
  // for adherence but lower acuity than the over-use case.
  if (patientFreqNorm === "prn" && epicFreqNorm !== "prn") return "low";
  return "medium";
}

function orderFreq(f) {
  const order = { prn: 0, daily: 1, bid: 2, tid: 3, q8h: 3, qid: 4, q6h: 4, qhs: 1 };
  return order[f] ?? 0;
}

function severityForDropped(generic) {
  if (ANTICOAGULANT_DROP_HIGH.has(generic)) return "high";
  if (ANTIARRHYTHMIC_OR_ANTIEPILEPTIC.has(generic)) return "high";
  if (HYPOGLYCEMIA_RISK.has(generic)) return "high";
  return "medium";
}

function severityForAdded(generic) {
  if (!generic) return "medium";
  if (KNOWN_OTC_OR_SUPPLEMENT.has(generic)) return "low";
  if (generic === "turmeric") return "medium";
  return "medium";
}

/**
 * Reconcile Epic's active medication list against patient-reported meds.
 *
 * @param {Object} bundle - the patient's full FHIR Bundle (or { entry: [...] })
 * @param {Array} patientReportedMeds - PatientReportedMed[]
 * @returns {Array} Discrepancy[]
 */
export function reconcileMedications(bundle, patientReportedMeds) {
  const epicMeds = (bundle?.entry || [])
    .map((e) => e.resource)
    .filter((r) => r?.resourceType === "MedicationRequest" && r.status === "active");

  const epicByGeneric = new Map();
  for (const med of epicMeds) {
    const generic = genericFromMed(med);
    if (!generic) continue;
    if (!epicByGeneric.has(generic)) epicByGeneric.set(generic, []);
    epicByGeneric.get(generic).push(med);
  }

  const reportedByGeneric = new Map();
  for (const r of patientReportedMeds || []) {
    const generic = genericFromReportedName(r);
    if (!generic) {
      // Unknown reported name — file it as patient_added with a stub generic
      if (!reportedByGeneric.has("__unknown__")) reportedByGeneric.set("__unknown__", []);
      reportedByGeneric.get("__unknown__").push({ ...r, _generic: null });
      continue;
    }
    if (!reportedByGeneric.has(generic)) reportedByGeneric.set(generic, []);
    reportedByGeneric.get(generic).push({ ...r, _generic: generic });
  }

  const discrepancies = [];
  let counter = 0;
  function newId() {
    counter += 1;
    return `disc_${counter.toString().padStart(3, "0")}`;
  }

  // Pass 1: items in Epic that aren't reported (patient_dropped) and dose/freq mismatches
  for (const [generic, meds] of epicByGeneric.entries()) {
    const reportedMatches = reportedByGeneric.get(generic) || [];
    const epicMed = meds[0];
    const epicText = epicMed.medicationCodeableConcept?.text || "";

    if (reportedMatches.length === 0) {
      discrepancies.push({
        id: newId(),
        kind: "patient_dropped",
        severity: severityForDropped(generic),
        epicMedDescription: epicText,
        patientReportedDescription: null,
        clinicalNote: `Epic shows ${generic} active. Patient did not report this medication. Confirm whether they have stopped taking it and why.`,
        resolution: null,
      });
      continue;
    }

    // We have a reported entry — check dose + frequency
    const rep = reportedMatches[0];
    const epicDose = extractDoseFromEpicText(epicText);
    const repDose = normalizeDose(rep.reportedDose);
    const epicFreq = extractFreqFromEpicText(epicText);
    const repFreq = normalizeFreq(rep.reportedFrequency);

    if (epicDose && repDose && epicDose !== repDose) {
      discrepancies.push({
        id: newId(),
        kind: "dose_mismatch",
        severity: severityForDoseMismatch(generic),
        epicMedDescription: epicText,
        patientReportedDescription: `${rep.reportedName} ${rep.reportedDose} ${rep.reportedFrequency}`,
        clinicalNote: `Epic ${epicDose}, patient reports ${repDose}. Confirm current dose and update Epic if patient self-adjusted.`,
        resolution: null,
      });
    }

    if (epicFreq && repFreq && epicFreq !== repFreq) {
      discrepancies.push({
        id: newId(),
        kind: "frequency_mismatch",
        severity: severityForFreqMismatch(generic, repFreq, epicFreq),
        epicMedDescription: epicText,
        patientReportedDescription: `${rep.reportedName} ${rep.reportedDose} ${rep.reportedFrequency}`,
        clinicalNote:
          OPIOID_OR_BENZO.has(generic) && (epicFreq === "prn" && repFreq !== "prn")
            ? `Epic ordered as PRN, patient using scheduled (${repFreq}). Confirm pain control plan and watch for opioid use escalation.`
            : `Epic ${epicFreq}, patient reports ${repFreq}. Reconcile actual usage.`,
        resolution: null,
      });
    }
  }

  // Pass 2: items reported by patient that aren't in Epic (patient_added)
  for (const [generic, reps] of reportedByGeneric.entries()) {
    if (generic === "__unknown__") {
      for (const r of reps) {
        discrepancies.push({
          id: newId(),
          kind: "patient_added",
          severity: severityForAdded(null),
          epicMedDescription: null,
          patientReportedDescription: `${r.reportedName} ${r.reportedDose || ""} ${r.reportedFrequency || ""}`.trim(),
          clinicalNote: `Patient reports ${r.reportedName} — not in Epic and unable to map to a known generic. Manual review.`,
          resolution: null,
        });
      }
      continue;
    }
    if (!epicByGeneric.has(generic)) {
      const r = reps[0];
      discrepancies.push({
        id: newId(),
        kind: "patient_added",
        severity: severityForAdded(generic),
        epicMedDescription: null,
        patientReportedDescription: `${r.reportedName} ${r.reportedDose || ""} ${r.reportedFrequency || ""}`.trim(),
        clinicalNote: KNOWN_OTC_OR_SUPPLEMENT.has(generic)
          ? `Patient takes ${r.reportedName} (OTC/supplement). Add to Epic so future reviews include it.`
          : `Patient reports ${r.reportedName} but it is not in Epic. Verify source (outside provider? recent ED?) and add to Epic.`,
        resolution: null,
      });
    }
  }

  // Pass 3: duplicate-class detector
  const classMembers = new Map();
  for (const med of epicMeds) {
    const generic = genericFromMed(med);
    const cls = getDrugClass(generic);
    if (!cls) continue;
    if (!classMembers.has(cls)) classMembers.set(cls, []);
    classMembers.get(cls).push({ generic, med });
  }
  const DUP_CHECKED_CLASSES = new Set([
    "beta_blocker",
    "ssri",
    "ppi",
    "ace_inhibitor",
    "arb",
    "statin",
    "anticoagulant",
    "loop_diuretic",
    "thiazide",
    "ccb_dhp",
    "ccb_non_dhp",
  ]);
  for (const [cls, members] of classMembers.entries()) {
    if (!DUP_CHECKED_CLASSES.has(cls)) continue;
    if (members.length < 2) continue;
    const names = members.map((m) => m.med.medicationCodeableConcept?.text || m.generic);
    discrepancies.push({
      id: newId(),
      kind: "duplicate_class",
      severity: "high",
      epicMedDescription: names.join(" + "),
      patientReportedDescription: null,
      clinicalNote: `Two active ${cls.replace(/_/g, " ")} agents on the Epic list (${names.join(", ")}). Confirm whether both are intentional — frequent finding when one was started without discontinuing the predecessor.`,
      resolution: null,
    });
  }

  // Pass 4: drug interactions — across Epic active list AND across patient_added supplements
  const allActiveGenerics = new Set();
  for (const med of epicMeds) {
    const g = genericFromMed(med);
    if (g) allActiveGenerics.add(g);
  }
  // Bring in patient-reported supplements that aren't on Epic — these are
  // exactly the surface where interactions are missed today.
  for (const [generic, reps] of reportedByGeneric.entries()) {
    if (generic === "__unknown__") continue;
    if (!epicByGeneric.has(generic)) allActiveGenerics.add(generic);
  }

  const generics = [...allActiveGenerics];
  for (let i = 0; i < generics.length; i += 1) {
    for (let j = i + 1; j < generics.length; j += 1) {
      const key = interactionKey(generics[i], generics[j]);
      const hit = INTERACTION_MAP[key];
      if (!hit) continue;
      discrepancies.push({
        id: newId(),
        kind: "drug_interaction",
        severity: hit.severity,
        epicMedDescription: `${generics[i]} + ${generics[j]}`,
        patientReportedDescription: null,
        clinicalNote: hit.note,
        resolution: null,
      });
    }
  }

  return discrepancies;
}

export function attachResolutions(discrepancies, resolutionsMap) {
  if (!resolutionsMap) return discrepancies;
  return discrepancies.map((d) =>
    resolutionsMap[d.id] ? { ...d, resolution: resolutionsMap[d.id] } : d
  );
}
