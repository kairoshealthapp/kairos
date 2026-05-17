import * as fs from 'fs';
import * as path from 'path';
import {
  bcsBreastScreeningRule,
  BCS_AGE_MIN,
  BCS_AGE_MAX,
  BCS_RECENCY_MONTHS,
} from '../rules/bcs-e-breast-screening';
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

function femaleBundle(overrides: Partial<PatientBundle> = {}): PatientBundle {
  return {
    patient: { id: 't', name: 'Test', dob: dobForAge(55), sex: 'female' },
    conditions: [],
    medications: [],
    observations: [],
    allergies: [],
    ...overrides,
  };
}

describe('fixture-53 — 55yo F no mammogram → gap', () => {
  const f = bcsBreastScreeningRule(loadFixture('fixture-53-bcs-screening-gap.json'));
  test('one finding', () => {
    expect(f).toHaveLength(1);
    expect(f[0].ruleId).toBe('bcs-e-breast-screening');
    expect(f[0].summary).toMatch(/USPSTF 2024 Grade B/);
  });
});

describe('fixture-54 — 50yo F mammogram 8mo ago → zero', () => {
  test('zero findings', () => {
    expect(bcsBreastScreeningRule(loadFixture('fixture-54-bcs-mammogram-on-file.json'))).toHaveLength(0);
  });
});

describe('fixture-55 — 62yo F bilateral mastectomy → zero (suppression)', () => {
  test('zero findings', () => {
    expect(bcsBreastScreeningRule(loadFixture('fixture-55-bcs-bilateral-mastectomy.json'))).toHaveLength(0);
  });
});

describe('age boundaries', () => {
  test(`age ${BCS_AGE_MIN} female fires`, () => {
    const b = femaleBundle({ patient: { id: 'a', name: 'a', dob: dobForAge(BCS_AGE_MIN), sex: 'female' } });
    expect(bcsBreastScreeningRule(b)).toHaveLength(1);
  });
  test(`age ${BCS_AGE_MIN - 1} → zero`, () => {
    const b = femaleBundle({ patient: { id: 'a', name: 'a', dob: dobForAge(BCS_AGE_MIN - 1), sex: 'female' } });
    expect(bcsBreastScreeningRule(b)).toHaveLength(0);
  });
  test(`age ${BCS_AGE_MAX} fires`, () => {
    const b = femaleBundle({ patient: { id: 'a', name: 'a', dob: dobForAge(BCS_AGE_MAX), sex: 'female' } });
    expect(bcsBreastScreeningRule(b)).toHaveLength(1);
  });
  test(`age ${BCS_AGE_MAX + 1} → zero`, () => {
    const b = femaleBundle({ patient: { id: 'a', name: 'a', dob: dobForAge(BCS_AGE_MAX + 1), sex: 'female' } });
    expect(bcsBreastScreeningRule(b)).toHaveLength(0);
  });
});

describe('sex gate', () => {
  test('male age 55 → zero', () => {
    const b = femaleBundle({ patient: { id: 'm', name: 'm', dob: dobForAge(55), sex: 'male' } });
    expect(bcsBreastScreeningRule(b)).toHaveLength(0);
  });
  test('undefined sex → zero', () => {
    const b = femaleBundle({ patient: { id: 'm', name: 'm', dob: dobForAge(55) } });
    expect(bcsBreastScreeningRule(b)).toHaveLength(0);
  });
});

describe('recency window', () => {
  test(`mammogram ${BCS_RECENCY_MONTHS - 1} months ago → zero`, () => {
    const b = femaleBundle({
      observations: [{ loincCode: '24604-1', effectiveDate: isoMonthsAgo(BCS_RECENCY_MONTHS - 1) }],
    });
    expect(bcsBreastScreeningRule(b)).toHaveLength(0);
  });
  test(`mammogram ${BCS_RECENCY_MONTHS + 1} months ago → fires (stale)`, () => {
    const b = femaleBundle({
      observations: [{ loincCode: '24604-1', effectiveDate: isoMonthsAgo(BCS_RECENCY_MONTHS + 1) }],
    });
    expect(bcsBreastScreeningRule(b)).toHaveLength(1);
  });
});

describe('display substring matching', () => {
  test('mammogram by display only (no LOINC) → zero', () => {
    const b = femaleBundle({
      observations: [{ display: 'Bilateral screening mammogram completed', effectiveDate: isoMonthsAgo(12) }],
    });
    expect(bcsBreastScreeningRule(b)).toHaveLength(0);
  });
  test('CPT 77067 token in display → zero', () => {
    const b = femaleBundle({
      observations: [{ display: 'Imaging procedure CPT 77067', effectiveDate: isoMonthsAgo(6) }],
    });
    expect(bcsBreastScreeningRule(b)).toHaveLength(0);
  });
});

describe('cross-rule isolation — only existing female 40-74 fixtures fire as co-triggers', () => {
  const ALL = fs.readdirSync(FIXTURES_DIR).filter((f) => f.startsWith('fixture-') && f.endsWith('.json'));
  const NEW_OWN = new Set([
    'fixture-53-bcs-screening-gap.json',
    'fixture-54-bcs-mammogram-on-file.json',
    'fixture-55-bcs-bilateral-mastectomy.json',
  ]);
  for (const fx of ALL) {
    if (NEW_OWN.has(fx)) continue;
    test(`${fx} → outcome derived from sex + age band`, () => {
      const b = loadFixture(fx);
      const dob = b.patient.dob;
      const sex = (b.patient.sex ?? '').toLowerCase();
      if (sex !== 'female' || !dob) {
        expect(bcsBreastScreeningRule(b)).toHaveLength(0);
        return;
      }
      const asOf = new Date();
      const birth = new Date(dob);
      let years = asOf.getUTCFullYear() - birth.getUTCFullYear();
      const mDiff = asOf.getUTCMonth() - birth.getUTCMonth();
      if (mDiff < 0 || (mDiff === 0 && asOf.getUTCDate() < birth.getUTCDate())) years -= 1;
      if (years >= BCS_AGE_MIN && years <= BCS_AGE_MAX) {
        expect(bcsBreastScreeningRule(b)).toHaveLength(1);
      } else {
        expect(bcsBreastScreeningRule(b)).toHaveLength(0);
      }
    });
  }
});

describe('empty bundle', () => {
  test('does not throw, zero findings', () => {
    const b: PatientBundle = { patient: { id: 'x', name: 'x' }, conditions: [], medications: [], observations: [], allergies: [] };
    expect(() => bcsBreastScreeningRule(b)).not.toThrow();
    expect(bcsBreastScreeningRule(b)).toHaveLength(0);
  });
});
