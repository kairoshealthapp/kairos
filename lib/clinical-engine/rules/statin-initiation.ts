// ============================================================
// STATIN INITIATION — THRESHOLD-RULE SHAPE
//   DO NOT MODIFY WITHOUT CLINICAL REVIEW
//
// Source: 2026 ACC/AHA/AACVPR/ABC/ACPM/ADA/AGS/APhA/ASPC/NLA/PCNA
//         Guideline on the Management of Dyslipidemia.
//         Circulation. Published online 2026-03-13.
//         DOI: 10.1161/CIR.0000000000001423
//         URL: https://www.ahajournals.org/doi/10.1161/CIR.0000000000001423
//
// Multiple recommendations apply. Three deterministic threshold
// paths are implemented in this v1 (each represents a Class I or
// equivalent indication in the 2026 guideline; exact wording and
// Class designations are not pinned to the primary Circulation
// text this session because the PDF is paywalled, but secondary
// summaries from ACC, AHA, JACC at-a-glance, NLA and HCPLive are
// consistent on the three paths below):
//
//   1. SECONDARY PREVENTION: any established ASCVD diagnosis
//      (ICD-10 I20–I25, I63.x, I70.x). LDL-C goal in this group is
//      <55 mg/dL per the 2026 guideline; statin therapy is the
//      foundation. We surface a gap if no active statin is on
//      board, regardless of current LDL.
//
//   2. SEVERE HYPERCHOLESTEROLEMIA: most recent LDL-C ≥ 190 mg/dL.
//      The 2026 guideline (and prior 2018 ACC/AHA Cholesterol
//      Guideline) recommend high-intensity statin therapy in this
//      group; familial hypercholesterolemia genetic testing is
//      also recommended once a secondary cause is excluded.
//
//   3. DIABETES (age 40–75): primary prevention. The 2026 guideline
//      verbatim per AHA press release: "LDL-lowering therapy is
//      recommended for primary prevention in adults aged 40 to 75
//      years with diabetes, chronic kidney disease stage 3 or 4,
//      or human immunodeficiency virus, regardless of LDL-C level."
//      This v1 implements the diabetes arm only; CKD-3/4 and HIV
//      arms are deferred to v2 (need broader code coverage).
//
// PREVENT-ASCVD risk-calculator path is DEFERRED to a future rule
// version. The PREVENT equations require BP, smoking status, and
// other inputs not consistently present in PatientBundle. See
// docs/decisions/0009-statin-initiation-rule.md.
//
// Suppression: any active statin prescription (RxNorm match to
// STATIN_RXCUIS or generic-name fallback) suppresses all paths.
// Inactive prescriptions (status !== 'active') do NOT suppress —
// the rule is about *current* therapy.
//
// Contraindication handling: this rule does NOT inspect rhabdo
// history, active liver disease, pregnancy, or statin allergy.
// Per the GDMT rule precedent, contraindications are surfaced by
// the clinician at the bedside; the engine surfaces the gap.
// See ADR 0009.
//
// Emit semantics: ONE Finding per qualifying patient, summarising
// all triggered paths in the summary string and the
// `evidence.contraindicationReason` field (repurposed as
// "qualifyingPaths" semantics for this rule — see ADR 0009).
// Single actionable clinical action ("start a statin"), single
// chip surfaced to the clinician.
//
// lastReviewed: 2026-05-13
// reviewedBy:   Brandon Sterne, RN BSN
// nextReviewDue: 2027-05-13
// ============================================================

import type {
  Finding,
  PatientBundle,
  PatientCondition,
  PatientObservation,
  RuleFunction,
} from '../types';

// Statin ingredient RxCUIs verified against the live RxNorm REST
// API (rxnav.nlm.nih.gov) on 2026-05-13.
export const STATIN_RXCUIS: Record<string, string> = {
  atorvastatin: '83367',
  rosuvastatin: '301542',
  simvastatin: '36567',
  pravastatin: '42463',
  lovastatin: '6472',
  pitavastatin: '861634',
  fluvastatin: '41127',
};

export const STATIN_RXCUI_SET: ReadonlySet<string> = new Set(
  Object.values(STATIN_RXCUIS)
);

export const STATIN_GENERIC_NAMES: readonly string[] = Object.freeze(
  Object.keys(STATIN_RXCUIS)
);

// LDL-C LOINC codes (calculated and direct).
export const STATIN_LDL_LOINC_CODES: readonly string[] = ['13457-7', '18262-6'];

// Thresholds.
export const STATIN_LDL_SEVERE_THRESHOLD = 190;   // mg/dL
export const STATIN_DIABETES_AGE_MIN = 40;
export const STATIN_DIABETES_AGE_MAX = 75;

const RULE_ID = 'statin-initiation';
const RULE_NAME = 'Statin initiation gap (2026 ACC/AHA Dyslipidemia)';

function isAscvdCode(code: string): boolean {
  if (code.startsWith('I63') || code.startsWith('I70')) return true;
  for (const prefix of ['I20', 'I21', 'I22', 'I23', 'I24', 'I25']) {
    if (code.startsWith(prefix)) return true;
  }
  return false;
}

function isDiabetesCode(code: string): boolean {
  return code.startsWith('E10') || code.startsWith('E11');
}

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

function latestLdl(bundle: PatientBundle): PatientObservation | undefined {
  const matches = bundle.observations
    .filter(
      (o) => typeof o.loincCode === 'string' &&
        STATIN_LDL_LOINC_CODES.includes(o.loincCode)
    )
    .sort((a, b) => (b.effectiveDate ?? '').localeCompare(a.effectiveDate ?? ''));
  return matches[0];
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

function findAscvdCondition(bundle: PatientBundle): PatientCondition | undefined {
  return bundle.conditions.find((c) => isAscvdCode(c.code));
}

function findDiabetesCondition(bundle: PatientBundle): PatientCondition | undefined {
  return bundle.conditions.find((c) => isDiabetesCode(c.code));
}

export const statinInitiationRule: RuleFunction = (bundle: PatientBundle): Finding[] => {
  // Suppression: patient is already on a statin — no gap regardless of path.
  if (onActiveStatin(bundle)) return [];

  const paths: string[] = [];

  // Path 1: secondary prevention.
  const ascvd = findAscvdCondition(bundle);
  if (ascvd) {
    paths.push(
      `secondary prevention (${ascvd.display ?? ascvd.code})`
    );
  }

  // Path 2: severe hypercholesterolemia (most recent LDL ≥ 190).
  const ldl = latestLdl(bundle);
  if (ldl?.value !== undefined && ldl.value >= STATIN_LDL_SEVERE_THRESHOLD) {
    paths.push(
      `severe hypercholesterolemia (most recent LDL-C ${ldl.value} mg/dL ≥ ${STATIN_LDL_SEVERE_THRESHOLD})`
    );
  }

  // Path 3: diabetes age 40–75 (primary prevention).
  const nowDate = new Date();
  const age = ageInYears(bundle.patient.dob, nowDate);
  const diabetes = findDiabetesCondition(bundle);
  if (
    diabetes &&
    age !== undefined &&
    age >= STATIN_DIABETES_AGE_MIN &&
    age <= STATIN_DIABETES_AGE_MAX
  ) {
    paths.push(
      `diabetes age ${STATIN_DIABETES_AGE_MIN}–${STATIN_DIABETES_AGE_MAX} (${diabetes.display ?? diabetes.code}, age ${age})`
    );
  }

  if (paths.length === 0) return [];

  const now = nowDate.toISOString();
  const pathsText = paths.join('; ');

  return [
    {
      ruleId: RULE_ID,
      ruleName: RULE_NAME,
      severity: 'gap',
      category: 'statin-initiation',
      status: 'missing',
      summary: `Statin initiation indicated — ${pathsText}. 2026 ACC/AHA Dyslipidemia Guideline.`,
      recommendation: 'Initiate statin therapy. Review for contraindications (active liver disease, pregnancy, statin allergy, rhabdomyolysis history) before prescribing.',
      evidence: {
        conditionsExamined: bundle.conditions.map((c) => c.code),
        observationsExamined: bundle.observations
          .map((o) => o.loincCode)
          .filter((c): c is string => typeof c === 'string'),
        contraindicationReason: pathsText,
      },
      timestamp: now,
    },
  ];
};
