// ============================================================
// POST-MI BETA-BLOCKER — TIME-BOUNDED THERAPY GAP
//   DO NOT MODIFY WITHOUT CLINICAL REVIEW
//
// Source: 2025 ACC/AHA/ACEP/NAEMSP/SCAI Guideline for the Management
//         of Patients with Acute Coronary Syndromes. Rao SV, et al.
//         Circulation. 2025;151:e00–e00. Published 2025-02-27.
//         DOI: 10.1161/CIR.0000000000001309
//         URL: https://www.ahajournals.org/doi/10.1161/CIR.0000000000001309
//
// Section 4.6 Beta-Blocker Therapy — Recommendation 1 (verbatim from
// primary PDF, pinned via pdftotext 2026-05-13):
//   "In patients with ACS without contraindications, early (<24 hours)
//    initiation of oral beta-blocker therapy is recommended to reduce
//    risk of reinfarction and ventricular arrhythmias."
//
// Class of Recommendation: 1. Level of Evidence: A.
//
// Supportive text (verbatim): "The clinical benefit of beta blockers
// in patients with left ventricular ejection fraction (LVEF) <40% and
// stabilized HF is well established, including patients post-MI...
// The optimal duration of beta-blocker use remains unclear in patients
// with preserved LVEF."
//
// v1 scope and time-bound rationale:
//   The 2025 guideline's Class 1 recommendation is about EARLY (in-hospital,
//   <24 hours) initiation. For OUTPATIENT post-MI care — Kairos's actual
//   surface — the clinical question is "is this recent-MI patient on a
//   BB?" rather than "did they get one within 24 hours of presentation?"
//   v1 fires when:
//     - patient has an MI ICD-10 (I21.x or I22.x) dated within the last
//       POST_MI_BB_TIMEFRAME_MONTHS (12), AND
//     - no active evidence-based beta-blocker is on board.
//   Beyond 12 months — and especially in preserved-LVEF patients per
//   the REDUCE-AMI trial referenced in the supportive text — the long-term
//   benefit is no longer Class 1 universally. Beyond-12-month logic
//   (LVEF-stratified) is a v2 candidate. See ADR 0013.
//
// Evidence-based BB set (reused from GDMT HFrEF rule):
//   metoprolol succinate, carvedilol, bisoprolol.
// Metoprolol tartrate is NOT acceptable post-MI (same short-acting
// dosing-instability issue that makes it non-GDMT for HFrEF — see
// ADR 0003). Patient on metoprolol tartrate post-MI fires the rule
// with status 'non-evidence-based', mirroring GDMT's tartrate-trap
// finding shape.
//
// Atenolol and propranolol are NOT in the evidence-based set used here.
// The 2025 guideline does not name specific agents in the Class 1
// recommendation, but Kairos's evidence-based set is anchored to the
// HF-trial-validated agents already in the engine. Documented in ADR.
//
// Contraindications NOT handled in v1: severe bradycardia, high-degree
// AV block without pacer, decompensated HF, severe bronchospasm. The
// rule recommendation field reminds the clinician to review. v2 could
// add condition-coded contraindications (J45.5x, I44.x, R00.1).
//
// lastReviewed: 2026-05-13
// reviewedBy:   Brandon Sterne, RN BSN
// nextReviewDue: 2027-05-13
// ============================================================

import type {
  Finding,
  PatientBundle,
  PatientCondition,
  PatientMedication,
  RuleFunction,
} from '../types';
import {
  GDMT_BB_RXCUIS,
  GDMT_BB_GENERIC_NAMES,
  GDMT_BB_NON_EVIDENCE_BASED,
} from './gdmt-hfref';

// ── Recent-MI ICD-10 codes ───────────────────────────────────────────────────
// I21.x — Acute MI (including I21.0 anterior STEMI, I21.1 inferior STEMI,
//   I21.2 other site STEMI, I21.3 unspecified STEMI, I21.4 NSTEMI,
//   I21.9 unspecified, I21.A1 type 2 MI, I21.A9 other MI types).
// I22.x — Subsequent ST/non-ST MI of new onset (within 4 weeks of prior).
// Both prefix-match. I25.2 (old MI / personal history of MI) is NOT in
// this set — it indicates an MI without time anchor and would over-fire
// the rule. The recent-MI window is enforced by Condition.onsetDate
// rather than by the ICD code alone.
function isRecentMiCode(code: string): boolean {
  return code.startsWith('I21') || code.startsWith('I22');
}

export const POST_MI_BB_TIMEFRAME_MONTHS = 12;

const RULE_ID = 'post-mi-beta-blocker';
const RULE_NAME = 'Post-MI beta-blocker (2025 ACC/AHA ACS §4.6 Rec. 1)';

// ── Helpers ──────────────────────────────────────────────────────────────────
function monthsBetween(earlier: Date, later: Date): number {
  const years = later.getUTCFullYear() - earlier.getUTCFullYear();
  const months = later.getUTCMonth() - earlier.getUTCMonth();
  let total = years * 12 + months;
  if (later.getUTCDate() < earlier.getUTCDate()) total -= 1;
  return total;
}

export function getMostRecentMi(
  bundle: PatientBundle
): PatientCondition | undefined {
  const matches = bundle.conditions
    .filter((c) => isRecentMiCode(c.code))
    .sort((a, b) => (b.onsetDate ?? '').localeCompare(a.onsetDate ?? ''));
  return matches[0];
}

export function isWithinPostMiWindow(
  onsetDate: string | undefined,
  asOf: Date,
  months: number
): boolean {
  if (!onsetDate) return false;
  const onset = new Date(onsetDate);
  if (Number.isNaN(onset.getTime())) return false;
  return monthsBetween(onset, asOf) < months;
}

function activeBetaBlocker(bundle: PatientBundle): PatientMedication | undefined {
  for (const med of bundle.medications) {
    if (med.status !== 'active') continue;
    if (med.rxnormCode && GDMT_BB_RXCUIS.includes(med.rxnormCode)) return med;
    const haystacks = [med.genericName, med.name]
      .filter((s): s is string => typeof s === 'string')
      .map((s) => s.toLowerCase());
    if (haystacks.length === 0) continue;
    if (GDMT_BB_GENERIC_NAMES.some((g) => haystacks.some((h) => h.includes(g.toLowerCase())))) {
      return med;
    }
  }
  return undefined;
}

function activeNonEvidenceBb(bundle: PatientBundle): PatientMedication | undefined {
  for (const med of bundle.medications) {
    if (med.status !== 'active') continue;
    const haystacks = [med.genericName, med.name]
      .filter((s): s is string => typeof s === 'string')
      .map((s) => s.toLowerCase());
    if (haystacks.length === 0) continue;
    if (GDMT_BB_NON_EVIDENCE_BASED.some((neb) => haystacks.some((h) => h.includes(neb.toLowerCase())))) {
      return med;
    }
  }
  return undefined;
}

// ── Rule ─────────────────────────────────────────────────────────────────────
export const postMiBetaBlockerRule: RuleFunction = (
  bundle: PatientBundle
): Finding[] => {
  const nowDate = new Date();

  const mi = getMostRecentMi(bundle);
  if (!mi) return [];
  if (!isWithinPostMiWindow(mi.onsetDate, nowDate, POST_MI_BB_TIMEFRAME_MONTHS)) {
    return [];
  }

  // Patient on evidence-based BB → suppress.
  if (activeBetaBlocker(bundle)) return [];

  const now = nowDate.toISOString();
  const miLabel = mi.display ?? mi.code;
  const miDateText = mi.onsetDate ? ` (onset ${mi.onsetDate})` : '';

  // Patient on non-evidence-based BB (metoprolol tartrate) → fire with
  // non-evidence-based status, mirroring GDMT tartrate-trap pattern.
  const nonEvidenceBb = activeNonEvidenceBb(bundle);
  if (nonEvidenceBb) {
    return [
      {
        ruleId: RULE_ID,
        ruleName: RULE_NAME,
        severity: 'warning',
        category: 'post-mi-beta-blocker',
        status: 'non-evidence-based',
        summary: `Post-MI ${miLabel}${miDateText}: patient on ${nonEvidenceBb.name}, which is not evidence-based for post-MI mortality benefit. Class 1, LOE A (2025 ACC/AHA ACS).`,
        recommendation: `Switch to evidence-based beta-blocker: ${GDMT_BB_GENERIC_NAMES.join(', ')}. Review for contraindications before titrating.`,
        evidence: {
          conditionsExamined: bundle.conditions.map((c) => c.code),
          medicationsExamined: [nonEvidenceBb.name],
        },
        timestamp: now,
      },
    ];
  }

  return [
    {
      ruleId: RULE_ID,
      ruleName: RULE_NAME,
      severity: 'gap',
      category: 'post-mi-beta-blocker',
      status: 'missing',
      summary: `Post-MI ${miLabel}${miDateText} without beta-blocker — Class 1, LOE A (2025 ACC/AHA ACS §4.6 Rec. 1). Reduces reinfarction and ventricular arrhythmia risk.`,
      recommendation: `Initiate evidence-based beta-blocker: ${GDMT_BB_GENERIC_NAMES.join(', ')}. Review for contraindications (acute HF, severe bradycardia, high-degree AV block without pacer, severe bronchospasm) before initiation.`,
      evidence: {
        conditionsExamined: bundle.conditions.map((c) => c.code),
        medicationsExamined: bundle.medications
          .filter((m) => m.status === 'active')
          .map((m) => m.name),
      },
      timestamp: now,
    },
  ];
};
