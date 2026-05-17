// ============================================================
// CKD + ACEi/ARB RECOMMENDATION — CONDITIONAL-POPULATION
//   THERAPY GAP. DO NOT MODIFY WITHOUT CLINICAL REVIEW.
//
// Dual-guideline source (mirrors ADR 0015 pattern).
//
// Source A (primary, renal society):
//   KDIGO 2024 Clinical Practice Guideline for the Evaluation and
//   Management of Chronic Kidney Disease.
//   Kidney Int. 2024;105(4S):S117-S314.
//   DOI: 10.1016/j.kint.2023.10.018
//   URL: https://kdigo.org/wp-content/uploads/2024/03/KDIGO-2024-CKD-Guideline.pdf
//   Recommendation 3.6.1 (paraphrased):
//     "We recommend RAS inhibitor (ACEi or ARB) for adults with CKD
//      and high BP or albuminuria (UACR ≥30 mg/g), titrated to the
//      highest approved dose tolerated."
//   Grade 1B (strong recommendation, moderate evidence).
//
// Source B (cardiology cross-citation):
//   2017 ACC/AHA HTN Guideline §9.5 — recommends ACEi or ARB for
//   adults with CKD stage 3+ and HTN.
//   Whelton PK et al, Circulation 2018;138:e484-e594.
//
// Two societies, converging recommendation: ACEi or ARB for the
// CKD-with-HTN-or-albuminuria patient.
//
// Rule shape: #9 Conditional-population therapy-gap. Same shape as
//   t2dm-sglt2i-ckd (ADR 0015). Multi-modal CKD detection reused.
//
// CKD detection (any one suffices) — reuses detectCkd from the
// t2dm-sglt2i-ckd rule via shared helpers:
//   (a) ICD-10 N18.x
//   (b) Most recent eGFR observation 25–59 mL/min/1.73m²
//   (c) Most recent UACR ≥30 mg/g
//
// Therapy gap fires when:
//   CKD-detected AND (HTN ICD I10.x family OR UACR ≥30 mg/g) AND
//   no active ACEi/ARB/ARNi on med list.
//
// Reuses GDMT_PILLAR_1_RXCUIS / GENERIC_NAMES from gdmt-hfref —
// the ACEi/ARB pillar drug class is the same.
//
// Reuses EGFR_LOINC_CODES and UACR_LOINC_CODES.
//
// v1 scope decisions:
//   - ARNi (sacubitril/valsartan) counts as suppression (active ARB
//     component covers the recommendation).
//   - ACEi/ARB contraindications (bilateral renal artery stenosis,
//     hyperkalemia K >5.5, pregnancy) NOT modeled in v1.
//     Recommendation reminds clinician to assess these before
//     initiation.
//   - Hyperkalemia floor potassium >5.5 mEq/L: future v2 enhancement
//     mirroring CONTRAINDICATION_THRESHOLDS from gdmt-hfref.
//   - Pediatric CKD NOT in scope (adult age gate ≥18).
//   - eGFR <25 floor — does NOT suppress this rule; ACEi/ARB remain
//     indicated for proteinuria reduction in advanced CKD even at
//     low eGFR (per KDIGO).
//
// lastReviewed: 2026-05-17
// reviewedBy:   Brandon Sterne, RN BSN
// nextReviewDue: 2027-05-17
// ============================================================

import type {
  Finding,
  PatientBundle,
  RuleFunction,
} from '../types';
import {
  GDMT_PILLAR_1_RXCUIS,
  GDMT_PILLAR_1_GENERIC_NAMES,
} from './gdmt-hfref';
import {
  detectCkd,
  UACR_LOINC_CODES,
  T2DM_CKD_UACR_ELEVATED_THRESHOLD,
} from './t2dm-sglt2i-ckd';

export const CKD_HTN_ICD_PREFIXES: readonly string[] = ['I10', 'I11', 'I12', 'I13', 'I15'];
export const CKD_ACEI_ARB_AGE_MIN = 18;

const PILLAR_1_RXCUI_SET: ReadonlySet<string> = new Set(GDMT_PILLAR_1_RXCUIS);

const RULE_ID = 'ckd-acei-arb';
const RULE_NAME = 'CKD + HTN/albuminuria ACEi/ARB (KDIGO 2024 §3.6.1 / 2017 ACC/AHA HTN §9.5)';

function ageInYears(dob: string | undefined, asOf: Date): number | undefined {
  if (!dob) return undefined;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return undefined;
  let years = asOf.getUTCFullYear() - birth.getUTCFullYear();
  const m = asOf.getUTCMonth() - birth.getUTCMonth();
  if (m < 0 || (m === 0 && asOf.getUTCDate() < birth.getUTCDate())) years -= 1;
  return years;
}

function hasHtn(bundle: PatientBundle): boolean {
  return bundle.conditions.some((c) =>
    CKD_HTN_ICD_PREFIXES.some((p) => c.code.startsWith(p))
  );
}

function hasAlbuminuria(bundle: PatientBundle): boolean {
  const uacrs = bundle.observations
    .filter((o) => typeof o.loincCode === 'string' && UACR_LOINC_CODES.includes(o.loincCode) && typeof o.value === 'number')
    .sort((a, b) => (b.effectiveDate ?? '').localeCompare(a.effectiveDate ?? ''));
  const latest = uacrs[0];
  return latest?.value !== undefined && latest.value >= T2DM_CKD_UACR_ELEVATED_THRESHOLD;
}

function onActiveAceiArb(bundle: PatientBundle): boolean {
  for (const med of bundle.medications) {
    if (med.status !== 'active') continue;
    if (med.rxnormCode && PILLAR_1_RXCUI_SET.has(med.rxnormCode)) return true;
    const haystacks = [med.genericName, med.name]
      .filter((s): s is string => typeof s === 'string')
      .map((s) => s.toLowerCase());
    if (haystacks.length === 0) continue;
    if (GDMT_PILLAR_1_GENERIC_NAMES.some((g) => haystacks.some((h) => h.includes(g)))) {
      return true;
    }
  }
  return false;
}

export const ckdAceiArbRule: RuleFunction = (bundle: PatientBundle): Finding[] => {
  const now = new Date();
  const age = ageInYears(bundle.patient.dob, now);
  if (age === undefined || age < CKD_ACEI_ARB_AGE_MIN) return [];

  const ckd = detectCkd(bundle);
  if (!ckd.detected) return [];

  const htn = hasHtn(bundle);
  const alb = hasAlbuminuria(bundle);
  if (!htn && !alb) return [];

  if (onActiveAceiArb(bundle)) return [];

  const qualifiers: string[] = [];
  if (htn) qualifiers.push('HTN');
  if (alb) qualifiers.push(`UACR ≥${T2DM_CKD_UACR_ELEVATED_THRESHOLD} mg/g`);

  return [
    {
      ruleId: RULE_ID,
      ruleName: RULE_NAME,
      severity: 'gap',
      category: 'ckd-acei-arb',
      status: 'missing',
      summary: `CKD + ${qualifiers.join(' + ')} without ACEi/ARB — KDIGO 2024 §3.6.1 (Grade 1B) + 2017 ACC/AHA HTN §9.5. CKD detected via: ${ckd.reasons.join('; ')}.`,
      recommendation:
        'Initiate ACEi (lisinopril, enalapril, ramipril) or ARB (losartan, valsartan). Titrate to highest tolerated dose. Confirm no bilateral renal artery stenosis, baseline K <5.5, not pregnant.',
      evidence: {
        conditionsExamined: bundle.conditions.map((c) => c.code),
        observationsExamined: bundle.observations.map((o) => o.loincCode).filter((c): c is string => typeof c === 'string'),
        contraindicationReason: `${ckd.reasons.join('; ')}; qualifiers: ${qualifiers.join(', ')}`,
      },
      timestamp: now.toISOString(),
    },
  ];
};
