// Assembles the slice of a patient's chart that's relevant for chart-aware
// triage question generation. Pulls Patient, active Conditions, MedicationRequests
// (active + recently stopped), recent Observations (vitals + labs), and recent
// clinical-note DocumentReferences via the fhirClient.
//
// Output is a plain-object summary. The Claude prompt receives this verbatim
// (stringified). Keep it dense and clinically structured — no narrative prose.

import { fhirClient } from "./client.js";
import { getEncounterSupplementary } from "./mockData.js";
import { analyzeBPTrend } from "../clinical/bpTrend.js";

function activeOrRecentlyStoppedMeds(bundle) {
  if (!bundle?.entry) return [];
  return bundle.entry
    .map((e) => e.resource)
    .filter((r) => r.status === "active" || r.status === "stopped");
}

function recentObservations(bundle, limit = 10) {
  if (!bundle?.entry) return [];
  const sorted = bundle.entry
    .map((e) => e.resource)
    .filter((r) => r.effectiveDateTime)
    .sort((a, b) => b.effectiveDateTime.localeCompare(a.effectiveDateTime));
  return sorted.slice(0, limit);
}

function summarizeObservation(obs) {
  const code = obs.code?.text || obs.code?.coding?.[0]?.display || "Unknown";
  const value = obs.valueQuantity
    ? `${obs.valueQuantity.value} ${obs.valueQuantity.unit}`
    : obs.valueString || "";
  const flag = obs.interpretation?.[0]?.coding?.[0]?.code || "";
  return {
    name: code,
    value,
    flag,
    date: obs.effectiveDateTime,
    referenceRange: obs.referenceRange?.[0],
  };
}

function summarizeCondition(cond) {
  return {
    name: cond.code?.text || cond.code?.coding?.[0]?.display || "Unknown",
    snomed: cond.code?.coding?.[0]?.code,
    onset: cond.onsetDateTime,
    status: cond.clinicalStatus?.coding?.[0]?.code,
  };
}

function summarizeMedication(med) {
  return {
    name: med.medicationCodeableConcept?.text ||
      med.medicationCodeableConcept?.coding?.[0]?.display || "Unknown",
    rxnorm: med.medicationCodeableConcept?.coding?.[0]?.code,
    status: med.status,
    statusReason: med.statusReason?.text,
    dosage: med.dosageInstruction?.[0]?.text,
    authoredOn: med.authoredOn,
    discontinuedDate: med._discontinuedDate,
  };
}

function summarizeDocument(doc) {
  return {
    type: doc.type?.text || doc.type?.coding?.[0]?.display,
    date: doc.date,
    author: doc.author?.[0]?.display,
    description: doc.description,
  };
}

function calculateAge(birthDate) {
  if (!birthDate) return null;
  const dob = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
  return age;
}

export async function assembleChartContext(patientId, encounterId) {
  const [patient, encounter, conditionsBundle, medsBundle, vitalsBundle, labsBundle, docsBundle] =
    await Promise.all([
      fhirClient.getPatient(patientId),
      encounterId ? fhirClient.getEncounter(encounterId) : Promise.resolve(null),
      fhirClient.searchConditions(patientId),
      fhirClient.searchMedications(patientId),
      fhirClient.searchObservations(patientId, "vital-signs"),
      fhirClient.searchObservations(patientId, "laboratory"),
      fhirClient.searchDocumentReferences(patientId, "LP173421-1"),
    ]);

  return {
    patient: patient
      ? {
          id: patient.id,
          name: patient.name?.[0]?.given?.[0] + " " + patient.name?.[0]?.family,
          gender: patient.gender,
          birthDate: patient.birthDate,
          age: calculateAge(patient.birthDate),
        }
      : null,
    encounter: encounter
      ? {
          id: encounter.id,
          type: encounter.type?.[0]?.text,
          reason: encounter.reasonCode?.[0]?.text,
          start: encounter.period?.start,
        }
      : null,
    conditions: (conditionsBundle.entry || [])
      .map((e) => summarizeCondition(e.resource))
      .filter((c) => c.status === "active"),
    medications: activeOrRecentlyStoppedMeds(medsBundle).map(summarizeMedication),
    recentVitals: recentObservations(vitalsBundle, 10).map(summarizeObservation),
    recentLabs: recentObservations(labsBundle, 10).map(summarizeObservation),
    recentNotes: (docsBundle.entry || [])
      .map((e) => summarizeDocument(e.resource))
      .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
      .slice(0, 5),
    ...buildSupplementary(encounterId),
  };
}

function buildSupplementary(encounterId) {
  if (!encounterId) return {};
  const supp = getEncounterSupplementary(encounterId);
  if (!supp) return {};
  const out = {};
  if (supp.bpLog?.readings) {
    const summary = analyzeBPTrend(supp.bpLog.readings);
    out.bpLog = {
      capturedFrom: supp.bpLog.capturedFrom,
      capturedAt: supp.bpLog.capturedAt,
      readings: supp.bpLog.readings,
      summary,
    };
  }
  return out;
}

export function hashChartContext(ctx) {
  const json = JSON.stringify(ctx);
  let hash = 0;
  for (let i = 0; i < json.length; i++) {
    hash = ((hash << 5) - hash + json.charCodeAt(i)) | 0;
  }
  return `cc_${(hash >>> 0).toString(16)}`;
}
