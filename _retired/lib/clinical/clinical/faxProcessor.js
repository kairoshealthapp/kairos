// Auto-process pipeline for incoming faxes.
//
// For home_inr faxes with a clean match, the processor flips status to
// auto_matched and the UI surface offers an "Accept" → encounter creation
// step. For everything else, the fax stays awaiting_review for the nurse
// to resolve.
//
// createEncounterFromFax is intentionally a stub for v6 — it produces an
// encounter object the dashboard can render, but the full anticoagulation
// visit triage workflow is a future composition (not a new architectural
// piece, per v6 plan).

import { resolveFaxPatient, markFaxProcessed } from "../state/incomingFaxes.js";

function getField(fax, name) {
  return (fax.extractedFields || []).find((f) => f.fieldName === name);
}

export function processIncomingFax(fax) {
  if (!fax) return null;
  if (fax.faxType !== "home_inr") return fax;
  const top = (fax.matchCandidates || [])[0];
  if (!top) return fax;
  if (top.requiresHumanConfirmation) return fax;
  if (top.matchScore < 0.85) return fax;
  return resolveFaxPatient(fax.id, top.patientId, "auto");
}

let _faxEncounterSeq = 0;

export function createEncounterFromFax(fax, patientId) {
  _faxEncounterSeq += 1;
  const inrValue = getField(fax, "inr_value")?.extractedValue;
  const drawDate = getField(fax, "inr_draw_date")?.extractedValue;
  const orderingProvider = getField(fax, "ordering_provider")?.extractedValue;
  const candidate =
    (fax.matchCandidates || []).find((c) => c.patientId === patientId) ||
    (fax.matchCandidates || [])[0];
  const patientName = candidate?.patientName || "Unknown patient";
  const id = `anticoag_visit_from_fax_${_faxEncounterSeq.toString().padStart(3, "0")}`;

  const encounter = {
    id,
    patientId,
    patientName,
    type: "anticoagulation_visit",
    origin: "lab",
    callerContext: "system",
    callerName: "Home INR fax (mdINR)",
    reason: `Home INR result: ${inrValue || "?"} on ${drawDate || "?"}${orderingProvider ? ` · ordered by ${orderingProvider}` : ""}`,
    status: "new",
    channel: "fax",
    receivedAt: new Date().toISOString(),
    processedFromFaxId: fax.id,
  };
  markFaxProcessed(fax.id, id);
  return encounter;
}
