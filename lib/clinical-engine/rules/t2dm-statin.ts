// ============================================================
// T2DM STATIN (AGE 40–75) — CONVERGENT-EVIDENCE RULE
//   DO NOT MODIFY WITHOUT CLINICAL REVIEW
//
// Source: ADA Standards of Care in Diabetes — 2026.
//         Section 10 (Cardiovascular Disease and Risk Management).
//         Recommendation 10.20a / 10.20b (paraphrased from
//         authoritative summaries; primary text behind
//         diabetesjournals.org Care subscription):
//           "In patients aged 40–75 years with diabetes and
//            hyperlipidaemia, high-intensity statin therapy should be
//            used to lower LDL cholesterol by ≥50% of baseline and
//            reach a target LDL cholesterol level of <70 mg/dL."
//         Recommendation grade: A (highest ADA evidence grade).
//         URL: https://diabetesjournals.org/care/issue/49/Supplement_1
//
// Convergent-evidence pattern: this rule's clinical recommendation
// also lands via the existing statin-initiation rule's "diabetes age
// 40–75" path (ADR 0009, sourced from the 2026 ACC/AHA Dyslipidemia
// Guideline). A T2DM patient age 40–75 not on a statin will fire
// BOTH rules. Each Finding cites its own evidence pedigree.
//
// v1 decision: fire both rules; do NOT deduplicate. Each Finding
// surfaces a different guideline citation; the clinician sees both
// societies independently arriving at the same recommendation,
// strengthening confidence. A Finding-deduplication layer could be
// added in v2 if clinical noise becomes an issue. See ADR 0016.
//
// v1 scope decisions:
//   - T2DM only (E11.x). T1DM (E10.x) excluded for v1; ADA's
//     statin recommendation in T1DM has more nuance (age + risk-
//     factor stratification) that would expand rule complexity.
//     T1DM-inclusion is a v2 candidate.
//   - Age 40–75 inclusive (matches ADA wording).
//   - Active-statin suppression via STATIN_RXCUI_SET from rule #5
//     (statin-initiation). Inactive prescriptions do not suppress.
//   - Contraindications NOT handled in v1. Mirrors statin-initiation
//     rule's pattern (ADR 0009).
//
// lastReviewed: 2026-05-13
// reviewedBy:   Brandon Sterne, RN BSN
// nextReviewDue: 2027-05-13
// ============================================================

import type {
  Finding,
  PatientBundle,
  RuleFunction,
} from '../types';
import {
  STATIN_RXCUI_SET,
  STATIN_GENERIC_NAMES,
} from './statin-initiation';

export const T2DM_STATIN_AGE_MIN = 40;
export const T2DM_STATIN_AGE_MAX = 75;
export const T2DM_STATIN_CONDITION_PREFIX = 'E11';

const RULE_ID = 't2dm-statin';
const RULE_NAME = 'T2DM statin age 40–75 (ADA Standards of Care 2026 §10)';

function ageInYears(dob: string | undefined, asOf: Date): number | undefined {
  if (!dob) return undefined;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return undefined;
  let years = asOf.getUTCFullYear() - birth.getUTCFullYear();
  const m = asOf.getUTCMonth() - birth.getUTCMonth();
  if (m < 0 || (m === 0 && asOf.getUTCDate() < birth.getUTCDate())) {
    years -= 1;
  }
  return years;
}

function hasT2dm(bundle: PatientBundle): boolean {
  return bundle.conditions.some((c) => c.code.startsWith(T2DM_STATIN_CONDITION_PREFIX));
}

function onActiveStatin(bundle: PatientBundle): boolean {
  for (const med of bundle.medications) {
    if (med.status !== 'active') continue;
    if (med.rxnormCode && STATIN_RXCUI_SET.has(med.rxnormCode)) return true;
    const haystacks = [med.genericName, med.name]
      .filter((s): s is string => typeof s === 'string')
      .map((s) => s.toLowerCase());
    if (haystacks.length === 0) continue;
    if (STATIN_GENERIC_NAMES.some((g) => haystacks.some((h) => h.includes(g)))) {
      return true;
    }
  }
  return false;
}

export const t2dmStatinRule: RuleFunction = (bundle: PatientBundle): Finding[] => {
  if (!hasT2dm(bundle)) return [];

  const nowDate = new Date();
  const age = ageInYears(bundle.patient.dob, nowDate);
  if (age === undefined || age < T2DM_STATIN_AGE_MIN || age > T2DM_STATIN_AGE_MAX) {
    return [];
  }

  if (onActiveStatin(bundle)) return [];

  const now = nowDate.toISOString();
  return [
    {
      ruleId: RULE_ID,
      ruleName: RULE_NAME,
      severity: 'gap',
      category: 't2dm-statin',
      status: 'missing',
      summary: `T2DM patient age ${age} (band ${T2DM_STATIN_AGE_MIN}–${T2DM_STATIN_AGE_MAX}) without statin — ADA Standards of Care 2026 recommends high-intensity statin therapy with LDL target <70 mg/dL.`,
      recommendation:
        'Initiate high-intensity statin (atorvastatin 40–80 mg or rosuvastatin 20–40 mg). Review for contraindications before prescribing.',
      evidence: {
        conditionsExamined: bundle.conditions.map((c) => c.code),
        medicationsExamined: bundle.medications
          .filter((m) => m.status === 'active')
          .map((m) => m.name),
      },
      timestamp: now,
    },
  ];
};
