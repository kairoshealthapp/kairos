// ============================================================
// GDMT FOR HFrEF — DO NOT MODIFY WITHOUT CLINICAL REVIEW
// Source: ACC/AHA/HFSA 2022 Guideline for the Management of Heart Failure
// Updated: 2026-05-07
// ============================================================

import type {
  Finding,
  PatientBundle,
  PatientObservation,
  RuleFunction,
} from '../types';

// HFrEF qualifying codes.
// I50.20–I50.23 (systolic), I50.40–I50.43 (combined). HFpEF (I50.30–I50.33)
// is deliberately EXCLUDED — different drug guideline.
export const HFREF_CONDITION_CODES: string[] = [
  'I50.20', 'I50.21', 'I50.22', 'I50.23',
  'I50.40', 'I50.41', 'I50.42', 'I50.43',
  '84114007',   // SNOMED Heart failure
  '703272007',  // SNOMED Heart failure with reduced ejection fraction
];

interface PillarDef {
  displayName: string;
  rxnormCodes: string[];
  genericNames: string[];
  nonEvidenceBased?: string[];
}

type PillarKey = 'acei-arb-arni' | 'beta-blocker' | 'mra' | 'sglt2i';

export const GDMT_PILLARS: Record<PillarKey, PillarDef> = {
  'acei-arb-arni': {
    displayName: 'ACEi / ARB / ARNi',
    rxnormCodes: [
      // ACEi
      '29046',  // lisinopril
      '18867',  // enalapril
      '50166',  // ramipril
      // ARB
      '52175',  // losartan
      '321064', // valsartan
      // ARNi
      '1656328', // sacubitril/valsartan
    ],
    genericNames: [
      'lisinopril',
      'enalapril',
      'ramipril',
      'losartan',
      'valsartan',
      'sacubitril/valsartan',
      'sacubitril-valsartan',
    ],
  },
  'beta-blocker': {
    displayName: 'Evidence-based beta-blocker',
    rxnormCodes: [
      '866924', // metoprolol succinate
      '20352',  // carvedilol
      '19484',  // bisoprolol
    ],
    genericNames: ['metoprolol succinate', 'carvedilol', 'bisoprolol'],
    // CRITICAL: metoprolol tartrate is NOT GDMT-evidence-based for HFrEF.
    nonEvidenceBased: ['metoprolol tartrate'],
  },
  mra: {
    displayName: 'MRA',
    // RxCUIs verified against RxNorm (eplerenone via FDA UNII 6995V82D0B → 298869).
    rxnormCodes: [
      '8629',   // spironolactone
      '298869', // eplerenone
    ],
    genericNames: ['spironolactone', 'eplerenone'],
  },
  sglt2i: {
    displayName: 'SGLT2i',
    rxnormCodes: [
      '1545653', // dapagliflozin
      '1545664', // empagliflozin
    ],
    genericNames: ['dapagliflozin', 'empagliflozin'],
  },
};

// ── Pillar constants exported for reuse by post-MI rules ────────────────────
// Session 42: extracted from GDMT_PILLARS for direct import by
// post-mi-beta-blocker.ts and post-mi-acei-arb.ts. Same data, cleaner
// import surface for downstream rules.
export const GDMT_BB_RXCUIS: readonly string[] = GDMT_PILLARS['beta-blocker'].rxnormCodes;
export const GDMT_BB_GENERIC_NAMES: readonly string[] = GDMT_PILLARS['beta-blocker'].genericNames;
export const GDMT_BB_NON_EVIDENCE_BASED: readonly string[] =
  GDMT_PILLARS['beta-blocker'].nonEvidenceBased ?? [];
export const GDMT_PILLAR_1_RXCUIS: readonly string[] = GDMT_PILLARS['acei-arb-arni'].rxnormCodes;
export const GDMT_PILLAR_1_GENERIC_NAMES: readonly string[] = GDMT_PILLARS['acei-arb-arni'].genericNames;

export const CONTRAINDICATION_THRESHOLDS = {
  egfr_low: 30,        // mL/min/1.73m^2 — below this, MRA + SGLT2i contraindicated
  potassium_high: 5.5, // mEq/L — above this, ACEi/ARB/ARNi + MRA contraindicated
  // Severe persistent uncontrolled asthma — beta-blocker contraindicated.
  bb_contraindicated_conditions: ['J45.50', '493.91'] as string[],
};

// eGFR LOINC codes — multi-code to cover the formula variants US labs
// actually report. Verified against loinc.org on 2026-05-13.
//   33914-3 — MDRD (older; discouraged by LOINC but still active in many US labs).
//   88293-6 — CKD-EPI race-stratified (legacy; being phased out).
//   98979-8 — CKD-EPI 2021 (current standard; race-free).
// All three report the same units (mL/min/1.73m²) and the same
// contraindication threshold (<30) applies regardless of formula.
export const EGFR_LOINC_CODES: readonly string[] = [
  '33914-3',
  '88293-6',
  '98979-8',
];

const RULE_ID = 'gdmt-hfref';
const RULE_NAME = 'GDMT gap detection (HFrEF)';

function getLatestObservation(
  bundle: PatientBundle,
  loincCode: string
): PatientObservation | undefined {
  const matches = bundle.observations
    .filter((o) => o.loincCode === loincCode)
    .sort((a, b) => (b.effectiveDate ?? '').localeCompare(a.effectiveDate ?? ''));
  return matches[0];
}

function getLatestObservationByLoincSet(
  bundle: PatientBundle,
  loincCodes: readonly string[]
): PatientObservation | undefined {
  const matches = bundle.observations
    .filter((o) => typeof o.loincCode === 'string' && loincCodes.includes(o.loincCode))
    .sort((a, b) => (b.effectiveDate ?? '').localeCompare(a.effectiveDate ?? ''));
  return matches[0];
}

function medMatchesPillar(
  med: { rxnormCode?: string; name?: string; genericName?: string },
  pillar: PillarDef
): boolean {
  if (med.rxnormCode && pillar.rxnormCodes.includes(med.rxnormCode)) return true;
  const haystacks = [med.genericName, med.name]
    .filter((s): s is string => typeof s === 'string')
    .map((s) => s.toLowerCase());
  if (haystacks.length === 0) return false;
  return pillar.genericNames.some((gn) =>
    haystacks.some((h) => h.includes(gn.toLowerCase()))
  );
}

function medMatchesNonEvidence(
  med: { name?: string; genericName?: string },
  nonEvidenceBased: string[]
): boolean {
  const haystacks = [med.genericName, med.name]
    .filter((s): s is string => typeof s === 'string')
    .map((s) => s.toLowerCase());
  return nonEvidenceBased.some((neb) =>
    haystacks.some((h) => h.includes(neb.toLowerCase()))
  );
}

export const gdmtHfrefRule: RuleFunction = (bundle: PatientBundle): Finding[] => {
  const findings: Finding[] = [];

  // Step 1: gate — only fires for HFrEF.
  const hasHfref = bundle.conditions.some((c) =>
    HFREF_CONDITION_CODES.includes(c.code)
  );
  if (!hasHfref) return [];

  // Step 2: pull latest contraindication-relevant labs.
  // eGFR uses the multi-code scan to cover MDRD (33914-3), CKD-EPI
  // race-stratified (88293-6), and CKD-EPI 2021 (98979-8) — see
  // EGFR_LOINC_CODES above. Potassium remains single-code; the
  // canonical 2823-3 covers >99% of US labs.
  const latestEgfr = getLatestObservationByLoincSet(bundle, EGFR_LOINC_CODES);
  const latestK = getLatestObservation(bundle, '2823-3');

  const now = new Date().toISOString();

  // Step 3: per-pillar evaluation.
  for (const [pillarKey, pillar] of Object.entries(GDMT_PILLARS) as Array<
    [PillarKey, PillarDef]
  >) {
    // Non-evidence-based catch (currently beta-blocker only — metoprolol tartrate).
    if (pillar.nonEvidenceBased && pillar.nonEvidenceBased.length > 0) {
      const onNonEvidence = bundle.medications.find((m) =>
        medMatchesNonEvidence(m, pillar.nonEvidenceBased!)
      );
      if (onNonEvidence) {
        findings.push({
          ruleId: RULE_ID,
          ruleName: RULE_NAME,
          severity: 'warning',
          category: 'gdmt-hfref',
          subcategory: pillarKey,
          status: 'non-evidence-based',
          summary: `${pillar.displayName}: patient is on ${onNonEvidence.name}, which is not GDMT-evidence-based for HFrEF`,
          recommendation: `Consider switching to evidence-based agent: ${pillar.genericNames.join(', ')}`,
          evidence: { medicationsExamined: [onNonEvidence.name] },
          timestamp: now,
        });
        continue;
      }
    }

    // Present? Skip emitting a Finding — actionable findings only.
    // Patient-already-on data is derivable from the medication list.
    // (Future: add a `confirmations` field if pillar-by-pillar UI detail is needed.)
    const onPillar = bundle.medications.find((m) => medMatchesPillar(m, pillar));
    if (onPillar) {
      continue;
    }

    // Missing — but check contraindications first.
    let contraindicationReason: string | null = null;

    if (pillarKey === 'mra' || pillarKey === 'sglt2i') {
      if (
        latestEgfr?.value !== undefined &&
        latestEgfr.value < CONTRAINDICATION_THRESHOLDS.egfr_low
      ) {
        contraindicationReason = `eGFR ${latestEgfr.value} below threshold of ${CONTRAINDICATION_THRESHOLDS.egfr_low}`;
      }
    }
    if (pillarKey === 'acei-arb-arni' || pillarKey === 'mra') {
      if (
        latestK?.value !== undefined &&
        latestK.value > CONTRAINDICATION_THRESHOLDS.potassium_high
      ) {
        const k = `K+ ${latestK.value} above threshold of ${CONTRAINDICATION_THRESHOLDS.potassium_high}`;
        contraindicationReason = contraindicationReason
          ? `${contraindicationReason}; ${k}`
          : k;
      }
    }
    if (pillarKey === 'beta-blocker') {
      const bbContraindication = bundle.conditions.find((c) =>
        CONTRAINDICATION_THRESHOLDS.bb_contraindicated_conditions.includes(c.code)
      );
      if (bbContraindication) {
        contraindicationReason = `condition ${bbContraindication.display ?? bbContraindication.code} contraindicates beta-blocker`;
      }
    }

    const observationsExamined: string[] = [
      latestEgfr?.loincCode,
      latestK?.loincCode,
    ].filter((s): s is string => typeof s === 'string');

    findings.push({
      ruleId: RULE_ID,
      ruleName: RULE_NAME,
      severity: contraindicationReason ? 'info' : 'gap',
      category: 'gdmt-hfref',
      subcategory: pillarKey,
      status: contraindicationReason ? 'contraindicated' : 'missing',
      summary: contraindicationReason
        ? `${pillar.displayName}: contraindicated (${contraindicationReason})`
        : `${pillar.displayName}: missing — recommended for HFrEF`,
      recommendation: contraindicationReason
        ? undefined
        : `Consider initiating: ${pillar.genericNames.slice(0, 3).join(', ')}`,
      evidence: {
        conditionsExamined: bundle.conditions.map((c) => c.code),
        observationsExamined,
        contraindicationReason: contraindicationReason ?? undefined,
      },
      timestamp: now,
    });
  }

  return findings;
};
