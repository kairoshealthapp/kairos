import * as fs from 'fs';
import * as path from 'path';
import { aisAdultImmunizationRule, AIS_AGE_MIN } from '../rules/ais-e-adult-immunization';
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

function adultBundle(overrides: Partial<PatientBundle> = {}): PatientBundle {
  return {
    patient: { id: 't', name: 'Test', dob: dobForAge(70), sex: 'male' },
    conditions: [],
    medications: [],
    observations: [],
    allergies: [],
    ...overrides,
  };
}

describe('fixture-59 — 72yo F no vaccines → 5 findings (flu, Tdap, pneumo, zoster, COVID)', () => {
  const f = aisAdultImmunizationRule(loadFixture('fixture-59-ais-elderly-no-vaccines.json'));
  test('exactly 5 findings', () => {
    expect(f).toHaveLength(5);
  });
  test('subcategories present', () => {
    const subs = f.map((x) => x.subcategory).sort();
    expect(subs).toEqual(['covid-19', 'influenza', 'pneumococcal', 'tdap', 'zoster']);
  });
});

describe('fixture-60 — 70yo M fully vaccinated → zero', () => {
  test('zero findings', () => {
    expect(aisAdultImmunizationRule(loadFixture('fixture-60-ais-all-vaccines.json'))).toHaveLength(0);
  });
});

describe('fixture-61 — 42yo F T2DM no vaccines → 3 findings (flu, Tdap, pneumo)', () => {
  const f = aisAdultImmunizationRule(loadFixture('fixture-61-ais-young-diabetes-pneumo.json'));
  test('exactly 3 findings', () => {
    expect(f).toHaveLength(3);
    expect(f.map((x) => x.subcategory).sort()).toEqual(['influenza', 'pneumococcal', 'tdap']);
  });
});

describe('age-gated antigens', () => {
  test('age 40, no conditions → flu + Tdap only (2 findings)', () => {
    const b = adultBundle({ patient: { id: 'a', name: 'a', dob: dobForAge(40), sex: 'male' } });
    const f = aisAdultImmunizationRule(b);
    expect(f).toHaveLength(2);
    expect(f.map((x) => x.subcategory).sort()).toEqual(['influenza', 'tdap']);
  });
  test('age 50, no conditions → flu + Tdap + zoster (3 findings)', () => {
    const b = adultBundle({ patient: { id: 'a', name: 'a', dob: dobForAge(50), sex: 'male' } });
    expect(aisAdultImmunizationRule(b)).toHaveLength(3);
  });
  test('age 65, no conditions → flu + Tdap + pneumo + zoster + COVID (5 findings)', () => {
    const b = adultBundle({ patient: { id: 'a', name: 'a', dob: dobForAge(65), sex: 'male' } });
    expect(aisAdultImmunizationRule(b)).toHaveLength(5);
  });
  test(`age ${AIS_AGE_MIN - 1} → zero findings (pediatric out of scope)`, () => {
    const b = adultBundle({ patient: { id: 'a', name: 'a', dob: dobForAge(AIS_AGE_MIN - 1), sex: 'male' } });
    expect(aisAdultImmunizationRule(b)).toHaveLength(0);
  });
});

describe('pneumococcal high-risk qualifier', () => {
  test('age 30 + COPD → pneumococcal flag triggers', () => {
    const b = adultBundle({
      patient: { id: 'a', name: 'a', dob: dobForAge(30), sex: 'male' },
      conditions: [{ code: 'J44.9', codeSystem: 'icd10', status: 'active', display: 'COPD' }],
    });
    const subs = aisAdultImmunizationRule(b).map((x) => x.subcategory).sort();
    expect(subs).toContain('pneumococcal');
  });
  test('age 30 + asthma J45.40 → pneumococcal flag triggers', () => {
    const b = adultBundle({
      patient: { id: 'a', name: 'a', dob: dobForAge(30), sex: 'male' },
      conditions: [{ code: 'J45.40', codeSystem: 'icd10', status: 'active', display: 'asthma' }],
    });
    expect(aisAdultImmunizationRule(b).map((x) => x.subcategory)).toContain('pneumococcal');
  });
});

describe('recency windows', () => {
  test('Flu 13 months ago → still flags', () => {
    const b = adultBundle({
      observations: [{ loincCode: '150', effectiveDate: isoMonthsAgo(13) }],
    });
    const subs = aisAdultImmunizationRule(b).map((x) => x.subcategory);
    expect(subs).toContain('influenza');
  });
  test('Flu 6 months ago → does not flag flu', () => {
    const b = adultBundle({
      observations: [{ loincCode: '150', effectiveDate: isoMonthsAgo(6) }],
    });
    expect(aisAdultImmunizationRule(b).map((x) => x.subcategory)).not.toContain('influenza');
  });
  test('Tdap 11 years ago → still flags Tdap', () => {
    const b = adultBundle({
      observations: [{ loincCode: '115', effectiveDate: isoMonthsAgo(132) }],
    });
    expect(aisAdultImmunizationRule(b).map((x) => x.subcategory)).toContain('tdap');
  });
});

describe('cross-rule isolation — existing fixtures (does-not-throw guard)', () => {
  const ALL = fs.readdirSync(FIXTURES_DIR).filter((f) => f.startsWith('fixture-') && f.endsWith('.json'));
  for (const fx of ALL) {
    if (['fixture-59-ais-elderly-no-vaccines.json', 'fixture-60-ais-all-vaccines.json', 'fixture-61-ais-young-diabetes-pneumo.json'].includes(fx)) continue;
    test(`${fx} does not throw`, () => {
      expect(() => aisAdultImmunizationRule(loadFixture(fx))).not.toThrow();
    });
  }
});

describe('empty bundle', () => {
  test('no dob → zero findings', () => {
    const b: PatientBundle = { patient: { id: 'x', name: 'x' }, conditions: [], medications: [], observations: [], allergies: [] };
    expect(aisAdultImmunizationRule(b)).toHaveLength(0);
  });
});
