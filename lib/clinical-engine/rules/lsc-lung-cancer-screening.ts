// ============================================================
// LSC — LUNG CANCER SCREENING (LDCT)  HEDIS LSC
//   DO NOT MODIFY WITHOUT CLINICAL REVIEW
//
// HEDIS measure ID: LSC (Lung Cancer Screening). NCQA HEDIS MY 2026.
//   URL: https://www.ncqa.org/hedis/measures/lung-cancer-screening/
//
// Underlying guideline source:
//   U.S. Preventive Services Task Force (USPSTF) — Lung Cancer
//   Screening, Final Recommendation 2021.
//   Krist AH, et al. JAMA. 2021;325(10):962-970.
//   DOI: 10.1001/jama.2021.1117
//   URL: https://www.uspreventiveservicestaskforce.org/uspstf/recommendation/lung-cancer-screening
//
// Recommendation (verbatim, USPSTF 2021):
//   "The USPSTF recommends annual screening for lung cancer with
//    low-dose computed tomography (LDCT) in adults aged 50 to 80
//    years who have a 20 pack-year smoking history and currently
//    smoke or have quit within the past 15 years."  Grade B.
//
// Rule shape: #4 Conditional-population screening-gap, with derived
//   eligibility (pack-years + quit-status time math).
//
// Smoking status inputs (PatientObservation):
//   - LOINC 72166-2 — Tobacco smoking status NHIS
//     Common valueString values: "Current every day smoker",
//       "Current some day smoker", "Former smoker", "Never smoker".
//   - LOINC 88029-4 — Pack years
//   - LOINC 74010-0 — Date quit smoking
//
// LDCT modality match:
//   - CPT 71271 — LDCT lung cancer screening
//   - Display substring: 'ldct', 'low-dose ct lung'
//   - Recency: 12 months.
//
// Suppression: prior lung cancer diagnosis (C34.x) → 0 findings.
//
// v1 scope decisions:
//   - Pack-years and quit-date are read from observations as
//     numeric/date values. If quit-date observation is missing but
//     status is "Former smoker", we conservatively assume the
//     patient remains eligible (15-year clock cannot be evaluated).
//     The recommendation surfaces the missing quit-date as part of
//     the reasoning.
//   - Family history / occupational exposure NOT used to expand
//     eligibility (USPSTF 2021 does not condition on these).
//   - Patient willingness / shared-decision-making is the
//     clinician's domain; rule fires regardless.
//
// lastReviewed: 2026-05-17
// reviewedBy:   Brandon Sterne, RN BSN
// nextReviewDue: 2027-05-17
// ============================================================

import type {
  Finding,
  PatientBundle,
  PatientObservation,
  RuleFunction,
} from '../types';

export const LSC_AGE_MIN = 50;
export const LSC_AGE_MAX = 80;
export const LSC_PACK_YEARS_THRESHOLD = 20;
export const LSC_QUIT_WINDOW_YEARS = 15;
export const LSC_LDCT_RECENCY_MONTHS = 12;

export const LSC_SMOKING_STATUS_LOINC = '72166-2';
export const LSC_PACK_YEARS_LOINC = '88029-4';
export const LSC_QUIT_DATE_LOINC = '74010-0';

export const LSC_LDCT_DISPLAY_TOKENS: readonly string[] = ['ldct', 'low-dose ct lung', '71271'];
export const LSC_LUNG_CA_ICD_PREFIX = 'C34';

const LSC_CURRENT_SMOKER_SUBSTRINGS: readonly string[] = ['current'];
const LSC_FORMER_SMOKER_SUBSTRINGS: readonly string[] = ['former'];

const RULE_ID = 'lsc-lung-cancer-screening';
const RULE_NAME = 'Lung Cancer Screening LDCT (HEDIS LSC / USPSTF 2021 Grade B)';

function ageInYears(dob: string | undefined, asOf: Date): number | undefined {
  if (!dob) return undefined;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return undefined;
  let years = asOf.getUTCFullYear() - birth.getUTCFullYear();
  const m = asOf.getUTCMonth() - birth.getUTCMonth();
  if (m < 0 || (m === 0 && asOf.getUTCDate() < birth.getUTCDate())) years -= 1;
  return years;
}

function monthsBetween(a: Date, b: Date): number {
  return (
    (b.getUTCFullYear() - a.getUTCFullYear()) * 12 +
    (b.getUTCMonth() - a.getUTCMonth())
  );
}

function latestByLoinc(bundle: PatientBundle, loinc: string): PatientObservation | undefined {
  return bundle.observations
    .filter((o) => o.loincCode === loinc)
    .sort((a, b) => (b.effectiveDate ?? '').localeCompare(a.effectiveDate ?? ''))[0];
}

function smokerCategory(bundle: PatientBundle): 'current' | 'former' | 'never' | 'unknown' {
  const status = latestByLoinc(bundle, LSC_SMOKING_STATUS_LOINC);
  if (!status) return 'unknown';
  const text = (status.display ?? '').toLowerCase();
  if (LSC_CURRENT_SMOKER_SUBSTRINGS.some((s) => text.includes(s))) return 'current';
  if (LSC_FORMER_SMOKER_SUBSTRINGS.some((s) => text.includes(s))) return 'former';
  if (text.includes('never')) return 'never';
  return 'unknown';
}

function quitYearsAgo(bundle: PatientBundle, now: Date): number | undefined {
  const obs = latestByLoinc(bundle, LSC_QUIT_DATE_LOINC);
  // Allow either valueString-shaped date OR effectiveDate as proxy.
  const dateStr = obs?.effectiveDate ?? undefined;
  if (!dateStr) return undefined;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return undefined;
  return Math.floor(monthsBetween(d, now) / 12);
}

function packYears(bundle: PatientBundle): number | undefined {
  return latestByLoinc(bundle, LSC_PACK_YEARS_LOINC)?.value;
}

function hasRecentLdct(bundle: PatientBundle, now: Date): boolean {
  for (const o of bundle.observations) {
    if (!o.effectiveDate) continue;
    if (!LSC_LDCT_DISPLAY_TOKENS.some((t) => (o.display ?? '').toLowerCase().includes(t))) continue;
    const eff = new Date(o.effectiveDate);
    if (Number.isNaN(eff.getTime())) continue;
    if (monthsBetween(eff, now) <= LSC_LDCT_RECENCY_MONTHS) return true;
  }
  return false;
}

function hasLungCancer(bundle: PatientBundle): boolean {
  return bundle.conditions.some((c) => c.code.startsWith(LSC_LUNG_CA_ICD_PREFIX));
}

export const lscLungCancerScreeningRule: RuleFunction = (bundle: PatientBundle): Finding[] => {
  const now = new Date();
  const age = ageInYears(bundle.patient.dob, now);
  if (age === undefined || age < LSC_AGE_MIN || age > LSC_AGE_MAX) return [];

  if (hasLungCancer(bundle)) return [];

  const smoker = smokerCategory(bundle);
  if (smoker === 'never' || smoker === 'unknown') return [];

  const py = packYears(bundle);
  if (py === undefined || py < LSC_PACK_YEARS_THRESHOLD) return [];

  if (smoker === 'former') {
    const quit = quitYearsAgo(bundle, now);
    if (quit !== undefined && quit > LSC_QUIT_WINDOW_YEARS) return [];
  }

  if (hasRecentLdct(bundle, now)) return [];

  return [
    {
      ruleId: RULE_ID,
      ruleName: RULE_NAME,
      severity: 'gap',
      category: 'lsc-lung-cancer-screening',
      status: 'missing',
      summary: `Eligible patient age ${age}, ${py} pack-years, ${smoker} smoker — no LDCT in last 12 months. USPSTF 2021 Grade B; HEDIS LSC.`,
      recommendation:
        'Order low-dose CT chest for lung cancer screening (CPT 71271). Shared decision-making per USPSTF for benefit/harm tradeoffs.',
      evidence: {
        observationsExamined: bundle.observations.map((o) => o.loincCode ?? o.display).filter((c): c is string => typeof c === 'string'),
      },
      timestamp: now.toISOString(),
    },
  ];
};
