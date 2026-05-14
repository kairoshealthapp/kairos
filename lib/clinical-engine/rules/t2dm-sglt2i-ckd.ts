// ============================================================
// T2DM + CKD SGLT2i — CONDITIONAL-POPULATION THERAPY GAP
//   DO NOT MODIFY WITHOUT CLINICAL REVIEW
//
// Dual-guideline source: this rule cites both ADA and KDIGO. First
// rule in the Kairos engine to cite two converging guidelines for a
// single recommendation. See ADR 0015.
//
// Source A (primary, US clinical convention):
//   ADA Standards of Care in Diabetes — 2026.
//   Section 11 (Chronic Kidney Disease and Risk Management),
//   Recommendation 11.11a (paraphrased from authoritative summaries;
//   primary text behind diabetesjournals.org Care subscription):
//     "In adults with type 2 diabetes who have chronic kidney disease
//      (with confirmed eGFR 20–60 mL/min/1.73 m² and/or albuminuria),
//      an SGLT2 inhibitor or GLP-1 RA with demonstrated benefit in
//      this population should be used for both glycemic management
//      and for slowing progression of CKD and reduction in
//      cardiovascular events (irrespective of A1C)."
//   Diabetes Care. Standards of Care in Diabetes—2026. Published 2025-12.
//   URL: https://diabetesjournals.org/care/issue/49/Supplement_1
//
// Source B (renal society convention, eGFR floor reference):
//   KDIGO 2022 Clinical Practice Guideline for Diabetes Management in
//   Chronic Kidney Disease. Recommendation 1.3.1 (verbatim):
//     "We recommend treating patients with type 2 diabetes, CKD, and
//      eGFR ≥20 mL/min/1.73 m² with a sodium-glucose cotransporter 2
//      inhibitor (SGLT2i)."
//   Class / Strength: 1A (strong recommendation, high quality of
//   evidence).
//   Kidney International (2022). KDIGO 2022 Clinical Practice Guideline.
//   URL: https://kdigo.org/wp-content/uploads/2022/10/KDIGO-2022-Clinical-Practice-Guideline-for-Diabetes-Management-in-CKD.pdf
//
// The two recommendations converge: SGLT2i is indicated in T2DM with
// CKD. Different societies, same end-state. v1 fires one Finding
// citing both sources.
//
// Rule shape: CONDITIONAL-POPULATION THERAPY GAP. Distinct from the
// conditional-population SCREENING shape (ApoB, ADR 0008) in that the
// missing item is a therapy, not a measurement. See rule-shapes.md.
//
// CKD detection — multi-modal (any one suffices):
//   (a) ICD-10 N18.x — CKD any stage.
//   (b) Most recent eGFR observation in 25–59 mL/min/1.73m² (strict
//       KDIGO stage 3 range; eGFR 60-89 alone WITHOUT albuminuria is
//       not CKD per KDIGO definition).
//   (c) Most recent UACR observation ≥30 mg/g (KDIGO A2/A3 categories;
//       LOINC 9318-7 or 14959-1). Albuminuric CKD with preserved eGFR
//       is captured here, satisfying the ADA range that spans eGFR
//       20–60 OR albuminuria.
//
// SGLT2i agents in scope for the CKD indication:
//   - canagliflozin (CREDENCE trial — kidney outcomes)
//   - dapagliflozin (DAPA-CKD)
//   - empagliflozin (EMPA-KIDNEY)
//   - ertugliflozin (included for pharmacologic equivalence; no
//     dedicated CKD trial)
//
// Note divergence from HFpEF SGLT2i rule (ADR 0011): HFpEF cites
// empagliflozin (EMPEROR-Preserved) and dapagliflozin (DELIVER) as
// the evidence-base agents; CKD adds canagliflozin (CREDENCE). The
// agent lists differ by indication. Documented in ADR 0015.
//
// eGFR contraindication floor: <25 mL/min/1.73m² suppresses. KDIGO
// permits SGLT2i down to eGFR ≥20 for initiation but DAPA-CKD's
// initiation floor is 25; the more conservative initiation floor
// (25) is used to avoid firing recommendations for patients near
// the dialysis margin where contraindication is more likely.
//
// T1DM (E10.x) suppression: SGLT2i carry meaningful DKA risk in T1DM
// and are off-label/rarely prescribed for renal protection in this
// population. Mirrors HFpEF rule's T1DM exclusion (ADR 0011).
//
// Acute illness contraindications (DKA risk during sepsis, surgery
// prep, prolonged fasting) NOT handled in v1. Clinician adjudicates.
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

// ── T2DM / T1DM ICD-10 ───────────────────────────────────────────────────────
export const T2DM_CONDITION_CODE_PREFIX = 'E11';
export const T2DM_RULE_T1DM_PREFIX = 'E10';

// ── CKD ICD-10 ───────────────────────────────────────────────────────────────
// N18.1 stage 1, N18.2 stage 2, N18.3 (parent + .30/.31/.32),
// N18.4 stage 4, N18.5 stage 5, N18.6 ESRD, N18.9 unspecified.
function isCkdIcd(code: string): boolean {
  return code.startsWith('N18');
}

// ── UACR LOINC codes ─────────────────────────────────────────────────────────
// 9318-7 — Albumin/Creatinine [Mass Ratio] in Urine (mg/g).
// 14959-1 — Microalbumin/Creatinine [Mass Ratio] in Urine.
export const UACR_LOINC_CODES: readonly string[] = ['9318-7', '14959-1'];

// ── SGLT2i agents in scope for CKD ───────────────────────────────────────────
// Live-verified RxCUIs from Session 41.
export const T2DM_CKD_SGLT2I_RXCUIS: Record<string, string> = {
  canagliflozin: '1373458',
  dapagliflozin: '1488564',
  empagliflozin: '1545653',
  ertugliflozin: '1992672',
};

export const T2DM_CKD_SGLT2I_RXCUI_SET: ReadonlySet<string> = new Set(
  Object.values(T2DM_CKD_SGLT2I_RXCUIS)
);

export const T2DM_CKD_SGLT2I_GENERIC_NAMES: readonly string[] = Object.freeze(
  Object.keys(T2DM_CKD_SGLT2I_RXCUIS)
);

// ── Thresholds ───────────────────────────────────────────────────────────────
export const T2DM_CKD_EGFR_CKD_LOWER = 25;       // mL/min/1.73m² — contraindication floor (initiation)
export const T2DM_CKD_EGFR_CKD_UPPER = 59;       // mL/min/1.73m² — strict KDIGO stage-3 upper bound
export const T2DM_CKD_UACR_ELEVATED_THRESHOLD = 30;  // mg/g — KDIGO A2/A3 category

const RULE_ID = 't2dm-sglt2i-ckd';
const RULE_NAME = 'T2DM + CKD SGLT2i (ADA 2026 §11.11a + KDIGO 2022 §1.3.1)';

// ── Helpers ──────────────────────────────────────────────────────────────────
function latestByLoincSet(
  bundle: PatientBundle,
  loincs: readonly string[]
): PatientObservation | undefined {
  const matches = bundle.observations
    .filter((o) => typeof o.loincCode === 'string' && loincs.includes(o.loincCode))
    .sort((a, b) => (b.effectiveDate ?? '').localeCompare(a.effectiveDate ?? ''));
  return matches[0];
}

function hasT2dm(bundle: PatientBundle): boolean {
  return bundle.conditions.some((c) => c.code.startsWith(T2DM_CONDITION_CODE_PREFIX));
}

function hasT1dm(bundle: PatientBundle): boolean {
  return bundle.conditions.some((c) => c.code.startsWith(T2DM_RULE_T1DM_PREFIX));
}

export interface CkdDetectionResult {
  detected: boolean;
  reasons: string[];
}

export function detectCkd(bundle: PatientBundle): CkdDetectionResult {
  const reasons: string[] = [];

  if (bundle.conditions.some((c) => isCkdIcd(c.code))) {
    reasons.push('N18.x ICD-10');
  }

  const egfr = latestByLoincSet(bundle, EGFR_LOINC_CODES);
  if (
    egfr?.value !== undefined &&
    egfr.value >= T2DM_CKD_EGFR_CKD_LOWER &&
    egfr.value <= T2DM_CKD_EGFR_CKD_UPPER
  ) {
    reasons.push(`eGFR ${egfr.value} in CKD range`);
  }

  const uacr = latestByLoincSet(bundle, UACR_LOINC_CODES);
  if (uacr?.value !== undefined && uacr.value >= T2DM_CKD_UACR_ELEVATED_THRESHOLD) {
    reasons.push(`UACR ${uacr.value} mg/g (≥${T2DM_CKD_UACR_ELEVATED_THRESHOLD})`);
  }

  return { detected: reasons.length > 0, reasons };
}

function onActiveSglt2i(bundle: PatientBundle): boolean {
  for (const med of bundle.medications) {
    if (med.status !== 'active') continue;
    if (med.rxnormCode && T2DM_CKD_SGLT2I_RXCUI_SET.has(med.rxnormCode)) return true;
    const haystacks = [med.genericName, med.name]
      .filter((s): s is string => typeof s === 'string')
      .map((s) => s.toLowerCase());
    if (haystacks.length === 0) continue;
    if (T2DM_CKD_SGLT2I_GENERIC_NAMES.some((g) => haystacks.some((h) => h.includes(g)))) {
      return true;
    }
  }
  return false;
}

function eGfrContraindicated(bundle: PatientBundle): boolean {
  const egfr = latestByLoincSet(bundle, EGFR_LOINC_CODES);
  return egfr?.value !== undefined && egfr.value < T2DM_CKD_EGFR_CKD_LOWER;
}

// ── Rule ─────────────────────────────────────────────────────────────────────
export const t2dmSglt2iCkdRule: RuleFunction = (bundle: PatientBundle): Finding[] => {
  if (!hasT2dm(bundle)) return [];
  if (hasT1dm(bundle)) return [];  // T1DM exclusion supremacy

  const ckd = detectCkd(bundle);
  if (!ckd.detected) return [];

  if (eGfrContraindicated(bundle)) return [];
  if (onActiveSglt2i(bundle)) return [];

  const now = new Date().toISOString();
  return [
    {
      ruleId: RULE_ID,
      ruleName: RULE_NAME,
      severity: 'gap',
      category: 't2dm-sglt2i-ckd',
      status: 'missing',
      summary: `T2DM + CKD without SGLT2i — ADA 2026 §11.11a + KDIGO 2022 §1.3.1 (Class 1A) recommend SGLT2i to slow CKD progression and reduce CV events. CKD detected via: ${ckd.reasons.join('; ')}.`,
      recommendation:
        'Initiate canagliflozin, dapagliflozin, or empagliflozin. Confirm eGFR ≥20 (initiation), no T1DM, and review DKA precipitants (acute illness, surgery, prolonged fasting) before prescribing.',
      evidence: {
        conditionsExamined: bundle.conditions.map((c) => c.code),
        observationsExamined: bundle.observations
          .map((o) => o.loincCode)
          .filter((c): c is string => typeof c === 'string'),
        contraindicationReason: ckd.reasons.join('; '),
      },
      timestamp: now,
    },
  ];
};
