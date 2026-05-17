// ============================================================
// CBP — CONTROLLING HIGH BLOOD PRESSURE (HEDIS CBP)
//   DO NOT MODIFY WITHOUT CLINICAL REVIEW
//
// HEDIS measure ID: CBP (Controlling High Blood Pressure).
//   NCQA HEDIS MY 2026 (Healthcare Effectiveness Data and Information Set).
//   NCQA proprietary spec text is NOT reproduced here; this rule
//   independently encodes the underlying clinical threshold.
//   URL (measure overview): https://www.ncqa.org/hedis/measures/controlling-high-blood-pressure/
//
// Underlying guideline source:
//   2017 ACC/AHA/AAPA/ABC/ACPM/AGS/APhA/ASH/ASPC/NMA/PCNA Guideline
//   for the Prevention, Detection, Evaluation, and Management of High
//   Blood Pressure in Adults.
//   Whelton PK, et al. Circulation. 2018;138:e484-e594.
//   DOI: 10.1161/CIR.0000000000000596
//   URL: https://www.ahajournals.org/doi/10.1161/CIR.0000000000000596
//
// Recommendation (verbatim from the 2017 ACC/AHA HTN guideline §6
//   secondary prevention thresholds, paraphrased from authoritative
//   summaries; primary text behind Circulation access):
//     "In adults with confirmed hypertension and known CVD or 10-year
//      ASCVD risk ≥10%, a BP target of <130/80 mm Hg is recommended."
//   The HEDIS CBP measure uses the more lenient <140/90 cutoff that
//   the same guideline gives for the broader hypertensive adult
//   population. This rule applies <140/90 to match HEDIS.
//
// Class of Recommendation: I (HTN treatment to target).
// Level of Evidence: B-R for stage-1 HTN, A for stage-2 HTN.
//   Specific Class/LOE for the <140/90 control endpoint TBC at next
//   review.
//
// Rule shape: NEW VARIANT — "Conditional-population control gap".
//   Fires when patient meets condition gate AND either (a) most
//   recent qualifying measurement is above the control threshold,
//   OR (b) no qualifying measurement exists in the recency window.
//   Distinct from #3 (universal screening — no value inspection)
//   and #6 (threshold-only — no recency-gap path). Documented as
//   new shape variant in rule-shapes.md.
//
// Population gate: adults age 18-85 with HTN ICD-10
//   (I10, I11.x, I12.x, I13.x, I15.x).
//
// BP measurement: LOINC 85354-9 (BP panel) emits paired systolic
//   (8480-6) and diastolic (8462-4) components. This rule reads
//   systolic and diastolic as separate observations with the most
//   recent paired effectiveDate; or, if a single panel observation
//   carries both, it is also supported by inferring values from
//   matched-effectiveDate pairs.
//
// Recency window: 12 months. Matches HEDIS CBP measurement period
//   anchor.
//
// Control threshold: most recent systolic ≥140 OR diastolic ≥90
//   fires "uncontrolled". Anything <140/90 satisfies. Anything
//   missing in the 12-month window fires "missing measurement".
//
// v1 scope decisions:
//   - End-stage renal disease (ESRD) and pregnancy NOT excluded in
//     v1 (HEDIS spec excludes these; deferred for clinical review).
//   - Frailty/age-stratified targets (≥65 with frailty) NOT modeled.
//   - Single-arm vs. dual-arm BP averaging NOT modeled.
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

export const CBP_HTN_ICD_PREFIXES: readonly string[] = ['I10', 'I11', 'I12', 'I13', 'I15'];
export const CBP_AGE_MIN = 18;
export const CBP_AGE_MAX = 85;
export const CBP_RECENCY_MONTHS = 12;
export const CBP_SYSTOLIC_THRESHOLD = 140;   // mm Hg
export const CBP_DIASTOLIC_THRESHOLD = 90;   // mm Hg

export const CBP_BP_PANEL_LOINC = '85354-9';
export const CBP_SYSTOLIC_LOINC = '8480-6';
export const CBP_DIASTOLIC_LOINC = '8462-4';

const RULE_ID = 'cbp-hypertension-control';
const RULE_NAME = 'Controlling High Blood Pressure (HEDIS CBP / 2017 ACC/AHA HTN §6)';

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
    CBP_HTN_ICD_PREFIXES.some((p) => c.code.startsWith(p))
  );
}

function monthsBetween(a: Date, b: Date): number {
  return (
    (b.getUTCFullYear() - a.getUTCFullYear()) * 12 +
    (b.getUTCMonth() - a.getUTCMonth())
  );
}

interface BpReading {
  systolic: number;
  diastolic: number;
  effectiveDate: string;
}

function latestBpReading(bundle: PatientBundle, now: Date): BpReading | undefined {
  const sys = bundle.observations
    .filter((o) => o.loincCode === CBP_SYSTOLIC_LOINC && typeof o.value === 'number' && o.effectiveDate)
    .sort((a, b) => (b.effectiveDate ?? '').localeCompare(a.effectiveDate ?? ''));
  const dia = bundle.observations
    .filter((o) => o.loincCode === CBP_DIASTOLIC_LOINC && typeof o.value === 'number' && o.effectiveDate)
    .sort((a, b) => (b.effectiveDate ?? '').localeCompare(a.effectiveDate ?? ''));

  // Walk newest sys and pair to dia with matching effectiveDate within recency window.
  for (const s of sys) {
    const matched = dia.find((d) => d.effectiveDate === s.effectiveDate);
    if (!matched) continue;
    const eff = new Date(s.effectiveDate as string);
    if (Number.isNaN(eff.getTime())) continue;
    if (monthsBetween(eff, now) > CBP_RECENCY_MONTHS) {
      // Most-recent paired reading is stale → treat as missing.
      return undefined;
    }
    return {
      systolic: s.value as number,
      diastolic: matched.value as number,
      effectiveDate: s.effectiveDate as string,
    };
  }
  return undefined;
}

function _unused(_: PatientObservation): void { /* keep type import live */ }

export const cbpHypertensionControlRule: RuleFunction = (bundle: PatientBundle): Finding[] => {
  if (!hasHtn(bundle)) return [];

  const now = new Date();
  const age = ageInYears(bundle.patient.dob, now);
  if (age === undefined || age < CBP_AGE_MIN || age > CBP_AGE_MAX) return [];

  const reading = latestBpReading(bundle, now);
  const ts = now.toISOString();

  if (!reading) {
    return [
      {
        ruleId: RULE_ID,
        ruleName: RULE_NAME,
        severity: 'gap',
        category: 'cbp-hypertension-control',
        subcategory: 'missing-measurement',
        status: 'missing',
        summary: `HTN patient age ${age} without a paired BP measurement in the last ${CBP_RECENCY_MONTHS} months — HEDIS CBP / 2017 ACC/AHA HTN guideline expect documented BP control.`,
        recommendation:
          'Obtain a BP measurement (LOINC 85354-9 panel or paired 8480-6 systolic + 8462-4 diastolic) and reassess control.',
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

  if (reading.systolic >= CBP_SYSTOLIC_THRESHOLD || reading.diastolic >= CBP_DIASTOLIC_THRESHOLD) {
    return [
      {
        ruleId: RULE_ID,
        ruleName: RULE_NAME,
        severity: 'gap',
        category: 'cbp-hypertension-control',
        subcategory: 'uncontrolled',
        status: 'non-evidence-based',
        summary: `HTN patient age ${age} with most recent BP ${reading.systolic}/${reading.diastolic} (${reading.effectiveDate}) above the <${CBP_SYSTOLIC_THRESHOLD}/${CBP_DIASTOLIC_THRESHOLD} control target — HEDIS CBP / 2017 ACC/AHA HTN guideline.`,
        recommendation:
          'Reassess antihypertensive regimen. Consider lifestyle reinforcement, adherence review, and stepwise titration or addition of a guideline-preferred agent.',
        evidence: {
          conditionsExamined: bundle.conditions.map((c) => c.code),
          observationsExamined: [reading.effectiveDate],
          contraindicationReason: `latest BP ${reading.systolic}/${reading.diastolic}`,
        },
        timestamp: ts,
      },
    ];
  }

  return [];
};
