// ============================================================
// BCS-E — BREAST CANCER SCREENING (HEDIS BCS-E)
//   DO NOT MODIFY WITHOUT CLINICAL REVIEW
//
// HEDIS measure ID: BCS-E (Breast Cancer Screening).
//   NCQA HEDIS MY 2026. NCQA proprietary spec text is NOT
//   reproduced; this rule independently encodes the underlying
//   USPSTF-derived modality definition.
//   URL: https://www.ncqa.org/hedis/measures/breast-cancer-screening/
//
// Underlying guideline source:
//   U.S. Preventive Services Task Force (USPSTF) — Breast Cancer
//   Screening, Final Recommendation 2024.
//   Nicholson WK, et al. JAMA. 2024;331(22):1918-1930.
//   DOI: 10.1001/jama.2024.5534
//   URL: https://www.uspreventiveservicestaskforce.org/uspstf/recommendation/breast-cancer-screening
//
// Recommendation (verbatim, USPSTF 2024):
//   "The USPSTF recommends biennial screening mammography for women
//    aged 40 to 74 years."
//   Grade B.
//   The 2024 update lowered the starting age from 50 to 40 and
//   formalized biennial cadence across the band.
//
// Rule shape: NEW VARIANT — uses multi-modality screening (#11)
//   but the modality set is singleton-by-CPT (mammography family).
//   Recency window 24 months matches USPSTF biennial cadence.
//
// CPT modality codes (mammography family):
//     77065 — Diagnostic mammography unilateral
//     77066 — Diagnostic mammography bilateral
//     77067 — Screening mammography bilateral
//   Match strategy v1: display substring 'mammogram' / 'mammography'
//   OR CPT token presence.
//
// LOINC mammography:
//     24606-6 — MG Breast Diagnostic
//     24604-1 — MG Breast Screening
//
// Population gate: women age 40-74.
// Suppression: bilateral mastectomy (ICD-10 Z90.13) → 0 findings.
//
// v1 scope decisions:
//   - Sex/gender treated as PatientDemographics.sex string match
//     for 'female'. Patients with sex == undefined or other values
//     emit zero findings (safer default).
//   - Dense-breast supplemental imaging (e.g., breast MRI for
//     high-risk women) NOT modeled.
//   - High-risk hereditary populations (BRCA1/2, prior chest XRT)
//     who need earlier/MRI screening — OUT OF SCOPE for v1 USPSTF.
//   - Unilateral mastectomy does NOT suppress (contralateral breast
//     still needs screening).
//   - Age 75+ (Grade I — insufficient evidence) NOT auto-fired.
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

export const BCS_AGE_MIN = 40;
export const BCS_AGE_MAX = 74;
export const BCS_RECENCY_MONTHS = 24;

export const BCS_MAMMOGRAPHY_LOINC_CODES: readonly string[] = ['24606-6', '24604-1', '26346-7', '36625-6'];
export const BCS_MAMMOGRAPHY_DISPLAY_TOKENS: readonly string[] = ['mammogram', 'mammography', '77065', '77066', '77067'];
export const BCS_BILATERAL_MASTECTOMY_ICD_PREFIXES: readonly string[] = ['Z90.13'];

const RULE_ID = 'bcs-e-breast-screening';
const RULE_NAME = 'Breast Cancer Screening (HEDIS BCS-E / USPSTF 2024 Grade B)';

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

function isFemale(bundle: PatientBundle): boolean {
  return (bundle.patient.sex ?? '').toLowerCase() === 'female';
}

function hasBilateralMastectomy(bundle: PatientBundle): boolean {
  return bundle.conditions.some((c) =>
    BCS_BILATERAL_MASTECTOMY_ICD_PREFIXES.some((p) => c.code.startsWith(p))
  );
}

function findRecentMammogram(bundle: PatientBundle, now: Date): string | undefined {
  let bestDate: string | undefined;
  for (const o of bundle.observations) {
    if (!o.effectiveDate) continue;
    const loincHit = o.loincCode && BCS_MAMMOGRAPHY_LOINC_CODES.includes(o.loincCode);
    const displayHit = BCS_MAMMOGRAPHY_DISPLAY_TOKENS.some((t) =>
      (o.display ?? '').toLowerCase().includes(t)
    );
    if (!loincHit && !displayHit) continue;
    const eff = new Date(o.effectiveDate);
    if (Number.isNaN(eff.getTime())) continue;
    if (monthsBetween(eff, now) > BCS_RECENCY_MONTHS) continue;
    if (!bestDate || o.effectiveDate > bestDate) bestDate = o.effectiveDate;
  }
  return bestDate;
}

export const bcsBreastScreeningRule: RuleFunction = (bundle: PatientBundle): Finding[] => {
  if (!isFemale(bundle)) return [];

  const now = new Date();
  const age = ageInYears(bundle.patient.dob, now);
  if (age === undefined || age < BCS_AGE_MIN || age > BCS_AGE_MAX) return [];

  if (hasBilateralMastectomy(bundle)) return [];

  if (findRecentMammogram(bundle, now)) return [];

  return [
    {
      ruleId: RULE_ID,
      ruleName: RULE_NAME,
      severity: 'gap',
      category: 'bcs-e-breast-screening',
      status: 'missing',
      summary: `Woman age ${age} without a mammogram in the last ${BCS_RECENCY_MONTHS} months — USPSTF 2024 Grade B biennial mammography 40-74; HEDIS BCS-E.`,
      recommendation:
        'Offer screening mammography (CPT 77067 bilateral screening). Shared decision-making per USPSTF for benefit/harm tradeoffs.',
      evidence: {
        observationsExamined: bundle.observations
          .map((o) => o.loincCode ?? o.display)
          .filter((c): c is string => typeof c === 'string'),
      },
      timestamp: now.toISOString(),
    },
  ];
};
