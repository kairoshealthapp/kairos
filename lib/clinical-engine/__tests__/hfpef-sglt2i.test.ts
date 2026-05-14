import * as fs from 'fs';
import * as path from 'path';
import {
  hfpefSglt2iRule,
  HFPEF_CONDITION_CODES,
  HFPEF_LVEF_THRESHOLD,
  SGLT2I_RXCUIS,
  SGLT2I_EGFR_CONTRAINDICATION_THRESHOLD,
} from '../rules/hfpef-sglt2i';
import type { PatientBundle, PatientCondition, PatientObservation } from '../types';

const FIXTURES_DIR = path.join(__dirname, '..', 'fixtures');

function loadFixture(filename: string): PatientBundle {
  const raw = fs.readFileSync(path.join(FIXTURES_DIR, filename), 'utf8');
  return JSON.parse(raw) as PatientBundle;
}

const HFPEF: PatientCondition = {
  code: 'I50.32',
  codeSystem: 'http://hl7.org/fhir/sid/icd-10-cm',
  display: 'Chronic diastolic (congestive) heart failure',
  status: 'active',
};

const NORMAL_EGFR: PatientObservation = {
  loincCode: '98979-8',
  display: 'eGFR CKD-EPI 2021',
  value: 65,
  unit: 'mL/min/1.73m2',
  effectiveDate: '2026-04-01',
  category: 'laboratory',
};

function bundle(overrides: Partial<PatientBundle>): PatientBundle {
  return {
    patient: { id: 't', name: 'Test', dob: '1958-01-01', sex: 'male' },
    conditions: [HFPEF],
    medications: [],
    observations: [NORMAL_EGFR],
    allergies: [],
    ...overrides,
  };
}

describe('fixture-24 — HFpEF + T2DM, no SGLT2i, eGFR 65', () => {
  const findings = hfpefSglt2iRule(loadFixture('fixture-24-hfpef-sglt2i-gap.json'));

  test('one finding fires', () => {
    expect(findings).toHaveLength(1);
    expect(findings[0].ruleId).toBe('hfpef-sglt2i');
    expect(findings[0].severity).toBe('gap');
    expect(findings[0].status).toBe('missing');
  });

  test('summary cites Class 2a, LOE B-R, and LVEF value', () => {
    expect(findings[0].summary).toMatch(/Class 2a/);
    expect(findings[0].summary).toMatch(/B-R/);
    expect(findings[0].summary).toMatch(/LVEF 55%/);
  });

  test('recommendation names empagliflozin OR dapagliflozin', () => {
    expect(findings[0].recommendation).toMatch(/empagliflozin/);
    expect(findings[0].recommendation).toMatch(/dapagliflozin/);
  });
});

describe('fixture-25 — HFpEF on empagliflozin → suppression', () => {
  test('zero findings (active SGLT2i)', () => {
    expect(hfpefSglt2iRule(loadFixture('fixture-25-hfpef-on-empagliflozin.json'))).toHaveLength(0);
  });
});

describe('fixture-26 — HFpEF + eGFR 18 → suppression', () => {
  test('zero findings (eGFR contraindication)', () => {
    expect(hfpefSglt2iRule(loadFixture('fixture-26-hfpef-egfr-contraindicated.json'))).toHaveLength(0);
  });
});

describe('fixture-27 — HFpEF + T1DM → suppression', () => {
  test('zero findings (T1DM contraindication)', () => {
    expect(hfpefSglt2iRule(loadFixture('fixture-27-hfpef-t1dm.json'))).toHaveLength(0);
  });
});

describe('cross-rule isolation — fixtures 01-23 do not fire HFpEF SGLT2i', () => {
  // Critically: HFrEF fixtures (01-05, 09, 10) have I50.2x codes which
  // are NOT HFpEF and should NOT fire this rule. This is the boundary
  // that protects the engine's HFrEF / HFpEF separation.
  for (const fx of [
    'fixture-01-all-gaps.json',
    'fixture-02-tartrate-trap.json',
    'fixture-03-full-gdmt.json',
    'fixture-04-mra-contraindicated.json',
    'fixture-05-bb-asthma.json',
    'fixture-06-lpa-screening-gap.json',
    'fixture-07-lpa-measured-normal.json',
    'fixture-08-lpa-measured-elevated.json',
    'fixture-09-nsaid-hf-interaction.json',
    'fixture-10-nsaid-hf-multiple.json',
    'fixture-11-apob-diabetes-qualifier.json',
    'fixture-12-apob-ascvd-at-goal.json',
    'fixture-13-apob-non-qualifying-adult.json',
    'fixture-14-apob-measured-suppression.json',
    'fixture-15-statin-secondary-prevention-gap.json',
    'fixture-16-statin-ldl-190-gap.json',
    'fixture-17-statin-diabetes-gap.json',
    'fixture-18-statin-already-on-therapy.json',
    'fixture-19-afib-anticoagulation-gap-male.json',
    'fixture-20-afib-anticoagulation-gap-female.json',
    'fixture-21-afib-on-apixaban.json',
    'fixture-22-afib-aspirin-only-still-fires.json',
    'fixture-23-afib-low-risk-no-gap.json',
  ]) {
    test(`${fx} → zero HFpEF SGLT2i findings`, () => {
      expect(hfpefSglt2iRule(loadFixture(fx))).toHaveLength(0);
    });
  }
});

describe('LVEF boundary — Path B detection', () => {
  test(`LVEF exactly ${HFPEF_LVEF_THRESHOLD}% + unspecified HF (I50.9) fires`, () => {
    const b = bundle({
      conditions: [{ code: 'I50.9', codeSystem: 'icd10', status: 'active' }],
      observations: [
        { loincCode: '10230-1', display: 'LVEF', value: HFPEF_LVEF_THRESHOLD, unit: '%', effectiveDate: '2025-12-01', category: 'imaging' },
        NORMAL_EGFR,
      ],
    });
    expect(hfpefSglt2iRule(b)).toHaveLength(1);
  });

  test(`LVEF ${HFPEF_LVEF_THRESHOLD - 1}% (HFmrEF range) + I50.9 does NOT fire`, () => {
    const b = bundle({
      conditions: [{ code: 'I50.9', codeSystem: 'icd10', status: 'active' }],
      observations: [
        { loincCode: '10230-1', display: 'LVEF', value: HFPEF_LVEF_THRESHOLD - 1, unit: '%', effectiveDate: '2025-12-01', category: 'imaging' },
        NORMAL_EGFR,
      ],
    });
    expect(hfpefSglt2iRule(b)).toHaveLength(0);
  });
});

describe('eGFR boundary', () => {
  test(`eGFR exactly ${SGLT2I_EGFR_CONTRAINDICATION_THRESHOLD} fires (threshold is "<", strict)`, () => {
    const b = bundle({
      observations: [
        { loincCode: '98979-8', display: 'eGFR', value: SGLT2I_EGFR_CONTRAINDICATION_THRESHOLD, unit: 'mL/min/1.73m2', effectiveDate: '2026-04-01', category: 'laboratory' },
      ],
    });
    expect(hfpefSglt2iRule(b)).toHaveLength(1);
  });

  test(`eGFR ${SGLT2I_EGFR_CONTRAINDICATION_THRESHOLD - 1} does NOT fire`, () => {
    const b = bundle({
      observations: [
        { loincCode: '98979-8', display: 'eGFR', value: SGLT2I_EGFR_CONTRAINDICATION_THRESHOLD - 1, unit: 'mL/min/1.73m2', effectiveDate: '2026-04-01', category: 'laboratory' },
      ],
    });
    expect(hfpefSglt2iRule(b)).toHaveLength(0);
  });
});

describe('HFmrEF (LVEF 40-49% with HF) is out of scope', () => {
  test('I50.811 (HFmrEF) + LVEF 45% does NOT fire (v1 scope is HFpEF only)', () => {
    const b = bundle({
      conditions: [{ code: 'I50.811', codeSystem: 'icd10', status: 'active' }],
      observations: [
        { loincCode: '10230-1', display: 'LVEF', value: 45, unit: '%', effectiveDate: '2025-12-01', category: 'imaging' },
        NORMAL_EGFR,
      ],
    });
    expect(hfpefSglt2iRule(b)).toHaveLength(0);
  });
});

describe('dapagliflozin suppresses (alternate evidence-base agent)', () => {
  test('HFpEF on dapagliflozin → zero findings', () => {
    const b = bundle({
      medications: [
        {
          rxnormCode: SGLT2I_RXCUIS.dapagliflozin,
          name: 'dapagliflozin 10 MG Oral Tablet',
          genericName: 'dapagliflozin',
          status: 'active',
          route: 'oral',
        },
      ],
    });
    expect(hfpefSglt2iRule(b)).toHaveLength(0);
  });
});

describe('non-evidence-base SGLT2i (canagliflozin) still suppresses', () => {
  test('HFpEF on canagliflozin → zero findings (pharmacologic equivalence)', () => {
    const b = bundle({
      medications: [
        {
          rxnormCode: SGLT2I_RXCUIS.canagliflozin,
          name: 'canagliflozin 300 MG Oral Tablet',
          genericName: 'canagliflozin',
          status: 'active',
          route: 'oral',
        },
      ],
    });
    expect(hfpefSglt2iRule(b)).toHaveLength(0);
  });
});

describe('HFpEF without any HF ICD code', () => {
  test('LVEF 60% with no HF ICD → does NOT fire (path B requires an HF ICD)', () => {
    const b = bundle({
      conditions: [],
      observations: [
        { loincCode: '10230-1', display: 'LVEF', value: 60, unit: '%', effectiveDate: '2025-12-01', category: 'imaging' },
        NORMAL_EGFR,
      ],
    });
    expect(hfpefSglt2iRule(b)).toHaveLength(0);
  });
});

describe('explicit HFpEF code variants', () => {
  for (const code of HFPEF_CONDITION_CODES) {
    test(`${code} fires without LVEF observation`, () => {
      const b = bundle({
        conditions: [{ code, codeSystem: 'icd10', status: 'active' }],
        observations: [NORMAL_EGFR],
      });
      expect(hfpefSglt2iRule(b)).toHaveLength(1);
    });
  }
});

describe('empty bundle', () => {
  test('does not throw, zero findings', () => {
    const b: PatientBundle = {
      patient: { id: 'x', name: 'x' },
      conditions: [],
      medications: [],
      observations: [],
      allergies: [],
    };
    expect(() => hfpefSglt2iRule(b)).not.toThrow();
    expect(hfpefSglt2iRule(b)).toHaveLength(0);
  });
});
