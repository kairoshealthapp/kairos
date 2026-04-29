// Evidence + SBAR shapes and helpers shared across client + server.
//
// Source-tagging is part of the data, never inferred later. Evidence items
// accumulate (never replaced). SBAR is a versioned regeneratable artifact —
// each regeneration creates a new SBARVersion with a hash of the evidence
// that produced it.

// Hash uses an isomorphic djb2 implementation (see hashEvidence below). The
// previous version imported `node:crypto`'s createHash and fell back to djb2
// on the client; Next 14's Webpack 5 doesn't handle the `node:` URI scheme in
// client bundles, and EvidenceCapture (a client component) reaches this file
// transitively. Dropping the conditional in favor of always-djb2 keeps the
// hash stable, isomorphic, and dependency-free. Per the comment on
// hashEvidence, this is not a security primitive — it's a "did evidence
// change since SBAR generation" marker.

/**
 * @typedef {Object} EvidenceItem
 * @property {string} id - uuid
 * @property {string} questionId - matches q_001 etc from question generator, or 'freeform'
 * @property {string} questionText - human-readable question
 * @property {string} answer - actual answer text
 * @property {'patient' | 'family' | 'outside_clinician' | 'chart' | 'nurse_observation'} source
 * @property {string} sourceDetail - optional context (e.g., "Renee VA RN", "spouse on phone")
 * @property {string} capturedAt - ISO timestamp
 */

/**
 * @typedef {Object} SBARVersion
 * @property {number} version - 1-indexed
 * @property {string} situation
 * @property {string} background
 * @property {string} assessment
 * @property {string} recommendation
 * @property {string} evidenceHash - first 8 chars of SHA-256 over the evidence array
 * @property {number} evidenceCount - number of evidence items at time of generation
 * @property {string} generatedAt - ISO timestamp
 * @property {string} model - which Claude model generated this
 */

/**
 * Stable short hash of an evidence array. Sort by id so ordering doesn't
 * change the hash; serialize the source-tagged content fields only (not
 * capturedAt, which is per-session noise).
 *
 * Browser-safe fallback: if node:crypto isn't available (it should be on
 * the server route, but client-side imports might run too), fall back to
 * a small djb2 hash. Same purpose: distinguish "evidence has changed since
 * SBAR generation" — not a security primitive.
 *
 * @param {EvidenceItem[]} evidenceArray
 * @returns {string} 8-char hex
 */
export function hashEvidence(evidenceArray) {
  const sorted = [...(evidenceArray || [])].sort((a, b) =>
    String(a.id || "").localeCompare(String(b.id || ""))
  );
  const payload = JSON.stringify(
    sorted.map((e) => ({
      id: e.id,
      questionId: e.questionId,
      questionText: e.questionText,
      answer: e.answer,
      source: e.source,
      sourceDetail: e.sourceDetail || "",
    }))
  );
  // djb2, isomorphic. Stable, not cryptographic.
  let h = 5381;
  for (let i = 0; i < payload.length; i++) {
    h = ((h << 5) + h + payload.charCodeAt(i)) & 0xffffffff;
  }
  return (h >>> 0).toString(16).padStart(8, "0").slice(0, 8);
}

/**
 * Source value -> display metadata. Used by EvidenceCapture pills and
 * the SBARDraft inline marker renderer.
 */
export const SOURCE_META = {
  patient: {
    label: "Patient",
    short: "pt",
    bg: "bg-[color:var(--color-accent-soft)]",
    fg: "text-[color:var(--color-accent)]",
  },
  family: {
    label: "Family",
    short: "family",
    bg: "bg-[color:var(--color-source-family-soft)]",
    fg: "text-[color:var(--color-source-family)]",
  },
  outside_clinician: {
    label: "Outside clinician",
    short: "outside RN",
    bg: "bg-[color:var(--color-source-clinician-soft)]",
    fg: "text-[color:var(--color-source-clinician)]",
  },
  chart: {
    label: "Chart",
    short: "chart",
    bg: "bg-muted",
    fg: "text-fg-muted",
  },
  nurse_observation: {
    label: "Nurse obs.",
    short: "nurse obs",
    bg: "bg-[color:var(--color-flag-low-soft)]",
    fg: "text-[color:var(--color-flag-low)]",
  },
};

export const SOURCE_VALUES = [
  "patient",
  "family",
  "outside_clinician",
  "chart",
  "nurse_observation",
];
