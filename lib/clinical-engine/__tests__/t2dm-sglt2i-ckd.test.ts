import * as fs from 'fs';
import * as path from 'path';
import {
  t2dmSglt2iCkdRule,
  T2DM_CKD_SGLT2I_RXCUIS,
  T2DM_CKD_EGFR_CKD_LOWER,
  T2DM_CKD_UACR_ELEVATED_THRESHOLD,
  detectCkd,
} from '../rules/t2dm-sglt2i-ckd';
import type { PatientBundle, PatientCondition, PatientObservation } from '../types';

const FIXTURES_DIR = path.join(__dirname, '..', 'fixtures');

function loadFixture(filename: string): PatientBundle {
  const raw = fs.readFileSync(path.join(FIXTURES_DIR, filename), 'utf8');
  return JSON.parse(raw) as PatientBundle;
}

const T2DM: PatientCondition = {
  code: 'E11.9',
  codeSystem: 'http://hl7.org/fhir/sid/icd-10-cm',
  display: 'Type 2 diabetes mellitus',
  status: 'active',
};

const EGFR_45: PatientObservation = {
  loincCode: '98979-8',
  display: 'eGFR',
  value: 45,
  unit: 'mL/min/1.73m2',
  effectiveDate: '2026-04-01',
  category: 'laboratory',
};

function bundle(overrides: Partial<PatientBundle>): PatientBundle {
  return {
    patient: { id: 't', name: 'Test', dob: '1960-01-01', sex: 'male' },
    conditions: [T2DM],
    medications: [],
    observations: [EGFR_45],
    allergies: [],
    ...overrides,
  };
}

describe('fixture-36 — T2DM + N18.32 + eGFR 45 + UACR 60, no SGLT2i', () => {
  const findings = t2dmSglt2iCkdRule(loadFixture('fixture-36-t2dm-ckd-sglt2i-gap.json'));

  test('one finding fires', () => {
    expect(findings).toHaveLength(1);
    expect(findings[0].ruleId).toBe('t2dm-sglt2i-ckd');
    expect(findings[0].severity).toBe('gap');
    expect(findings[0].status).toBe('missing');
  });

  test('summary cites both ADA and KDIGO', () => {
    expect(findings[0].summary).toMatch(/ADA 2026/);
    expect(findings[0].summary).toMatch(/KDIGO 2022/);
  });

  test('CKD detected via all three modes', () => {
    const ckd = detectCkd(loadFixture('fixture-36-t2dm-ckd-sglt2i-gap.json'));
    expect(ckd.reasons).toContain('N18.x ICD-10');
    expect(ckd.reasons.some((r) => r.includes('eGFR'))).toBe(true);
    expect(ckd.reasons.some((r) => r.includes('UACR'))).toBe(true);
  });
});

describe('fixture-37 — T2DM + N18.31 + canagliflozin → suppression', () => {
  test('zero findings (active SGLT2i)', () => {
    expect(t2dmSglt2iCkdRule(loadFixture('fixture-37-t2dm-ckd-on-canagliflozin.json'))).toHaveLength(0);
  });
});

describe('fixture-38 — T2DM + eGFR 95 + UACR 12, no CKD → zero', () => {
  test('zero findings (CKD not detected)', () => {
    expect(t2dmSglt2iCkdRule(loadFixture('fixture-38-t2dm-no-ckd-no-gap.json'))).toHaveLength(0);
  });
});

describe('fixture-39 — T2DM + eGFR 20 → zero (contraindication)', () => {
  test('zero findings (eGFR < 25)', () => {
    expect(t2dmSglt2iCkdRule(loadFixture('fixture-39-t2dm-egfr-contraindicated.json'))).toHaveLength(0);
  });
});

describe('cross-rule isolation — fixtures 01-35 emit zero T2DM-CKD findings', () => {
  // Most fixtures: zero. Specific co-trigger exceptions documented below.
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
    'fixture-12-apob-ascvd-at-goal.json',
    'fixture-13-apob-non-qualifying-adult.json',
    'fixture-15-statin-secondary-prevention-gap.json',
    'fixture-16-statin-ldl-190-gap.json',
    'fixture-18-statin-already-on-therapy.json',
    'fixture-19-afib-anticoagulation-gap-male.json',
    'fixture-20-afib-anticoagulation-gap-female.json',
    'fixture-21-afib-on-apixaban.json',
    'fixture-22-afib-aspirin-only-still-fires.json',
    'fixture-23-afib-low-risk-no-gap.json',
    'fixture-24-hfpef-sglt2i-gap.json',
    'fixture-25-hfpef-on-empagliflozin.json',
    'fixture-26-hfpef-egfr-contraindicated.json',
    'fixture-27-hfpef-t1dm.json',
    'fixture-28-post-mi-bb-gap.json',
    'fixture-29-post-mi-tartrate-trap.json',
    'fixture-30-post-mi-on-carvedilol.json',
    'fixture-31-old-mi-13-months.json',
    'fixture-32-post-mi-acei-gap-low-ef.json',
    'fixture-33-post-mi-on-lisinopril.json',
    'fixture-34-post-mi-preserved-ef-no-gap.json',
    'fixture-35-post-mi-lvef-unknown.json',
  ]) {
    test(`${fx} → zero T2DM-CKD findings`, () => {
      expect(t2dmSglt2iCkdRule(loadFixture(fx))).toHaveLength(0);
    });
  }

  // fixture-11 has T2DM but no CKD evidence (LDL 95, TG 165, no UACR, no eGFR, no N18) → 0
  test('fixture-11 (T2DM no CKD) → zero', () => {
    expect(t2dmSglt2iCkdRule(loadFixture('fixture-11-apob-diabetes-qualifier.json'))).toHaveLength(0);
  });

  // fixture-14 has T2DM + ApoB measured; no eGFR/UACR/N18 → 0
  test('fixture-14 (T2DM, no CKD evidence) → zero', () => {
    expect(t2dmSglt2iCkdRule(loadFixture('fixture-14-apob-measured-suppression.json'))).toHaveLength(0);
  });

  // fixture-17 has T2DM but eGFR not in bundle, no UACR, no N18 → 0
  test('fixture-17 (T2DM no CKD evidence) → zero', () => {
    expect(t2dmSglt2iCkdRule(loadFixture('fixture-17-statin-diabetes-gap.json'))).toHaveLength(0);
  });
});

describe('CKD detection — each mode independently', () => {
  test('ICD N18.3 alone (no eGFR, no UACR) → fires', () => {
    const b = bundle({
      conditions: [T2DM, { code: 'N18.3', codeSystem: 'icd10', status: 'active' }],
      observations: [],
    });
    expect(t2dmSglt2iCkdRule(b)).toHaveLength(1);
  });

  test('eGFR 45 alone (no ICD, no UACR) → fires', () => {
    const b = bundle({
      conditions: [T2DM],
      observations: [EGFR_45],
    });
    expect(t2dmSglt2iCkdRule(b)).toHaveLength(1);
  });

  test('UACR 50 alone (no ICD, normal eGFR) → fires', () => {
    const b = bundle({
      conditions: [T2DM],
      observations: [
        { loincCode: '98979-8', display: 'eGFR', value: 95, unit: 'mL/min/1.73m2', effectiveDate: '2026-04-01', category: 'laboratory' },
        { loincCode: '9318-7', display: 'UACR', value: 50, unit: 'mg/g', effectiveDate: '2026-04-01', category: 'laboratory' },
      ],
    });
    expect(t2dmSglt2iCkdRule(b)).toHaveLength(1);
  });
});

describe('T1DM supremacy', () => {
  test('T1DM + N18.3 + eGFR 45 → zero findings (T1DM excludes regardless)', () => {
    const b = bundle({
      conditions: [
        { code: 'E10.9', codeSystem: 'icd10', status: 'active', display: 'T1DM' },
        { code: 'N18.3', codeSystem: 'icd10', status: 'active' },
      ],
      observations: [EGFR_45],
    });
    expect(t2dmSglt2iCkdRule(b)).toHaveLength(0);
  });
});

describe('each SGLT2i suppresses individually', () => {
  for (const [name, rxcui] of Object.entries(T2DM_CKD_SGLT2I_RXCUIS)) {
    test(`active ${name} (RxCUI ${rxcui}) suppresses`, () => {
      const b = bundle({
        observations: [EGFR_45],
        medications: [
          { rxnormCode: rxcui, name: `${name} test product`, genericName: name, status: 'active', route: 'oral' },
        ],
      });
      expect(t2dmSglt2iCkdRule(b)).toHaveLength(0);
    });
  }
});

describe('eGFR contraindication boundary', () => {
  test(`eGFR ${T2DM_CKD_EGFR_CKD_LOWER - 1} → zero`, () => {
    const b = bundle({
      observations: [
        { loincCode: '98979-8', display: 'eGFR', value: T2DM_CKD_EGFR_CKD_LOWER - 1, unit: 'mL/min/1.73m2', effectiveDate: '2026-04-01', category: 'laboratory' },
      ],
    });
    expect(t2dmSglt2iCkdRule(b)).toHaveLength(0);
  });

  test(`eGFR ${T2DM_CKD_EGFR_CKD_LOWER} → fires (boundary is strict <)`, () => {
    const b = bundle({
      observations: [
        { loincCode: '98979-8', display: 'eGFR', value: T2DM_CKD_EGFR_CKD_LOWER, unit: 'mL/min/1.73m2', effectiveDate: '2026-04-01', category: 'laboratory' },
      ],
    });
    expect(t2dmSglt2iCkdRule(b)).toHaveLength(1);
  });
});

describe('UACR boundary', () => {
  test(`UACR ${T2DM_CKD_UACR_ELEVATED_THRESHOLD - 1} (with eGFR 95) → zero`, () => {
    const b = bundle({
      observations: [
        { loincCode: '98979-8', display: 'eGFR', value: 95, unit: 'mL/min/1.73m2', effectiveDate: '2026-04-01', category: 'laboratory' },
        { loincCode: '9318-7', display: 'UACR', value: T2DM_CKD_UACR_ELEVATED_THRESHOLD - 1, unit: 'mg/g', effectiveDate: '2026-04-01', category: 'laboratory' },
      ],
    });
    expect(t2dmSglt2iCkdRule(b)).toHaveLength(0);
  });

  test(`UACR ${T2DM_CKD_UACR_ELEVATED_THRESHOLD} (with eGFR 95) → fires`, () => {
    const b = bundle({
      observations: [
        { loincCode: '98979-8', display: 'eGFR', value: 95, unit: 'mL/min/1.73m2', effectiveDate: '2026-04-01', category: 'laboratory' },
        { loincCode: '9318-7', display: 'UACR', value: T2DM_CKD_UACR_ELEVATED_THRESHOLD, unit: 'mg/g', effectiveDate: '2026-04-01', category: 'laboratory' },
      ],
    });
    expect(t2dmSglt2iCkdRule(b)).toHaveLength(1);
  });
});

describe('non-T2DM bundle', () => {
  test('no diabetes + CKD + low eGFR → zero', () => {
    const b: PatientBundle = {
      patient: { id: 'x', name: 'x', dob: '1960-01-01' },
      conditions: [{ code: 'N18.3', codeSystem: 'icd10', status: 'active' }],
      medications: [],
      observations: [EGFR_45],
      allergies: [],
    };
    expect(t2dmSglt2iCkdRule(b)).toHaveLength(0);
  });
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
    expect(() => t2dmSglt2iCkdRule(b)).not.toThrow();
    expect(t2dmSglt2iCkdRule(b)).toHaveLength(0);
  });
});
