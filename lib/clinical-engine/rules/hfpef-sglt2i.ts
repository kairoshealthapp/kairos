// ============================================================
// HFpEF SGLT2i RECOMMENDATION — SINGLE-PILLAR THERAPY GAP
//   DO NOT MODIFY WITHOUT CLINICAL REVIEW
//
// Source: 2022 AHA/ACC/HFSA Guideline for the Management of Heart
//         Failure. Heidenreich PA, et al.
//         Circulation. 2022;145:e895–e1032. Published 2022-05-03.
//         DOI: 10.1161/CIR.0000000000001063
//         URL: https://www.ahajournals.org/doi/10.1161/CIR.0000000000001063
//
// Section 7.7 — Heart Failure With Preserved Ejection Fraction —
// Recommendation 2 (verbatim from primary PDF, pinned 2026-05-13):
//   "In patients with HFpEF, SGLT2i can be beneficial in decreasing
//    HF hospitalizations and cardiovascular mortality."
//
// Class of Recommendation: 2a. Level of Evidence: B-R.
//
// Evidence base:
//   - EMPEROR-Preserved (empagliflozin, NEJM 2021)
//   - DELIVER          (dapagliflozin, NEJM 2022)
// Both trials enrolled patients with LVEF >40%; the 2022 guideline
// defines HFpEF as LVEF ≥50%. This rule uses ≥50% as the firing
// threshold. HFmrEF (LVEF 40–49%) is OUT OF SCOPE for v1 (separate
// evidence-base interpretation; v2 candidate).
//
// Evidence-based SGLT2i agents for HF: empagliflozin and
// dapagliflozin. Canagliflozin and ertugliflozin were NOT studied in
// the EMPEROR-Preserved / DELIVER trials and are NOT included in the
// HF-specific recommendation. However, because the rule emits a
// "missing SGLT2i" gap, presence of ANY SGLT2i (including
// canagliflozin or ertugliflozin) on the active medication list
// is treated as satisfying the recommendation pharmacologically —
// the clinician can decide whether a switch to empag/dapag is
// warranted at the bedside.
//
// Suppression paths (each independently zeros the finding):
//   1. Active SGLT2i on medication list (empag, dapag, or any other
//      SGLT2i — see note above).
//   2. eGFR < SGLT2I_EGFR_CONTRAINDICATION_THRESHOLD (20 mL/min/1.73m²).
//      Per FDA HF labels: empagliflozin permitted to eGFR ≥20,
//      dapagliflozin to eGFR ≥25. Rule uses the more permissive
//      floor (20) so that a patient with eGFR 22 still fires (clinician
//      can choose empag if dapag is contraindicated). Multi-code eGFR
//      scan via EGFR_LOINC_CODES from gdmt-hfref.ts.
//   3. Active type 1 diabetes (E10.x) — SGLT2i carry meaningful DKA
//      risk in T1DM; off-label and rarely prescribed for HF. Type 2
//      diabetes (E11.x) does NOT suppress (it is in fact a concurrent
//      indication).
//
// HFpEF detection: two paths, either satisfies.
//   Path A: ICD-10 code in HFPEF_CONDITION_CODES (I50.30–I50.33).
//   Path B: ANY HF code (broader: gdmt-hfref.ts HFREF set, HFmrEF
//           codes, unspecified HF) PLUS most recent LVEF observation
//           ≥ HFPEF_LVEF_THRESHOLD (50%). LVEF LOINC scan: 10230-1
//           (2D echo) and 8806-2 (alternate). Path B exists because
//           ICD-coded HFpEF (I50.30-33) under-reports vs. the
//           clinical / echo-derived definition.
//
// Contraindication-aware suppression at the rule level (eGFR, T1DM)
// is a deliberate departure from the GDMT and statin rules'
// "engine surfaces, clinician adjudicates" pattern. Justified here
// because the thresholds are sharp, deterministic, computable from
// PatientBundle, and false-positive cost is high (false-positive
// "start an SGLT2i" recommendation in a patient with eGFR 15 or
// T1DM would actively harm). See ADR 0011.
//
// lastReviewed: 2026-05-13
// reviewedBy:   Brandon Sterne, RN BSN
// nextReviewDue: 2027-05-13
// ============================================================

import type {
  Finding,
  PatientBundle,
  PatientObservation,
  RuleFunction,
} from '../types';
import { EGFR_LOINC_CODES } from './gdmt-hfref';

// ── HFpEF ICD-10 codes ───────────────────────────────────────────────────────
// Per ICD-10-CM (chronic diastolic heart failure).
export const HFPEF_CONDITION_CODES: readonly string[] = [
  'I50.30',  // Unspecified diastolic (congestive) HF
  'I50.31',  // Acute diastolic (congestive) HF
  'I50.32',  // Chronic diastolic (congestive) HF
  'I50.33',  // Acute on chronic diastolic (congestive) HF
];

// Broader HF code set used by Path B — any HF code + LVEF ≥50% qualifies.
export const ANY_HF_CONDITION_CODES: readonly string[] = [
  // HFrEF (systolic + combined)
  'I50.20', 'I50.21', 'I50.22', 'I50.23',
  'I50.40', 'I50.41', 'I50.42', 'I50.43',
  // HFpEF (diastolic — same as HFPEF_CONDITION_CODES but reincluded for clarity of Path B logic)
  'I50.30', 'I50.31', 'I50.32', 'I50.33',
  // HFmrEF (mid-range, ICD-10-CM)
  'I50.810', 'I50.811', 'I50.812', 'I50.813', 'I50.814',
  // Unspecified HF
  'I50.9', 'I50.1',
  // HHD with HF
  'I11.0',
  // SNOMED HF codes
  '84114007', '703272007',
];

// LVEF LOINC codes (multi-code; both seen in US labs).
export const LVEF_LOINC_CODES: readonly string[] = [
  '10230-1',  // Left ventricular Ejection fraction by 2D echo
  '8806-2',   // Left ventricular Ejection fraction
];

export const HFPEF_LVEF_THRESHOLD = 50;  // %

// ── SGLT2i RxCUIs ────────────────────────────────────────────────────────────
// Verified live against rxnav.nlm.nih.gov on 2026-05-13.
//
// NOTE on inconsistency with gdmt-hfref.ts: the live RxNorm API
// returns empagliflozin = 1545653 and dapagliflozin = 1488564, which
// differs from the older values cached in gdmt-hfref.ts
// (empagliflozin = 1545664, dapagliflozin = 1545653). That divergence
// is part of the 8-RxCUI-mismatch backlog from Session 36 awaiting
// clinical review; this rule uses the fresh live-verified values.
// Both rules' generic-name fallback substring match means chart
// records using either RxCUI generation will be caught.
export const SGLT2I_RXCUIS: Record<string, string> = {
  empagliflozin: '1545653',
  dapagliflozin: '1488564',
  canagliflozin: '1373458',
  ertugliflozin: '1992672',
};

export const SGLT2I_RXCUI_SET: ReadonlySet<string> = new Set(
  Object.values(SGLT2I_RXCUIS)
);

export const SGLT2I_GENERIC_NAMES: readonly string[] = Object.freeze(
  Object.keys(SGLT2I_RXCUIS)
);

// ── Thresholds ───────────────────────────────────────────────────────────────
export const SGLT2I_EGFR_CONTRAINDICATION_THRESHOLD = 20;  // mL/min/1.73m²

// ── T1DM ICD-10 ──────────────────────────────────────────────────────────────
export const T1DM_CONDITION_CODE_PREFIX = 'E10';

const RULE_ID = 'hfpef-sglt2i';
const RULE_NAME = 'HFpEF SGLT2i recommendation (2022 AHA/ACC/HFSA, §7.7 Rec. 2)';

// ── Helpers ──────────────────────────────────────────────────────────────────
function latestObservationByLoincSet(
  bundle: PatientBundle,
  loincs: readonly string[]
): PatientObservation | undefined {
  const matches = bundle.observations
    .filter((o) => typeof o.loincCode === 'string' && loincs.includes(o.loincCode))
    .sort((a, b) => (b.effectiveDate ?? '').localeCompare(a.effectiveDate ?? ''));
  return matches[0];
}

function hasHfpef(bundle: PatientBundle): boolean {
  const codes = bundle.conditions.map((c) => c.code);
  // Path A: explicit HFpEF ICD-10.
  if (codes.some((c) => HFPEF_CONDITION_CODES.includes(c))) return true;
  // Path B: any HF code + LVEF ≥ 50%.
  const anyHf = codes.some((c) => ANY_HF_CONDITION_CODES.includes(c));
  if (!anyHf) return false;
  const lvef = latestObservationByLoincSet(bundle, LVEF_LOINC_CODES);
  return lvef?.value !== undefined && lvef.value >= HFPEF_LVEF_THRESHOLD;
}

function onActiveSglt2i(bundle: PatientBundle): boolean {
  for (const med of bundle.medications) {
    if (med.status !== 'active') continue;
    if (med.rxnormCode && SGLT2I_RXCUI_SET.has(med.rxnormCode)) return true;
    const haystacks = [med.genericName, med.name]
      .filter((s): s is string => typeof s === 'string')
      .map((s) => s.toLowerCase());
    if (haystacks.length === 0) continue;
    if (SGLT2I_GENERIC_NAMES.some((g) => haystacks.some((h) => h.includes(g)))) {
      return true;
    }
  }
  return false;
}

function hasT1dm(bundle: PatientBundle): boolean {
  return bundle.conditions.some((c) => c.code.startsWith(T1DM_CONDITION_CODE_PREFIX));
}

// ── Rule ─────────────────────────────────────────────────────────────────────
export const hfpefSglt2iRule: RuleFunction = (bundle: PatientBundle): Finding[] => {
  if (!hasHfpef(bundle)) return [];

  // Suppression 1: already on SGLT2i.
  if (onActiveSglt2i(bundle)) return [];

  // Suppression 2: eGFR contraindication.
  const latestEgfr = latestObservationByLoincSet(bundle, EGFR_LOINC_CODES);
  if (
    latestEgfr?.value !== undefined &&
    latestEgfr.value < SGLT2I_EGFR_CONTRAINDICATION_THRESHOLD
  ) {
    return [];
  }

  // Suppression 3: T1DM (DKA risk).
  if (hasT1dm(bundle)) return [];

  const now = new Date().toISOString();
  const lvef = latestObservationByLoincSet(bundle, LVEF_LOINC_CODES);
  const lvefText = lvef?.value !== undefined ? ` (LVEF ${lvef.value}%)` : '';

  return [
    {
      ruleId: RULE_ID,
      ruleName: RULE_NAME,
      severity: 'gap',
      category: 'hfpef-sglt2i',
      status: 'missing',
      summary: `HFpEF${lvefText} without SGLT2i — Class 2a (LOE B-R), 2022 AHA/ACC/HFSA HF Guideline. SGLT2i decrease HF hospitalizations and cardiovascular mortality in HFpEF (EMPEROR-Preserved, DELIVER).`,
      recommendation:
        'Initiate empagliflozin or dapagliflozin. Review eGFR (≥20 for empag, ≥25 for dapag) and confirm no T1DM before prescribing.',
      evidence: {
        conditionsExamined: bundle.conditions.map((c) => c.code),
        observationsExamined: bundle.observations
          .map((o) => o.loincCode)
          .filter((c): c is string => typeof c === 'string'),
      },
      timestamp: now,
    },
  ];
};
