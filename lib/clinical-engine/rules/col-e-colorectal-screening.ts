// ============================================================
// COL-E — COLORECTAL CANCER SCREENING (HEDIS COL-E)
//   DO NOT MODIFY WITHOUT CLINICAL REVIEW
//
// HEDIS measure ID: COL-E (Colorectal Cancer Screening).
//   NCQA HEDIS MY 2026. NCQA proprietary spec text is NOT
//   reproduced; this rule independently encodes the underlying
//   USPSTF-derived modality matrix.
//   URL: https://www.ncqa.org/hedis/measures/colorectal-cancer-screening/
//
// Underlying guideline source:
//   U.S. Preventive Services Task Force (USPSTF) — Colorectal Cancer
//   Screening, Final Recommendation 2021.
//   Davidson KW, et al. JAMA. 2021;325(19):1965-1977.
//   DOI: 10.1001/jama.2021.6238
//   URL: https://www.uspreventiveservicestaskforce.org/uspstf/recommendation/colorectal-cancer-screening
//
// Recommendation (verbatim from USPSTF 2021):
//   "The USPSTF recommends screening for colorectal cancer in all
//    adults aged 50 to 75 years."  (Grade A)
//   "The USPSTF recommends that clinicians screen for colorectal
//    cancer in adults aged 45 to 49 years."  (Grade B)
//   Ages 76-85: Grade C (individualize); 45-75 are the actionable
//   screening band.
//
// Rule shape: NEW VARIANT — "Multi-modality screening gap".
//   Extends shape #3 (universal screening) by accepting ANY of
//   several qualifying modalities with modality-specific recency
//   windows. Documented as new shape variant in rule-shapes.md.
//
// Modalities and recency windows (USPSTF acceptable options):
//   - colonoscopy:        every 10 years
//   - FIT or FOBT:        every 12 months   (LOINC 29771-3 / 14563-1)
//   - Cologuard (sDNA-FIT): every 3 years   (LOINC 77353-1)
//   - flexible sigmoidoscopy: every 5 years  (with annual FIT preferred)
//   - CT colonography:    every 5 years
//
// CPT modality codes used (procedure substring matching on
//   PatientCondition / Observation display fallback for v1):
//     45378 — colonoscopy
//     81528 — Cologuard
//     45330 — flexible sigmoidoscopy
//     74263 — CT colonography
//
// Suppression: total colectomy (ICD-10 Z90.49 family) → 0 findings.
//   Patient has no colon left to screen.
//
// Population gate: adults age 45-75.
//
// v1 scope decisions:
//   - High-risk history (Lynch syndrome, IBD, prior CRC, family hx)
//     NOT modeled. Those patients need earlier and more frequent
//     screening per society guidance, OUT OF SCOPE for v1 USPSTF.
//   - Modality matching uses (a) PatientObservation.loincCode for
//     stool tests and (b) PatientObservation.display substring for
//     procedure-based modalities. CPT-coded procedures in a future
//     ProcedureBundle slot are a v2 enhancement.
//   - Age 76-85 (USPSTF Grade C "individualize") NOT auto-fired.
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

export const COL_AGE_MIN = 45;
export const COL_AGE_MAX = 75;

// ── Stool-test LOINC codes ───────────────────────────────────────────────────
export const COL_FIT_FOBT_LOINC_CODES: readonly string[] = ['29771-3', '14563-1', '57905-2', '14564-9'];
export const COL_COLOGUARD_LOINC_CODES: readonly string[] = ['77353-1', '77354-9'];

// ── Procedure display-substring matching (v1 simplification) ─────────────────
// Lowercased; matched as `display.toLowerCase().includes(token)`.
export const COL_COLONOSCOPY_DISPLAY_TOKENS: readonly string[] = ['colonoscopy', '45378'];
export const COL_SIGMOIDOSCOPY_DISPLAY_TOKENS: readonly string[] = ['sigmoidoscopy', '45330'];
export const COL_CT_COLONOGRAPHY_DISPLAY_TOKENS: readonly string[] = ['ct colonography', 'virtual colonoscopy', '74263'];

// ── Modality recency windows (months) ───────────────────────────────────────
export const COL_RECENCY_MONTHS = {
  colonoscopy: 120,
  fitFobt: 12,
  cologuard: 36,
  sigmoidoscopy: 60,
  ctColonography: 60,
};

// ── Total colectomy suppression ──────────────────────────────────────────────
export const COL_TOTAL_COLECTOMY_ICD_PREFIXES: readonly string[] = ['Z90.49']; // history of resected organ; covers 'absence of intestine'

const RULE_ID = 'col-e-colorectal-screening';
const RULE_NAME = 'Colorectal Cancer Screening (HEDIS COL-E / USPSTF 2021 Grade A/B)';

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

function hasTotalColectomy(bundle: PatientBundle): boolean {
  return bundle.conditions.some((c) =>
    COL_TOTAL_COLECTOMY_ICD_PREFIXES.some((p) => c.code.startsWith(p))
  );
}

function observationMatchesTokens(displayLower: string, tokens: readonly string[]): boolean {
  return tokens.some((t) => displayLower.includes(t));
}

interface ModalityHit {
  modality: string;
  effectiveDate: string;
}

function findMostRecentScreening(bundle: PatientBundle): ModalityHit | undefined {
  let best: ModalityHit | undefined;
  for (const o of bundle.observations) {
    if (!o.effectiveDate) continue;
    const display = (o.display ?? '').toLowerCase();
    const loinc = o.loincCode;

    let modality: string | undefined;
    let window: number | undefined;
    if (loinc && COL_FIT_FOBT_LOINC_CODES.includes(loinc)) {
      modality = 'fit-fobt';
      window = COL_RECENCY_MONTHS.fitFobt;
    } else if (loinc && COL_COLOGUARD_LOINC_CODES.includes(loinc)) {
      modality = 'cologuard';
      window = COL_RECENCY_MONTHS.cologuard;
    } else if (observationMatchesTokens(display, COL_COLONOSCOPY_DISPLAY_TOKENS)) {
      modality = 'colonoscopy';
      window = COL_RECENCY_MONTHS.colonoscopy;
    } else if (observationMatchesTokens(display, COL_SIGMOIDOSCOPY_DISPLAY_TOKENS)) {
      modality = 'sigmoidoscopy';
      window = COL_RECENCY_MONTHS.sigmoidoscopy;
    } else if (observationMatchesTokens(display, COL_CT_COLONOGRAPHY_DISPLAY_TOKENS)) {
      modality = 'ct-colonography';
      window = COL_RECENCY_MONTHS.ctColonography;
    }

    if (!modality || window === undefined) continue;
    const eff = new Date(o.effectiveDate);
    if (Number.isNaN(eff.getTime())) continue;
    if (monthsBetween(eff, new Date()) > window) continue;

    // Use the first qualifying in-window screening (recency is bounded by window).
    if (!best || o.effectiveDate > best.effectiveDate) {
      best = { modality, effectiveDate: o.effectiveDate };
    }
  }
  return best;
}

export const colColorectalScreeningRule: RuleFunction = (bundle: PatientBundle): Finding[] => {
  const now = new Date();
  const age = ageInYears(bundle.patient.dob, now);
  if (age === undefined || age < COL_AGE_MIN || age > COL_AGE_MAX) return [];

  if (hasTotalColectomy(bundle)) return [];

  const recent = findMostRecentScreening(bundle);
  if (recent) return [];

  return [
    {
      ruleId: RULE_ID,
      ruleName: RULE_NAME,
      severity: 'gap',
      category: 'col-e-colorectal-screening',
      status: 'missing',
      summary: `Adult age ${age} without documented colorectal cancer screening in any acceptable modality window — USPSTF 2021 Grade ${age < 50 ? 'B' : 'A'}; HEDIS COL-E.`,
      recommendation:
        'Offer screening: colonoscopy (10yr), FIT/FOBT (annual), Cologuard (3yr), flexible sigmoidoscopy (5yr), or CT colonography (5yr). Patient preference and shared decision-making per USPSTF.',
      evidence: {
        observationsExamined: bundle.observations
          .map((o) => o.loincCode ?? o.display)
          .filter((c): c is string => typeof c === 'string'),
      },
      timestamp: now.toISOString(),
    },
  ];
};
