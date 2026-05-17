import * as fs from 'fs';
import * as path from 'path';
import {
  cbpHypertensionControlRule,
  CBP_AGE_MIN,
  CBP_AGE_MAX,
  CBP_SYSTOLIC_THRESHOLD,
  CBP_DIASTOLIC_THRESHOLD,
} from '../rules/cbp-hypertension-control';
import type { PatientBundle } from '../types';

const FIXTURES_DIR = path.join(__dirname, '..', 'fixtures');

function loadFixture(filename: string): PatientBundle {
  return JSON.parse(fs.readFileSync(path.join(FIXTURES_DIR, filename), 'utf8')) as PatientBundle;
}

function dobForAge(age: number): string {
  const d = new Date();
  d.setUTCFullYear(d.getUTCFullYear() - age);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

function isoMonthsAgo(months: number): string {
  const d = new Date();
  d.setUTCMonth(d.getUTCMonth() - months);
  return d.toISOString().slice(0, 10);
}

function htnBundle(overrides: Partial<PatientBundle> = {}): PatientBundle {
  return {
    patient: { id: 't', name: 'Test', dob: dobForAge(60), sex: 'male' },
    conditions: [
      { code: 'I10', codeSystem: 'icd10', status: 'active', display: 'HTN' },
    ],
    medications: [],
    observations: [],
    allergies: [],
    ...overrides,
  };
}

function bp(sys: number, dia: number, effDate: string) {
  return [
    { loincCode: '8480-6', value: sys, unit: 'mm[Hg]', effectiveDate: effDate, category: 'vital-signs' },
    { loincCode: '8462-4', value: dia, unit: 'mm[Hg]', effectiveDate: effDate, category: 'vital-signs' },
  ];
}

describe('fixture-43 — 62yo M HTN BP 156/94 → uncontrolled gap', () => {
  const findings = cbpHypertensionControlRule(loadFixture('fixture-43-cbp-uncontrolled.json'));
  test('one finding', () => {
    expect(findings).toHaveLength(1);
    expect(findings[0].ruleId).toBe('cbp-hypertension-control');
    expect(findings[0].subcategory).toBe('uncontrolled');
    expect(findings[0].severity).toBe('gap');
  });
  test('summary cites the BP reading', () => {
    expect(findings[0].summary).toMatch(/156\/94/);
  });
});

describe('fixture-44 — 58yo F HTN no recent BP → missing-measurement gap', () => {
  const findings = cbpHypertensionControlRule(loadFixture('fixture-44-cbp-no-recent-bp.json'));
  test('one finding', () => {
    expect(findings).toHaveLength(1);
    expect(findings[0].subcategory).toBe('missing-measurement');
    expect(findings[0].status).toBe('missing');
  });
});

describe('fixture-45 — 70yo M HTN BP 124/76 → zero findings (controlled)', () => {
  test('zero findings', () => {
    expect(cbpHypertensionControlRule(loadFixture('fixture-45-cbp-controlled.json'))).toHaveLength(0);
  });
});

describe('age boundaries', () => {
  const recent = isoMonthsAgo(2);
  test(`age ${CBP_AGE_MIN} controlled → zero`, () => {
    const b = htnBundle({
      patient: { id: 'a', name: 'a', dob: dobForAge(CBP_AGE_MIN), sex: 'male' },
      observations: bp(120, 70, recent),
    });
    expect(cbpHypertensionControlRule(b)).toHaveLength(0);
  });
  test(`age ${CBP_AGE_MIN - 1} → zero (below band)`, () => {
    const b = htnBundle({ patient: { id: 'a', name: 'a', dob: dobForAge(CBP_AGE_MIN - 1), sex: 'male' } });
    expect(cbpHypertensionControlRule(b)).toHaveLength(0);
  });
  test(`age ${CBP_AGE_MAX} uncontrolled → fires`, () => {
    const b = htnBundle({
      patient: { id: 'a', name: 'a', dob: dobForAge(CBP_AGE_MAX), sex: 'male' },
      observations: bp(150, 92, recent),
    });
    expect(cbpHypertensionControlRule(b)).toHaveLength(1);
  });
  test(`age ${CBP_AGE_MAX + 1} → zero (above band)`, () => {
    const b = htnBundle({ patient: { id: 'a', name: 'a', dob: dobForAge(CBP_AGE_MAX + 1), sex: 'male' } });
    expect(cbpHypertensionControlRule(b)).toHaveLength(0);
  });
});

describe('threshold boundaries', () => {
  const recent = isoMonthsAgo(1);
  test(`systolic exactly ${CBP_SYSTOLIC_THRESHOLD} fires (≥)`, () => {
    const b = htnBundle({ observations: bp(CBP_SYSTOLIC_THRESHOLD, 80, recent) });
    expect(cbpHypertensionControlRule(b)).toHaveLength(1);
  });
  test(`systolic ${CBP_SYSTOLIC_THRESHOLD - 1} controlled → zero`, () => {
    const b = htnBundle({ observations: bp(CBP_SYSTOLIC_THRESHOLD - 1, 80, recent) });
    expect(cbpHypertensionControlRule(b)).toHaveLength(0);
  });
  test(`diastolic exactly ${CBP_DIASTOLIC_THRESHOLD} fires (≥)`, () => {
    const b = htnBundle({ observations: bp(120, CBP_DIASTOLIC_THRESHOLD, recent) });
    expect(cbpHypertensionControlRule(b)).toHaveLength(1);
  });
});

describe('HTN ICD prefix coverage', () => {
  const recent = isoMonthsAgo(1);
  for (const code of ['I10', 'I11.0', 'I11.9', 'I12.0', 'I12.9', 'I13.10', 'I13.2', 'I15.0', 'I15.9']) {
    test(`${code} qualifies as HTN`, () => {
      const b = htnBundle({
        conditions: [{ code, status: 'active', codeSystem: 'icd10', display: 'HTN variant' }],
        observations: bp(160, 100, recent),
      });
      expect(cbpHypertensionControlRule(b)).toHaveLength(1);
    });
  }
});

describe('no HTN → zero findings regardless of BP', () => {
  const recent = isoMonthsAgo(1);
  test('non-HTN patient with BP 170/100 → zero', () => {
    const b = htnBundle({
      conditions: [{ code: 'J45.40', status: 'active', codeSystem: 'icd10', display: 'asthma' }],
      observations: bp(170, 100, recent),
    });
    expect(cbpHypertensionControlRule(b)).toHaveLength(0);
  });
});

describe('recency window', () => {
  test('BP 11 months ago, controlled → zero', () => {
    const b = htnBundle({ observations: bp(120, 78, isoMonthsAgo(11)) });
    expect(cbpHypertensionControlRule(b)).toHaveLength(0);
  });
  test('BP 13 months ago → missing-measurement gap', () => {
    const b = htnBundle({ observations: bp(120, 78, isoMonthsAgo(13)) });
    const f = cbpHypertensionControlRule(b);
    expect(f).toHaveLength(1);
    expect(f[0].subcategory).toBe('missing-measurement');
  });
});

describe('cross-rule isolation — existing fixtures emit zero cbp-hypertension-control', () => {
  // AFib fixtures 19-22 carry I10 HTN ICD with no BP observations → expected
  // missing-measurement co-triggers. All other fixtures lack HTN.
  const CO_TRIGGERS = new Set([
    'fixture-19-afib-anticoagulation-gap-male.json',
    'fixture-20-afib-anticoagulation-gap-female.json',
    'fixture-21-afib-on-apixaban.json',
    'fixture-22-afib-aspirin-only-still-fires.json',
    'fixture-49-col-screening-gap.json',  // 58yo M with I10 HTN (added for COL-E rule)
    'fixture-56-ckd-htn-no-acei-arb.json',  // 68yo M CKD+HTN (added for CKD ACEi/ARB rule)
  ]);
  for (const fx of fs.readdirSync(FIXTURES_DIR).filter((f) => f.startsWith('fixture-') && f.endsWith('.json'))) {
    if (['fixture-43-cbp-uncontrolled.json', 'fixture-44-cbp-no-recent-bp.json', 'fixture-45-cbp-controlled.json'].includes(fx)) continue;
    if (CO_TRIGGERS.has(fx)) continue;
    test(`${fx} → zero cbp-hypertension-control findings`, () => {
      expect(cbpHypertensionControlRule(loadFixture(fx))).toHaveLength(0);
    });
  }
  for (const fx of CO_TRIGGERS) {
    test(`${fx} (HTN, no BP) → CO-TRIGGER missing-measurement gap`, () => {
      const findings = cbpHypertensionControlRule(loadFixture(fx));
      expect(findings).toHaveLength(1);
      expect(findings[0].subcategory).toBe('missing-measurement');
    });
  }
});

describe('empty bundle', () => {
  test('does not throw, zero findings', () => {
    const b: PatientBundle = { patient: { id: 'x', name: 'x' }, conditions: [], medications: [], observations: [], allergies: [] };
    expect(() => cbpHypertensionControlRule(b)).not.toThrow();
    expect(cbpHypertensionControlRule(b)).toHaveLength(0);
  });
});
