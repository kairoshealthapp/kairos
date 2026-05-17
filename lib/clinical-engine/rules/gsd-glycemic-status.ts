// ============================================================
// GSD — GLYCEMIC STATUS ASSESSMENT FOR DIABETES (HEDIS GSD)
//   DO NOT MODIFY WITHOUT CLINICAL REVIEW
//
// HEDIS measure ID: GSD (Glycemic Status Assessment for Diabetes).
//   NCQA HEDIS MY 2026. Replaces the older HBD measure.
//   NCQA proprietary spec text is NOT reproduced here.
//   URL: https://www.ncqa.org/hedis/measures/hemoglobin-a1c-control-for-patients-with-diabetes/
//
// Underlying guideline source:
//   ADA Standards of Care in Diabetes — 2026.
//   Section 6 (Glycemic Goals and Hypoglycemia).
//   Recommendation 6.5a (paraphrased from authoritative summaries;
//   primary text behind diabetesjournals.org Care subscription):
//     "An A1C goal of <7% (53 mmol/mol) is recommended for most
//      nonpregnant adults with diabetes without significant
//      hypoglycemia."
//   And §6.4: "Perform A1C testing at least twice yearly in patients
//   who are meeting treatment goals … and quarterly in patients whose
//   therapy has changed or who are not meeting glycemic goals."
//
// HEDIS GSD threshold: A1C >9% identifies the "poor control" tail
// the measure tracks. This rule encodes that as the gap-firing
// threshold. The recency rule encodes ADA §6.4 — a patient without
// any A1C in the last 6 months is by definition not on a guideline-
// concordant testing cadence.
//
// Recommendation class / grade:
//   ADA Grade A for A1C goal recommendation.
//   ADA Grade B for testing frequency.
//   HEDIS GSD measure class: Effectiveness of Care.
//
// Rule shape: #10 Conditional-population control-gap (see
//   rule-shapes.md, introduced in ADR 0017 for CBP).
//   Two emission paths sharing one ruleId:
//     - 'missing-measurement': no A1C in last 6 months
//     - 'uncontrolled':        most recent A1C >9%
//
// Population gate: T1DM (E10.x) OR T2DM (E11.x), adults (≥18).
//
// LOINC: 4548-4 (Hemoglobin A1c/Hemoglobin.total in Blood).
//   Multi-code support omitted in v1: 4548-4 is dominant in US labs.
//   Future review can add 17856-6 (in serum or plasma) and 17855-8
//   (estimated by IFCC) if real-chart data shows them in volume.
//
// v1 scope decisions:
//   - Gestational diabetes (O24.x) NOT included.
//   - Pregnancy NOT excluded (HEDIS spec excludes; deferred).
//   - Pediatric T1DM excluded via adult-age gate (≥18).
//   - Hospice / palliative-care exclusions NOT modeled.
//   - The 7% target is the recommendation; the 9% threshold is what
//     this rule fires on to match HEDIS poor-control reporting.
//     A separate "A1C 7-9% suboptimal" rule is a v2 candidate.
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

export const GSD_DM_ICD_PREFIXES: readonly string[] = ['E10', 'E11'];
export const GSD_AGE_MIN = 18;
export const GSD_RECENCY_MONTHS = 6;
export const GSD_A1C_POOR_CONTROL_THRESHOLD = 9.0;   // %
export const GSD_A1C_LOINC = '4548-4';

const RULE_ID = 'gsd-glycemic-status';
const RULE_NAME = 'Glycemic Status Assessment for Diabetes (HEDIS GSD / ADA Standards 2026 §6)';

function ageInYears(dob: string | undefined, asOf: Date): number | undefined {
  if (!dob) return undefined;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return undefined;
  let years = asOf.getUTCFullYear() - birth.getUTCFullYear();
  const m = asOf.getUTCMonth() - birth.getUTCMonth();
  if (m < 0 || (m === 0 && asOf.getUTCDate() < birth.getUTCDate())) years -= 1;
  return years;
}

function hasDiabetes(bundle: PatientBundle): boolean {
  return bundle.conditions.some((c) =>
    GSD_DM_ICD_PREFIXES.some((p) => c.code.startsWith(p))
  );
}

function monthsBetween(a: Date, b: Date): number {
  return (
    (b.getUTCFullYear() - a.getUTCFullYear()) * 12 +
    (b.getUTCMonth() - a.getUTCMonth())
  );
}

interface A1cReading {
  value: number;
  effectiveDate: string;
}

function latestA1c(bundle: PatientBundle, now: Date): A1cReading | undefined {
  const matches = bundle.observations
    .filter((o) => o.loincCode === GSD_A1C_LOINC && typeof o.value === 'number' && o.effectiveDate)
    .sort((a, b) => (b.effectiveDate ?? '').localeCompare(a.effectiveDate ?? ''));
  for (const o of matches) {
    const eff = new Date(o.effectiveDate as string);
    if (Number.isNaN(eff.getTime())) continue;
    if (monthsBetween(eff, now) > GSD_RECENCY_MONTHS) {
      return undefined;
    }
    return { value: o.value as number, effectiveDate: o.effectiveDate as string };
  }
  return undefined;
}

export const gsdGlycemicStatusRule: RuleFunction = (bundle: PatientBundle): Finding[] => {
  if (!hasDiabetes(bundle)) return [];

  const now = new Date();
  const age = ageInYears(bundle.patient.dob, now);
  if (age === undefined || age < GSD_AGE_MIN) return [];

  const reading = latestA1c(bundle, now);
  const ts = now.toISOString();

  if (!reading) {
    return [
      {
        ruleId: RULE_ID,
        ruleName: RULE_NAME,
        severity: 'gap',
        category: 'gsd-glycemic-status',
        subcategory: 'missing-measurement',
        status: 'missing',
        summary: `Diabetes patient age ${age} without an A1C in the last ${GSD_RECENCY_MONTHS} months — ADA Standards 2026 §6.4 recommends at least twice-yearly A1C; HEDIS GSD measure requires recent assessment.`,
        recommendation: 'Order Hemoglobin A1c (LOINC 4548-4) and reassess glycemic regimen.',
        evidence: {
          conditionsExamined: bundle.conditions.map((c) => c.code),
          observationsExamined: bundle.observations
            .map((o) => o.loincCode)
            .filter((c): c is string => typeof c === 'string'),
        },
        timestamp: ts,
      },
    ];
  }

  if (reading.value > GSD_A1C_POOR_CONTROL_THRESHOLD) {
    return [
      {
        ruleId: RULE_ID,
        ruleName: RULE_NAME,
        severity: 'gap',
        category: 'gsd-glycemic-status',
        subcategory: 'uncontrolled',
        status: 'non-evidence-based',
        summary: `Diabetes patient age ${age} with A1C ${reading.value}% (${reading.effectiveDate}) above the >${GSD_A1C_POOR_CONTROL_THRESHOLD}% poor-control threshold — ADA Standards 2026 §6.5a recommends <7% for most nonpregnant adults; HEDIS GSD flags >9%.`,
        recommendation:
          'Intensify glycemic regimen: review adherence, lifestyle, and consider intensification per ADA §9 (pharmacologic therapy for type 2 diabetes) or §9 for type 1.',
        evidence: {
          conditionsExamined: bundle.conditions.map((c) => c.code),
          observationsExamined: [reading.effectiveDate],
          contraindicationReason: `A1C ${reading.value}% on ${reading.effectiveDate}`,
        },
        timestamp: ts,
      },
    ];
  }

  return [];
};
