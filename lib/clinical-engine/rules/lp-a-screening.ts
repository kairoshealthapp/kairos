// ============================================================
// Lp(a) UNIVERSAL SCREENING — DO NOT MODIFY WITHOUT CLINICAL REVIEW
//
// Source: 2026 ACC/AHA/AACVPR/ABC/ACPM/ADA/AGS/APhA/ASPC/NLA/PCNA
//         Guideline on the Management of Dyslipidemia.
//         Circulation. Published online 2026-03-13.
//         DOI: 10.1161/CIR.0000000000001423
//         URL: https://www.ahajournals.org/doi/10.1161/CIR.0000000000001423
//
// Recommendation (verbatim across primary press release and multiple
// independent summaries):
//   "Lp(a) should be measured at least once in adulthood."
//
// Class of Recommendation: I (universal Lp(a) screening — first time
//   any US guideline has issued a Class I screening recommendation
//   for Lp(a)).
// Level of Evidence: not pinned to primary text in this implementation
//   session (full Circulation PDF was paywalled / 403). Secondary
//   sources consistently report Class I; LOE is to be confirmed at
//   next review.
//
// Adult age threshold: guideline wording is "in adulthood" with no
//   explicit numeric start age. We apply the US adult convention of
//   age >= 18. Pediatric Lp(a) screening has separate considerations
//   per the guideline and is OUT OF SCOPE for this rule.
//
// Frequency: once in a lifetime. Lp(a) is genetically determined and
//   stable; the guideline states repeat testing is generally not
//   needed. This rule therefore scans the patient's lifetime
//   observation history with no recency filter.
//
// Units: the guideline references both mg/dL and nmol/L. The two
//   canonical LOINC codes (10835-7 mass, 43583-4 moles) cover both.
//   This is a screening-GAP rule: any matching observation in the
//   bundle satisfies the gap regardless of value or unit. Threshold
//   logic (elevated Lp(a) >= 125 nmol/L / >= 50 mg/dL) is deliberately
//   DEFERRED to a future rule. See docs/decisions/0006-lpa-screening-rule.md.
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

// LOINC codes for Lp(a) in serum or plasma.
//   10835-7 — Lipoprotein a [Mass/volume] in Serum or Plasma (mg/dL).
//             Used by LabCorp (test 120188) and Quest as the primary code.
//   43583-4 — Lipoprotein a [Moles/volume] in Serum or Plasma (nmol/L).
// Multi-code support is required from day one: US labs report Lp(a)
// in either mass or molar units depending on the assay platform, and
// the guideline references both unit systems.
export const LPA_LOINC_CODES: string[] = [
  '10835-7',
  '43583-4',
];

// Adult age threshold (US convention; see header for sourcing note).
export const LPA_ADULT_AGE_THRESHOLD = 18;

const RULE_ID = 'lpa-screening';
const RULE_NAME = 'Lp(a) universal screening (once in adulthood)';

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

function hasAnyLpaObservation(bundle: PatientBundle): PatientObservation | undefined {
  return bundle.observations.find(
    (o) => typeof o.loincCode === 'string' && LPA_LOINC_CODES.includes(o.loincCode)
  );
}

export const lpaScreeningRule: RuleFunction = (bundle: PatientBundle): Finding[] => {
  const nowDate = new Date();
  const now = nowDate.toISOString();

  const age = ageInYears(bundle.patient.dob, nowDate);

  // Pediatric / unknown-age patients: out of scope. Emit nothing.
  if (age === undefined || age < LPA_ADULT_AGE_THRESHOLD) {
    return [];
  }

  // Lifetime bundle scan — no recency filter. Lp(a) is once-in-lifetime.
  if (hasAnyLpaObservation(bundle)) {
    return [];
  }

  return [
    {
      ruleId: RULE_ID,
      ruleName: RULE_NAME,
      severity: 'gap',
      category: 'lpa-screening',
      status: 'missing',
      summary:
        'Lp(a) never measured — 2026 ACC/AHA Dyslipidemia Guideline recommends once-in-adulthood Lp(a) screening (Class I).',
      recommendation:
        'Order Lp(a) (serum or plasma; mass or molar units acceptable).',
      evidence: {
        observationsExamined: bundle.observations
          .map((o) => o.loincCode)
          .filter((c): c is string => typeof c === 'string'),
      },
      timestamp: now,
    },
  ];
};
