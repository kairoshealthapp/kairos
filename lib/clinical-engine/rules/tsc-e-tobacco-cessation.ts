// ============================================================
// TSC-E — TOBACCO USE SCREENING AND CESSATION (HEDIS TSC-E, new MY 2026)
//   DO NOT MODIFY WITHOUT CLINICAL REVIEW
//
// HEDIS measure ID: TSC-E. New MY 2026 measure.
//   URL: https://www.ncqa.org/hedis/measures/tobacco-use-screening-and-cessation/
//
// Underlying guideline source:
//   U.S. Preventive Services Task Force — Tobacco Smoking Cessation
//   in Adults, Including Pregnant Persons: Interventions, 2021.
//   Krist AH, et al. JAMA. 2021;325(3):265-279.
//   DOI: 10.1001/jama.2020.25019
//   URL: https://www.uspreventiveservicestaskforce.org/uspstf/recommendation/tobacco-use-in-adults-and-pregnant-women-counseling-and-interventions
//
// Recommendation (verbatim, USPSTF 2021):
//   "The USPSTF recommends that clinicians ask all adults about
//    tobacco use, advise them to stop using tobacco, and provide
//    behavioral interventions and FDA-approved pharmacotherapy for
//    cessation to nonpregnant adults who use tobacco."  Grade A.
//
// Rule shape: NEW VARIANT — "Two-stage screening with conditional
//   follow-up" (#13, sibling of depression PHQ-2/PHQ-9, ADR 0024).
//   Fires under either:
//   (a) tobacco use status (LOINC 72166-2) not documented in last
//       12 months → missing-screen
//   (b) current smoker without cessation intervention (counseling
//       code or pharmacotherapy) in last 12 months → missing-cessation
//
// Cessation intervention recognized in v1:
//   - Counseling: presence of any observation with display tokens
//     'tobacco cessation counseling', 'smoking cessation counseling',
//     CPT 99406 / 99407 in display.
//   - Pharmacotherapy: active prescription for any of —
//     varenicline (RxCUI 588227), bupropion (RxCUI 42347),
//     nicotine replacement (RxCUI 7393 nicotine patch / 198029 gum
//     / 198030 lozenge / 1043400 inhaler).
//
// Population gate: adults (≥18).
//
// v1 scope decisions:
//   - Pregnant patients NOT specifically routed (USPSTF Grade A
//     covers pregnant population separately; v1 emits the same gap
//     for all adults).
//   - Brief vs intensive counseling distinction NOT modeled.
//   - Smokeless tobacco / e-cigarettes covered conceptually
//     ("tobacco use status") but not explicitly stratified.
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

export const TSC_AGE_MIN = 18;
export const TSC_RECENCY_MONTHS = 12;

export const TSC_SMOKING_STATUS_LOINC = '72166-2';
export const TSC_COUNSELING_DISPLAY_TOKENS: readonly string[] = [
  'tobacco cessation counseling',
  'smoking cessation counseling',
  '99406',
  '99407',
];
export const TSC_PHARMACOTHERAPY_GENERICS: readonly string[] = [
  'varenicline',
  'bupropion',
  'nicotine',
];

const RULE_ID = 'tsc-e-tobacco-cessation';
const RULE_NAME = 'Tobacco Use Screening and Cessation (HEDIS TSC-E / USPSTF 2021 Grade A)';

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

function latestSmokingStatus(bundle: PatientBundle, now: Date): PatientObservation | undefined {
  const matches = bundle.observations
    .filter((o) => o.loincCode === TSC_SMOKING_STATUS_LOINC && o.effectiveDate)
    .sort((a, b) => (b.effectiveDate ?? '').localeCompare(a.effectiveDate ?? ''));
  for (const o of matches) {
    const eff = new Date(o.effectiveDate as string);
    if (Number.isNaN(eff.getTime())) continue;
    if (monthsBetween(eff, now) <= TSC_RECENCY_MONTHS) return o;
  }
  return undefined;
}

function isCurrentSmoker(o: PatientObservation): boolean {
  return (o.display ?? '').toLowerCase().includes('current');
}

function hasRecentCounseling(bundle: PatientBundle, now: Date): boolean {
  for (const o of bundle.observations) {
    if (!o.effectiveDate) continue;
    const display = (o.display ?? '').toLowerCase();
    if (!TSC_COUNSELING_DISPLAY_TOKENS.some((t) => display.includes(t))) continue;
    const eff = new Date(o.effectiveDate);
    if (Number.isNaN(eff.getTime())) continue;
    if (monthsBetween(eff, now) <= TSC_RECENCY_MONTHS) return true;
  }
  return false;
}

function hasActivePharmacotherapy(bundle: PatientBundle): boolean {
  for (const med of bundle.medications) {
    if (med.status !== 'active') continue;
    const hay = [med.name, med.genericName]
      .filter((s): s is string => typeof s === 'string')
      .map((s) => s.toLowerCase());
    if (hay.length === 0) continue;
    if (TSC_PHARMACOTHERAPY_GENERICS.some((g) => hay.some((h) => h.includes(g)))) return true;
  }
  return false;
}

export const tscTobaccoCessationRule: RuleFunction = (bundle: PatientBundle): Finding[] => {
  const now = new Date();
  const age = ageInYears(bundle.patient.dob, now);
  if (age === undefined || age < TSC_AGE_MIN) return [];

  const status = latestSmokingStatus(bundle, now);
  const ts = now.toISOString();

  if (!status) {
    return [
      {
        ruleId: RULE_ID,
        ruleName: RULE_NAME,
        severity: 'gap',
        category: 'tsc-e-tobacco-cessation',
        subcategory: 'missing-screen',
        status: 'missing',
        summary: `Adult age ${age} without tobacco use status documented in last ${TSC_RECENCY_MONTHS} months — USPSTF 2021 Grade A; HEDIS TSC-E.`,
        recommendation: 'Document tobacco use status (LOINC 72166-2).',
        evidence: {
          observationsExamined: bundle.observations.map((o) => o.loincCode).filter((c): c is string => typeof c === 'string'),
        },
        timestamp: ts,
      },
    ];
  }

  if (isCurrentSmoker(status)) {
    const counseled = hasRecentCounseling(bundle, now);
    const onPharm = hasActivePharmacotherapy(bundle);
    if (!counseled && !onPharm) {
      return [
        {
          ruleId: RULE_ID,
          ruleName: RULE_NAME,
          severity: 'gap',
          category: 'tsc-e-tobacco-cessation',
          subcategory: 'missing-cessation',
          status: 'missing',
          summary: `Current tobacco user without cessation counseling or pharmacotherapy in last ${TSC_RECENCY_MONTHS} months — USPSTF 2021 Grade A.`,
          recommendation: 'Offer behavioral counseling (CPT 99406/99407) and FDA-approved pharmacotherapy (varenicline, bupropion, or nicotine replacement).',
          evidence: {
            observationsExamined: [status.effectiveDate ?? ''].filter(Boolean),
          },
          timestamp: ts,
        },
      ];
    }
  }

  return [];
};
