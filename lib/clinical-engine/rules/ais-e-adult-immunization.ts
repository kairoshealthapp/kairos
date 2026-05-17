// ============================================================
// AIS-E — ADULT IMMUNIZATION STATUS (HEDIS AIS-E)
//   DO NOT MODIFY WITHOUT CLINICAL REVIEW
//
// HEDIS measure ID: AIS-E (Adult Immunization Status).
//   NCQA HEDIS MY 2026. NCQA proprietary spec text is NOT
//   reproduced; this rule independently encodes ACIP cadence per
//   antigen.
//   URL: https://www.ncqa.org/hedis/measures/adult-immunization-status/
//
// Underlying authority:
//   ACIP — Advisory Committee on Immunization Practices, CDC.
//   Recommended Adult Immunization Schedule, United States, 2026.
//   Murthy N, et al. Ann Intern Med. 2026. (annual update)
//   URL: https://www.cdc.gov/vaccines/hcp/imz-schedules/adult-age.html
//
// Recommendation: per-antigen ACIP cadence for adults.
//
// Rule shape: NEW VARIANT — "Per-item gap fan-out".
//   This is the first rule that emits MULTIPLE Findings per patient,
//   one per missing vaccine. Each Finding is independently
//   actionable (a single shot order). Documented in rule-shapes.md.
//
// Antigens modeled in v1 (with ACIP cadence and CVX codes):
//   - Influenza (annual):        CVX 140, 141, 150, 158, 161, 168, 185, 186, 188, 197, 205
//   - Tdap (every 10 years):     CVX 115
//   - Pneumococcal (≥65 OR qualifying high-risk condition):
//        PCV15  CVX 215
//        PCV20  CVX 216
//        PCV21  CVX 332
//        PPSV23 CVX 33
//   - Zoster RZV (Shingrix, ≥50, 2-dose series):  CVX 187
//   - COVID-19 (≥65 per current ACIP):
//        CVX 207, 208, 210, 211, 212, 213, 217, 218, 219, 221, 227, 228, 229,
//        230, 300, 301, 302
//
// Pneumococcal high-risk conditions (ACIP):
//   asthma (J45.x), COPD (J44.x), diabetes (E10.x/E11.x),
//   heart failure (I50.x), CKD (N18.x), chronic liver disease (K70.x/K74.x).
//
// Recency / cadence per antigen:
//   - Flu: most recent dose in current flu season (last 12 months).
//   - Tdap: most recent dose in last 10 years.
//   - Pneumococcal: any pneumococcal dose in lifetime if eligible.
//   - Zoster RZV: any dose in lifetime if ≥50.
//   - COVID-19: most recent dose in last 12 months if ≥65.
//
// v1 scope decisions:
//   - HPV (≥27 catch-up), hepatitis A/B, MMR, varicella catch-up
//     NOT modeled.
//   - Zoster two-dose-series completeness NOT modeled (any single
//     RZV dose satisfies v1).
//   - Pregnancy / immunocompromised special cadences NOT modeled.
//   - CVX matching by `loincCode` field (PatientObservation has no
//     dedicated immunization slot; CVX-coded observations are how
//     we represent vaccines in v1). A future PatientImmunization
//     slot is a v2 type-system enhancement.
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

export const AIS_AGE_MIN = 18;

// CVX code sets per antigen.
export const AIS_FLU_CVX: readonly string[] = ['140', '141', '150', '158', '161', '168', '185', '186', '188', '197', '205'];
export const AIS_TDAP_CVX: readonly string[] = ['115'];
export const AIS_PNEUMOCOCCAL_CVX: readonly string[] = ['33', '215', '216', '332'];
export const AIS_ZOSTER_CVX: readonly string[] = ['187'];
export const AIS_COVID_CVX: readonly string[] = ['207', '208', '210', '211', '212', '213', '217', '218', '219', '221', '227', '228', '229', '230', '300', '301', '302'];

export const AIS_FLU_RECENCY_MONTHS = 12;
export const AIS_TDAP_RECENCY_MONTHS = 120;
export const AIS_COVID_RECENCY_MONTHS = 12;

export const AIS_ZOSTER_AGE_MIN = 50;
export const AIS_PNEUMOCOCCAL_AGE_MIN = 65;
export const AIS_COVID_AGE_MIN = 65;

export const AIS_PNEUMO_HIGH_RISK_ICD_PREFIXES: readonly string[] = [
  'J45',  // asthma
  'J44',  // COPD
  'E10', 'E11',  // diabetes
  'I50',  // heart failure
  'N18',  // CKD
  'K70', 'K74',  // chronic liver disease
];

const RULE_ID = 'ais-e-adult-immunization';
const RULE_NAME = 'Adult Immunization Status (HEDIS AIS-E / ACIP 2026)';

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

function hasVaccineWithin(bundle: PatientBundle, cvxSet: readonly string[], windowMonths: number | undefined, now: Date): boolean {
  for (const o of bundle.observations) {
    if (!o.loincCode || !cvxSet.includes(o.loincCode)) continue;
    if (windowMonths === undefined) return true;
    if (!o.effectiveDate) continue;
    const eff = new Date(o.effectiveDate);
    if (Number.isNaN(eff.getTime())) continue;
    if (monthsBetween(eff, now) <= windowMonths) return true;
  }
  return false;
}

function hasAnyVaccine(bundle: PatientBundle, cvxSet: readonly string[]): boolean {
  return hasVaccineWithin(bundle, cvxSet, undefined, new Date());
}

function hasPneumoQualifier(bundle: PatientBundle, age: number): boolean {
  if (age >= AIS_PNEUMOCOCCAL_AGE_MIN) return true;
  return bundle.conditions.some((c) =>
    AIS_PNEUMO_HIGH_RISK_ICD_PREFIXES.some((p) => c.code.startsWith(p))
  );
}

// Keep PatientObservation import live (forward-compat).
function _typeAnchor(_: PatientObservation): void {}

function buildFinding(antigen: string, cadenceDescription: string, recommendation: string, now: string): Finding {
  return {
    ruleId: RULE_ID,
    ruleName: RULE_NAME,
    severity: 'gap',
    category: 'ais-e-adult-immunization',
    subcategory: antigen,
    status: 'missing',
    summary: `Missing ${antigen} per ACIP 2026 ${cadenceDescription}.`,
    recommendation,
    evidence: {},
    timestamp: now,
  };
}

export const aisAdultImmunizationRule: RuleFunction = (bundle: PatientBundle): Finding[] => {
  const now = new Date();
  const age = ageInYears(bundle.patient.dob, now);
  if (age === undefined || age < AIS_AGE_MIN) return [];

  const ts = now.toISOString();
  const findings: Finding[] = [];

  if (!hasVaccineWithin(bundle, AIS_FLU_CVX, AIS_FLU_RECENCY_MONTHS, now)) {
    findings.push(buildFinding('influenza', 'annual influenza recommendation', 'Order annual influenza vaccine (CVX 140/141/150/158/161/168/185/186/188/197/205, antigen-specific).', ts));
  }
  if (!hasVaccineWithin(bundle, AIS_TDAP_CVX, AIS_TDAP_RECENCY_MONTHS, now)) {
    findings.push(buildFinding('tdap', '10-year Tdap booster cadence', 'Order Tdap booster (CVX 115).', ts));
  }
  if (hasPneumoQualifier(bundle, age) && !hasAnyVaccine(bundle, AIS_PNEUMOCOCCAL_CVX)) {
    findings.push(buildFinding('pneumococcal', `pneumococcal series for ${age >= AIS_PNEUMOCOCCAL_AGE_MIN ? 'adults ≥65' : 'qualifying high-risk conditions'}`, 'Order PCV20 or PCV21 (CVX 216/332); consider PCV15+PPSV23 sequence if appropriate.', ts));
  }
  if (age >= AIS_ZOSTER_AGE_MIN && !hasAnyVaccine(bundle, AIS_ZOSTER_CVX)) {
    findings.push(buildFinding('zoster', 'recombinant zoster (Shingrix) recommendation for adults ≥50', 'Order recombinant zoster vaccine (CVX 187), two-dose series 2-6 months apart.', ts));
  }
  if (age >= AIS_COVID_AGE_MIN && !hasVaccineWithin(bundle, AIS_COVID_CVX, AIS_COVID_RECENCY_MONTHS, now)) {
    findings.push(buildFinding('covid-19', 'COVID-19 vaccination for adults ≥65 within the last 12 months', 'Order most recent ACIP-recommended COVID-19 vaccine (per 2026 schedule).', ts));
  }

  return findings;
};
