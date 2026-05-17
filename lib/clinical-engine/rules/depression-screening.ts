// ============================================================
// DEPRESSION SCREENING (HEDIS DSF-E / USPSTF 2023)
//   DO NOT MODIFY WITHOUT CLINICAL REVIEW
//
// HEDIS measure ID: DSF-E (Depression Screening and Follow-Up
//   for Adolescents and Adults). NCQA HEDIS MY 2026.
//   URL: https://www.ncqa.org/hedis/measures/depression-screening-and-follow-up-for-adolescents-and-adults/
//
// Underlying guideline source:
//   U.S. Preventive Services Task Force — Depression and Suicide
//   Risk in Adults: Screening, Final Recommendation 2023.
//   Barry MJ, et al. JAMA. 2023;329(23):2057-2067.
//   DOI: 10.1001/jama.2023.9297
//   URL: https://www.uspreventiveservicestaskforce.org/uspstf/recommendation/screening-depression-suicide-risk-adults
//
// Recommendation (verbatim, USPSTF 2023):
//   "The USPSTF recommends screening for depression in the adult
//    population, including pregnant and postpartum persons and
//    older adults."  Grade B.
//
// Rule shape: NEW VARIANT — "Two-stage screening with conditional
//   follow-up". Fires under either of two paths sharing one ruleId:
//   (a) no PHQ-2 documented in last 12 months → missing
//   (b) PHQ-2 ≥3 (positive) with no PHQ-9 follow-up → follow-up gap
//   Documented in rule-shapes.md.
//
// Population gate: adults (≥18).
//
// LOINC codes:
//   55758-7 — PHQ-2 total score
//   44249-1 — PHQ-9 total score
//
// PHQ-2 positivity threshold: ≥3 (per validated literature; PHQ-2
// positivity prompts PHQ-9 follow-up).
//
// v1 scope decisions:
//   - Adolescent path (12-17) NOT modeled (separate USPSTF rec; v2).
//   - Active depression diagnosis (F32.x, F33.x) does NOT suppress;
//     ongoing assessment is still warranted, but a v2 enhancement
//     could suppress when patient is in active treatment.
//   - Suicide risk screening — out of scope; the 2023 USPSTF
//     recommendation pair-treats depression and suicide risk but
//     suicide-risk tools have less consensus.
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

export const DEPRESSION_AGE_MIN = 18;
export const DEPRESSION_RECENCY_MONTHS = 12;
export const DEPRESSION_PHQ2_POSITIVE_THRESHOLD = 3;

export const DEPRESSION_PHQ2_LOINC = '55758-7';
export const DEPRESSION_PHQ9_LOINC = '44249-1';

const RULE_ID = 'depression-screening';
const RULE_NAME = 'Depression screening PHQ-2/PHQ-9 (HEDIS DSF-E / USPSTF 2023 Grade B)';

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

interface ScoreReading {
  value: number;
  effectiveDate: string;
}

function latestWithin(bundle: PatientBundle, loinc: string, windowMonths: number, now: Date): ScoreReading | undefined {
  const matches = bundle.observations
    .filter((o) => o.loincCode === loinc && typeof o.value === 'number' && o.effectiveDate)
    .sort((a, b) => (b.effectiveDate ?? '').localeCompare(a.effectiveDate ?? ''));
  for (const o of matches) {
    const eff = new Date(o.effectiveDate as string);
    if (Number.isNaN(eff.getTime())) continue;
    if (monthsBetween(eff, now) > windowMonths) continue;
    return { value: o.value as number, effectiveDate: o.effectiveDate as string };
  }
  return undefined;
}

export const depressionScreeningRule: RuleFunction = (bundle: PatientBundle): Finding[] => {
  const now = new Date();
  const age = ageInYears(bundle.patient.dob, now);
  if (age === undefined || age < DEPRESSION_AGE_MIN) return [];

  const ts = now.toISOString();
  const phq2 = latestWithin(bundle, DEPRESSION_PHQ2_LOINC, DEPRESSION_RECENCY_MONTHS, now);

  if (!phq2) {
    return [
      {
        ruleId: RULE_ID,
        ruleName: RULE_NAME,
        severity: 'gap',
        category: 'depression-screening',
        subcategory: 'missing-screen',
        status: 'missing',
        summary: `Adult age ${age} without PHQ-2 documented in the last ${DEPRESSION_RECENCY_MONTHS} months — USPSTF 2023 Grade B; HEDIS DSF-E.`,
        recommendation: 'Administer PHQ-2 (LOINC 55758-7). If ≥3, follow with PHQ-9 (LOINC 44249-1).',
        evidence: {
          observationsExamined: bundle.observations.map((o) => o.loincCode).filter((c): c is string => typeof c === 'string'),
        },
        timestamp: ts,
      },
    ];
  }

  if (phq2.value >= DEPRESSION_PHQ2_POSITIVE_THRESHOLD) {
    const phq9 = latestWithin(bundle, DEPRESSION_PHQ9_LOINC, DEPRESSION_RECENCY_MONTHS, now);
    if (!phq9 || phq9.effectiveDate < phq2.effectiveDate) {
      return [
        {
          ruleId: RULE_ID,
          ruleName: RULE_NAME,
          severity: 'gap',
          category: 'depression-screening',
          subcategory: 'missing-followup',
          status: 'missing',
          summary: `Positive PHQ-2 (score ${phq2.value} on ${phq2.effectiveDate}) without PHQ-9 follow-up — USPSTF 2023 / HEDIS DSF-E require positive-screen follow-up.`,
          recommendation: 'Administer PHQ-9 (LOINC 44249-1) for severity stratification and treatment planning.',
          evidence: {
            observationsExamined: [phq2.effectiveDate],
            contraindicationReason: `PHQ-2 ${phq2.value} ≥ ${DEPRESSION_PHQ2_POSITIVE_THRESHOLD}`,
          },
          timestamp: ts,
        },
      ];
    }
  }

  return [];
};
