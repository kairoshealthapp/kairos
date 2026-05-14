// ============================================================
// POST-MI ACEi/ARB — TIME-BOUNDED THERAPY GAP
//   DO NOT MODIFY WITHOUT CLINICAL REVIEW
//
// Source: 2025 ACC/AHA/ACEP/NAEMSP/SCAI Guideline for the Management
//         of Patients with Acute Coronary Syndromes. Rao SV, et al.
//         Circulation. 2025;151:e00–e00. Published 2025-02-27.
//         DOI: 10.1161/CIR.0000000000001309
//
// Section 4.7 RAAS Inhibitors — Recommendation 1 (verbatim from primary
// PDF, pinned via pdftotext 2026-05-13):
//   "In high-risk patients with ACS (LVEF ≤40%, hypertension, diabetes
//    mellitus, or STEMI with anterior location), an oral angiotensin-
//    converting enzyme inhibitor (ACEi) or an angiotensin receptor
//    blocker (ARB) is indicated to reduce all-cause death and MACE."
//
// Class of Recommendation: 1. Level of Evidence: A.
//
// Section 4.7 Rec. 3 (related, lower-grade, NOT implemented in v1):
//   "In patients with ACS who are not considered high risk, an oral
//    ACEi or an ARB is reasonable to reduce MACE." — Class 2a, LOE A.
//
// v1 scope: fires when ALL of the following hold:
//   - patient has an MI ICD-10 (I21.x or I22.x) within
//     POST_MI_ACEI_TIMEFRAME_MONTHS (12), AND
//   - no active ACEi / ARB / ARNi on board (GDMT pillar-1 substitutes
//     count as suppression — sacubitril/valsartan satisfies the
//     recommendation pharmacologically), AND
//   - patient meets ≥1 high-risk criterion: LVEF ≤40% (any LVEF
//     observation ≤40), missing LVEF (safer default), hypertension
//     (I10/I11/I12/I13/I15), diabetes (E10/E11), or anterior STEMI
//     (I21.0, I21.01, I21.02, I21.09).
//
// The Class 2a "reasonable in non-high-risk ACS" path is DEFERRED to
// v2. v1 fires only on Class 1 criteria — citation-fidelity discipline
// established across Sessions 36–41.
//
// Contraindications NOT handled v1: bilateral renal artery stenosis,
// pregnancy, hyperkalemia (K+ >5.0 mmol/L), severe renal dysfunction,
// prior ACEi/ARB-induced angioedema. The recommendation field reminds
// the clinician to review.
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
import { GDMT_PILLAR_1_RXCUIS, GDMT_PILLAR_1_GENERIC_NAMES } from './gdmt-hfref';
import {
  getMostRecentMi,
  isWithinPostMiWindow,
} from './post-mi-beta-blocker';
import { LVEF_LOINC_CODES } from './hfpef-sglt2i';

export const POST_MI_ACEI_TIMEFRAME_MONTHS = 12;
export const POST_MI_ACEI_LVEF_HIGH_RISK_THRESHOLD = 40;  // ≤40% qualifies as high-risk per guideline

// Anterior STEMI prefix: I21.0 covers I21.0, I21.01, I21.02, I21.09.
function isAnteriorStemiCode(code: string): boolean {
  return code.startsWith('I21.0');
}

function isHypertensionCode(code: string): boolean {
  if (code === 'I10') return true;
  for (const prefix of ['I11', 'I12', 'I13', 'I15']) {
    if (code.startsWith(prefix)) return true;
  }
  return false;
}

function isDiabetesCode(code: string): boolean {
  return code.startsWith('E10') || code.startsWith('E11');
}

const RULE_ID = 'post-mi-acei-arb';
const RULE_NAME = 'Post-MI ACEi/ARB (2025 ACC/AHA ACS §4.7 Rec. 1)';

function latestLvef(bundle: PatientBundle): PatientObservation | undefined {
  const matches = bundle.observations
    .filter((o) => typeof o.loincCode === 'string' && LVEF_LOINC_CODES.includes(o.loincCode))
    .sort((a, b) => (b.effectiveDate ?? '').localeCompare(a.effectiveDate ?? ''));
  return matches[0];
}

function onActiveAceiArbArni(bundle: PatientBundle): boolean {
  for (const med of bundle.medications) {
    if (med.status !== 'active') continue;
    if (med.rxnormCode && GDMT_PILLAR_1_RXCUIS.includes(med.rxnormCode)) return true;
    const haystacks = [med.genericName, med.name]
      .filter((s): s is string => typeof s === 'string')
      .map((s) => s.toLowerCase());
    if (haystacks.length === 0) continue;
    if (GDMT_PILLAR_1_GENERIC_NAMES.some((g) => haystacks.some((h) => h.includes(g.toLowerCase())))) {
      return true;
    }
  }
  return false;
}

export const postMiAceiArbRule: RuleFunction = (bundle: PatientBundle): Finding[] => {
  const nowDate = new Date();

  const mi = getMostRecentMi(bundle);
  if (!mi) return [];
  if (!isWithinPostMiWindow(mi.onsetDate, nowDate, POST_MI_ACEI_TIMEFRAME_MONTHS)) {
    return [];
  }

  if (onActiveAceiArbArni(bundle)) return [];

  // High-risk evaluation.
  const highRiskReasons: string[] = [];
  const lvef = latestLvef(bundle);
  if (lvef?.value === undefined) {
    highRiskReasons.push('LVEF not documented (safer-default high-risk)');
  } else if (lvef.value <= POST_MI_ACEI_LVEF_HIGH_RISK_THRESHOLD) {
    highRiskReasons.push(`LVEF ${lvef.value}% (≤${POST_MI_ACEI_LVEF_HIGH_RISK_THRESHOLD})`);
  }

  const codes = bundle.conditions.map((c) => c.code);
  if (codes.some(isHypertensionCode)) highRiskReasons.push('hypertension');
  if (codes.some(isDiabetesCode)) highRiskReasons.push('diabetes mellitus');
  if (codes.some(isAnteriorStemiCode)) highRiskReasons.push('anterior STEMI');

  if (highRiskReasons.length === 0) return [];

  const now = nowDate.toISOString();
  const miLabel = mi.display ?? mi.code;
  const miDateText = mi.onsetDate ? ` (onset ${mi.onsetDate})` : '';

  return [
    {
      ruleId: RULE_ID,
      ruleName: RULE_NAME,
      severity: 'gap',
      category: 'post-mi-acei-arb',
      status: 'missing',
      summary: `Post-MI ${miLabel}${miDateText} without ACEi/ARB — Class 1, LOE A (2025 ACC/AHA ACS §4.7 Rec. 1). High-risk criteria met: ${highRiskReasons.join(', ')}.`,
      recommendation:
        'Initiate an ACEi, ARB, or ARNi. Review for bilateral renal artery stenosis, pregnancy, hyperkalemia, severe renal dysfunction, and prior angioedema before prescribing.',
      evidence: {
        conditionsExamined: bundle.conditions.map((c) => c.code),
        observationsExamined: bundle.observations
          .map((o) => o.loincCode)
          .filter((c): c is string => typeof c === 'string'),
        contraindicationReason: highRiskReasons.join('; '),
      },
      timestamp: now,
    },
  ];
};
