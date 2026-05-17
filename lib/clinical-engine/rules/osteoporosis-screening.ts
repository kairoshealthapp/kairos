// ============================================================
// OSTEOPOROSIS SCREENING (DEXA)
//   DO NOT MODIFY WITHOUT CLINICAL REVIEW
//
// Underlying guideline source:
//   U.S. Preventive Services Task Force (USPSTF) — Osteoporosis to
//   Prevent Fractures: Screening, Final Recommendation 2018.
//   Curry SJ, et al. JAMA. 2018;319(24):2521-2531.
//   DOI: 10.1001/jama.2018.7498
//   URL: https://www.uspreventiveservicestaskforce.org/uspstf/recommendation/osteoporosis-screening
//
// Recommendation (verbatim, USPSTF 2018):
//   "The USPSTF recommends screening for osteoporosis with bone
//    measurement testing to prevent osteoporotic fractures in women
//    aged 65 years and older."  Grade B.
//   "The USPSTF recommends screening for osteoporosis with bone
//    measurement testing to prevent osteoporotic fractures in
//    postmenopausal women younger than 65 years who are at increased
//    risk of osteoporosis, as determined by a formal clinical risk
//    assessment tool."  Grade B.
//   For men: "The USPSTF concludes that the current evidence is
//    insufficient to assess the balance of benefits and harms of
//    screening for osteoporosis to prevent osteoporotic fractures
//    in men." Grade I.
//
// Rule shape: #4 Conditional-population screening-gap.
//
// v1 implementation:
//   - Women ≥65: fire if no DEXA in last 5 years.
//   - Men ≥70: fire (consensus society practice, e.g., NOF, ACP),
//     conservatively flagged as a manual-review supplement to the
//     USPSTF Grade I — surfaced for clinical decision.
//   - Younger postmenopausal women with risk factors: NOT modeled
//     in v1 (formal risk-assessment tool integration is v2).
//   - Risk-factor early-screen for men <70: NOT modeled.
//
// DEXA evidence (any one suffices):
//   LOINC 38269-7 (DXA composite), 24701-5 (femoral neck T-score),
//   CPT tokens 77080, 77081 in display.
//   Recency: 5 years.
//
// v1 scope decisions:
//   - "Postmenopausal <65 with risk factors" path deferred to v2.
//   - Long-term glucocorticoid (≥3 months prednisone ≥5 mg/day)
//     OR low body weight risk-factor branch NOT modeled in v1.
//   - Prior osteoporosis diagnosis (M81.x) suppresses (patient
//     already known osteoporotic; screening question moot).
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

export const OSTEO_WOMEN_AGE_MIN = 65;
export const OSTEO_MEN_AGE_MIN = 70;
export const OSTEO_RECENCY_MONTHS = 60;

export const OSTEO_DEXA_LOINC_CODES: readonly string[] = ['38269-7', '24701-5', '38267-1', '80948-3'];
export const OSTEO_DEXA_DISPLAY_TOKENS: readonly string[] = ['dexa', 'dxa', 'bone density', 'bone densitometry', '77080', '77081'];
export const OSTEO_DIAGNOSIS_ICD_PREFIXES: readonly string[] = ['M81']; // osteoporosis without current pathological fracture family

const RULE_ID = 'osteoporosis-screening';
const RULE_NAME = 'Osteoporosis screening (USPSTF 2018 Grade B for women ≥65)';

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

function hasPriorOsteoporosis(bundle: PatientBundle): boolean {
  return bundle.conditions.some((c) =>
    OSTEO_DIAGNOSIS_ICD_PREFIXES.some((p) => c.code.startsWith(p))
  );
}

function findRecentDexa(bundle: PatientBundle, now: Date): string | undefined {
  let bestDate: string | undefined;
  for (const o of bundle.observations) {
    if (!o.effectiveDate) continue;
    const loincHit = o.loincCode && OSTEO_DEXA_LOINC_CODES.includes(o.loincCode);
    const displayHit = OSTEO_DEXA_DISPLAY_TOKENS.some((t) =>
      (o.display ?? '').toLowerCase().includes(t)
    );
    if (!loincHit && !displayHit) continue;
    const eff = new Date(o.effectiveDate);
    if (Number.isNaN(eff.getTime())) continue;
    if (monthsBetween(eff, now) > OSTEO_RECENCY_MONTHS) continue;
    if (!bestDate || o.effectiveDate > bestDate) bestDate = o.effectiveDate;
  }
  return bestDate;
}

export const osteoporosisScreeningRule: RuleFunction = (bundle: PatientBundle): Finding[] => {
  const now = new Date();
  const age = ageInYears(bundle.patient.dob, now);
  if (age === undefined) return [];

  const sex = (bundle.patient.sex ?? '').toLowerCase();
  const qualifies =
    (sex === 'female' && age >= OSTEO_WOMEN_AGE_MIN) ||
    (sex === 'male' && age >= OSTEO_MEN_AGE_MIN);
  if (!qualifies) return [];

  if (hasPriorOsteoporosis(bundle)) return [];

  if (findRecentDexa(bundle, now)) return [];

  const grade = sex === 'female' ? 'B' : 'consensus society (USPSTF Grade I — clinical judgment)';
  return [
    {
      ruleId: RULE_ID,
      ruleName: RULE_NAME,
      severity: 'gap',
      category: 'osteoporosis-screening',
      status: 'missing',
      summary: `${sex === 'female' ? 'Woman' : 'Man'} age ${age} without DEXA in last 5 years — USPSTF 2018 Grade ${grade}.`,
      recommendation:
        'Order DEXA bone densitometry (CPT 77080 or 77081). Review for fragility-fracture history and other risk factors.',
      evidence: {
        observationsExamined: bundle.observations
          .map((o) => o.loincCode ?? o.display)
          .filter((c): c is string => typeof c === 'string'),
      },
      timestamp: now.toISOString(),
    },
  ];
};
