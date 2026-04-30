// Phase 3.3 — cross-output consistency check (STUB).
// API surface only. NOT invoked by ActionBar in 3.3. Wired in 3.5.
// Source: docs/PHASE-3.3-DESIGN.md Section 7.

const PHI_PLACEHOLDER_TOKENS = [
  "[Patient Name]",
  "[PATIENT NAME]",
  "[REDACTED]",
  "[NAME]",
  "[FIRST_NAME]",
  "[LAST_NAME]",
];

// Very loose drug/dose extractor — placeholder regex. Real RxNorm-aware
// extraction lives in 3.5 alongside the live invocation.
const DRUG_DOSE_RE =
  /\b([A-Z][a-zA-Z][a-zA-Z\-]+)\s+(\d+(?:\.\d+)?)\s*(mg|mcg|g|units?|IU)\b/g;

const ICD10_RE = /\b([A-TV-Z][0-9][0-9A-Z](?:\.[0-9A-Z]{1,4})?)\b/g;

export function extractClaims(text) {
  if (!text || typeof text !== "string") {
    return { drugs: [], dxCodes: [] };
  }
  const drugs = [];
  let m;
  while ((m = DRUG_DOSE_RE.exec(text)) !== null) {
    drugs.push({ name: m[1], dose: parseFloat(m[2]), unit: m[3] });
  }
  const dxCodes = [];
  while ((m = ICD10_RE.exec(text)) !== null) {
    if (!dxCodes.includes(m[1])) dxCodes.push(m[1]);
  }
  return { drugs, dxCodes };
}

export function checkConsistency(noteText, outboundText) {
  const placeholderLeak =
    PHI_PLACEHOLDER_TOKENS.some((tok) => (noteText || "").includes(tok)) ||
    PHI_PLACEHOLDER_TOKENS.some((tok) => (outboundText || "").includes(tok));

  const noteClaims = extractClaims(noteText);
  const outClaims = extractClaims(outboundText);

  const mismatches = [];
  // Drug/dose comparison: every drug in note should appear in outbound with same dose.
  for (const d of noteClaims.drugs) {
    const match = outClaims.drugs.find(
      (x) => x.name.toLowerCase() === d.name.toLowerCase()
    );
    if (!match) {
      mismatches.push({ kind: "drug-missing", drug: d.name, severity: "red" });
    } else if (match.dose !== d.dose || match.unit !== d.unit) {
      mismatches.push({
        kind: "dose-mismatch",
        drug: d.name,
        noteDose: `${d.dose}${d.unit}`,
        outDose: `${match.dose}${match.unit}`,
        severity: "red",
      });
    }
  }

  return {
    ok: !placeholderLeak && mismatches.length === 0,
    mismatches,
    placeholderLeak,
  };
}
