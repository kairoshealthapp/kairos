// ============================================================
// ApoB SELECTIVE MEASUREMENT GAP (conditional-population)
//   DO NOT MODIFY WITHOUT CLINICAL REVIEW
//
// Source: 2026 ACC/AHA/AACVPR/ABC/ACPM/ADA/AGS/APhA/ASPC/NLA/PCNA
//         Guideline on the Management of Dyslipidemia.
//         Circulation. Published online 2026-03-13.
//         DOI: 10.1161/CIR.0000000000001423
//         URL: https://www.ahajournals.org/doi/10.1161/CIR.0000000000001423
//
// Recommendation (paraphrased across multiple authoritative summaries
// of the 2026 guideline; primary Circulation PDF returned HTTP 403
// this session):
//   "ApoB testing can be useful to improve risk assessment and
//    guide therapy once LDL-C and non-HDL-C goals are met,
//    particularly in those with elevated triglycerides (>200 mg/dL),
//    diabetes, or low achieved LDL-C (<70 mg/dL)."
//
//   AHA press release framing: "Measuring apoB may be used to assess
//    any residual ASCVD risk and guide treatment among people with
//    cardiovascular-kidney-metabolic syndrome, Type 2 diabetes, high
//    triglycerides or known cardiovascular disease who have reached
//    their LDL-C and non-HDL-C goals."
//
// Class of Recommendation: not pinned to primary text this session
//   (Circulation paywall). Wording "can be useful" / "may be used"
//   is consistent with Class IIa, not Class I. To be confirmed at
//   next review (2027-05-13 gate).
// Level of Evidence: not pinned this session.
//
// Rule shape: CONDITIONAL-POPULATION SCREENING GAP. Distinct from
// the universal-screening-gap pattern in lp-a-screening.ts (which
// fires for all adults). This rule only fires when the patient
// meets a qualifying condition — matching the guideline's selective
// "useful in a defined high-risk subgroup" framing. See ADR 0008.
//
// Qualifying conditions (any one suffices):
//   - Diabetes (ICD-10 E10.x or E11.x)
//   - Established ASCVD (ICD-10 I20.x–I25.x, I63.x, I70.x)
//   - Most recent LDL-C measurement < 70 mg/dL (achieved goal proxy)
//   - Most recent triglyceride measurement > 200 mg/dL
//
// CKM (cardiovascular-kidney-metabolic) syndrome is referenced in
// the guideline but has no dedicated ICD-10 code as of 2026-05-13;
// AHA's 2023 framework relies on composite-code identification.
// CKM-specific qualification is DEFERRED to a future rule version
// once a clean code path is available. Most CKM patients qualify
// indirectly through the diabetes path.
//
// Adult age threshold: ≥18, mirroring lp-a-screening.ts.
//
// Suppression: any ApoB observation in the lifetime bundle scan
// satisfies the recommendation regardless of value (this is a
// screening-gap rule; threshold action is deferred).
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

// ApoB LOINC codes verified against loinc.org.
//   1884-6 — Apolipoprotein B [Mass/volume] in Serum or Plasma (mg/dL).
//             Canonical US code; used by LabCorp and Quest.
export const APOB_LOINC_CODES: string[] = ['1884-6'];

// LDL-C LOINC codes (both calculated and direct).
//   13457-7 — Cholesterol in LDL [Mass/volume] in Serum or Plasma by calculation.
//   18262-6 — Cholesterol in LDL [Mass/volume] in Serum or Plasma by Direct assay.
export const LDL_LOINC_CODES: string[] = ['13457-7', '18262-6'];

// Triglyceride LOINC code (the canonical US code).
//   2571-8 — Triglyceride [Mass/volume] in Serum or Plasma (mg/dL).
export const TG_LOINC_CODES: string[] = ['2571-8'];

// Thresholds from the 2026 guideline qualifier text.
export const APOB_LDL_AT_GOAL_THRESHOLD = 70;   // mg/dL
export const APOB_TG_ELEVATED_THRESHOLD = 200;  // mg/dL
export const APOB_ADULT_AGE_THRESHOLD = 18;

// Qualifier ICD-10 sets.
//   Diabetes: type 1 (E10.x) and type 2 (E11.x).
//   ASCVD: I20.x angina, I21.x acute MI, I22.x subsequent MI,
//          I23.x complications, I24.x other acute IHD, I25.x chronic IHD,
//          I63.x cerebral infarction, I70.x atherosclerosis.
function isDiabetesCode(code: string): boolean {
  return code.startsWith('E10') || code.startsWith('E11');
}

function isAscvdCode(code: string): boolean {
  if (code.startsWith('I63') || code.startsWith('I70')) return true;
  for (const prefix of ['I20', 'I21', 'I22', 'I23', 'I24', 'I25']) {
    if (code.startsWith(prefix)) return true;
  }
  return false;
}

const RULE_ID = 'apob-measurement';
const RULE_NAME = 'ApoB measurement (selective; 2026 ACC/AHA Dyslipidemia)';

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

function latestByLoincSet(
  bundle: PatientBundle,
  loincs: string[]
): PatientObservation | undefined {
  const matches = bundle.observations
    .filter((o) => typeof o.loincCode === 'string' && loincs.includes(o.loincCode))
    .sort((a, b) => (b.effectiveDate ?? '').localeCompare(a.effectiveDate ?? ''));
  return matches[0];
}

function hasAnyApobObservation(bundle: PatientBundle): boolean {
  return bundle.observations.some(
    (o) => typeof o.loincCode === 'string' && APOB_LOINC_CODES.includes(o.loincCode)
  );
}

interface QualifierResult {
  triggered: boolean;
  reasons: string[];
}

function evaluateQualifiers(bundle: PatientBundle): QualifierResult {
  const reasons: string[] = [];

  const conditionCodes = bundle.conditions.map((c) => c.code);
  if (conditionCodes.some(isDiabetesCode)) {
    reasons.push('diabetes');
  }
  if (conditionCodes.some(isAscvdCode)) {
    reasons.push('established ASCVD');
  }

  const latestLdl = latestByLoincSet(bundle, LDL_LOINC_CODES);
  if (latestLdl?.value !== undefined && latestLdl.value < APOB_LDL_AT_GOAL_THRESHOLD) {
    reasons.push(`achieved LDL-C < ${APOB_LDL_AT_GOAL_THRESHOLD} mg/dL (most recent: ${latestLdl.value} mg/dL)`);
  }

  const latestTg = latestByLoincSet(bundle, TG_LOINC_CODES);
  if (latestTg?.value !== undefined && latestTg.value > APOB_TG_ELEVATED_THRESHOLD) {
    reasons.push(`elevated triglycerides > ${APOB_TG_ELEVATED_THRESHOLD} mg/dL (most recent: ${latestTg.value} mg/dL)`);
  }

  return { triggered: reasons.length > 0, reasons };
}

export const apoBMeasurementRule: RuleFunction = (bundle: PatientBundle): Finding[] => {
  const nowDate = new Date();
  const now = nowDate.toISOString();

  const age = ageInYears(bundle.patient.dob, nowDate);
  if (age === undefined || age < APOB_ADULT_AGE_THRESHOLD) return [];

  // Suppression by any prior ApoB observation (lifetime scan).
  if (hasAnyApobObservation(bundle)) return [];

  // Qualifying-population check.
  const { triggered, reasons } = evaluateQualifiers(bundle);
  if (!triggered) return [];

  const reasonText = reasons.join('; ');
  return [
    {
      ruleId: RULE_ID,
      ruleName: RULE_NAME,
      severity: 'gap',
      category: 'apob-measurement',
      status: 'missing',
      summary: `ApoB never measured in patient with qualifying risk profile (${reasonText}) — 2026 ACC/AHA Dyslipidemia Guideline supports ApoB measurement to refine residual ASCVD risk.`,
      recommendation: 'Order ApoB (serum or plasma, mg/dL).',
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
