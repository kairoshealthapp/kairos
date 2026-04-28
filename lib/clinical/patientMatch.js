// Patient match scoring for OCR'd fax inputs.
//
// Real production matching layer is more sophisticated (Soundex, Metaphone,
// nickname tables, DOB tolerance windows). v6's job is to model the *shape*
// of match scoring — discrete weighted signals, mismatch penalties, an
// explicit "requires human confirmation" gate — so the UI can surface the
// signals to the nurse rather than handing them an opaque score.

const SIGNAL_WEIGHTS = {
  exact_name: 0.4,
  mrn_match: 0.5,
  dob_match: 0.3,
  name_phonetic: 0.15,
  name_partial: 0.1,
};

const MISMATCH_WEIGHTS = {
  dob_mismatch: -0.4,
  name_variant: -0.1,
};

function normalizeName(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[_,.]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(name) {
  return new Set(normalizeName(name).split(" ").filter(Boolean));
}

function exactNameMatch(a, b) {
  return normalizeName(a) === normalizeName(b);
}

function partialNameMatch(a, b) {
  const ta = tokens(a);
  const tb = tokens(b);
  if (ta.size === 0 || tb.size === 0) return false;
  let overlap = 0;
  for (const t of ta) if (tb.has(t)) overlap += 1;
  return overlap > 0 && overlap < Math.max(ta.size, tb.size);
}

// Crude phonetic check — collapses vowels and double consonants.
function phoneticKey(s) {
  return normalizeName(s)
    .replace(/[aeiou]/g, "a")
    .replace(/(.)\1+/g, "$1");
}

function phoneticMatch(a, b) {
  if (exactNameMatch(a, b)) return false;
  return phoneticKey(a) === phoneticKey(b);
}

function nameVariant(a, b) {
  const ta = tokens(a);
  const tb = tokens(b);
  if (exactNameMatch(a, b)) return false;
  for (const t of ta) {
    if (t.includes("_") || t.includes("?")) return true;
  }
  for (const t of tb) {
    if (t.includes("_") || t.includes("?")) return true;
  }
  // Same family token but different given, or vice versa
  let overlap = 0;
  for (const t of ta) if (tb.has(t)) overlap += 1;
  if (overlap > 0 && overlap < Math.max(ta.size, tb.size)) return true;
  return false;
}

function computeSignals({ extractedName, extractedDOB, extractedMRN, candidate }) {
  const matchSignals = [];
  const mismatchSignals = [];
  if (extractedMRN && candidate.mrn && extractedMRN === candidate.mrn) {
    matchSignals.push("mrn_match");
  }
  if (extractedName && exactNameMatch(extractedName, candidate.patientName)) {
    matchSignals.push("exact_name");
  } else if (
    extractedName &&
    phoneticMatch(extractedName, candidate.patientName)
  ) {
    matchSignals.push("name_phonetic");
  } else if (
    extractedName &&
    partialNameMatch(extractedName, candidate.patientName)
  ) {
    matchSignals.push("name_partial");
  }
  if (extractedDOB && candidate.dob) {
    if (extractedDOB === candidate.dob) {
      matchSignals.push("dob_match");
    } else {
      mismatchSignals.push("dob_mismatch");
    }
  }
  if (
    extractedName &&
    !matchSignals.includes("exact_name") &&
    !matchSignals.includes("name_phonetic") &&
    nameVariant(extractedName, candidate.patientName)
  ) {
    mismatchSignals.push("name_variant");
  }
  return { matchSignals, mismatchSignals };
}

function computeScore(matchSignals, mismatchSignals) {
  let score = 0;
  for (const s of matchSignals) score += SIGNAL_WEIGHTS[s] || 0;
  for (const s of mismatchSignals) score += MISMATCH_WEIGHTS[s] || 0;
  return Math.max(0, Math.min(1, score));
}

export function scorePatientMatch({ extractedName, extractedDOB, extractedMRN, candidates }) {
  const scored = (candidates || []).map((c) => {
    const { matchSignals, mismatchSignals } = computeSignals({
      extractedName,
      extractedDOB,
      extractedMRN,
      candidate: c,
    });
    const matchScore = computeScore(matchSignals, mismatchSignals);
    return {
      patientId: c.patientId,
      patientName: c.patientName,
      dob: c.dob,
      mrn: c.mrn || null,
      matchScore,
      matchSignals,
      mismatchSignals,
      requiresHumanConfirmation: false,
    };
  });
  scored.sort((a, b) => b.matchScore - a.matchScore);
  for (let i = 0; i < scored.length; i++) {
    const c = scored[i];
    let needsConfirm = false;
    if (c.matchScore < 0.85) needsConfirm = true;
    if (c.mismatchSignals.length > 0) needsConfirm = true;
    if (
      i === 0 &&
      scored[1] &&
      Math.abs(scored[0].matchScore - scored[1].matchScore) < 0.15
    ) {
      needsConfirm = true;
    }
    c.requiresHumanConfirmation = needsConfirm;
  }
  return scored;
}
