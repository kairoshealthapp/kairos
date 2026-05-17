import * as fs from 'fs';
import * as path from 'path';
import {
  osteoporosisScreeningRule,
  OSTEO_WOMEN_AGE_MIN,
  OSTEO_MEN_AGE_MIN,
  OSTEO_RECENCY_MONTHS,
} from '../rules/osteoporosis-screening';
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

function bundle(overrides: Partial<PatientBundle> = {}): PatientBundle {
  return {
    patient: { id: 't', name: 'Test', dob: dobForAge(70), sex: 'female' },
    conditions: [],
    medications: [],
    observations: [],
    allergies: [],
    ...overrides,
  };
}

describe('fixture-62 — 68yo F no DEXA → gap', () => {
  test('one finding (Grade B)', () => {
    const f = osteoporosisScreeningRule(loadFixture('fixture-62-osteo-woman-65-no-dexa.json'));
    expect(f).toHaveLength(1);
    expect(f[0].summary).toMatch(/Grade B/);
  });
});

describe('fixture-63 — DEXA 3yr ago → zero', () => {
  test('zero findings', () => {
    expect(osteoporosisScreeningRule(loadFixture('fixture-63-osteo-dexa-3yr-ago.json'))).toHaveLength(0);
  });
});

describe('fixture-64 — prior M81.0 → zero (suppression)', () => {
  test('zero findings', () => {
    expect(osteoporosisScreeningRule(loadFixture('fixture-64-osteo-prior-diagnosis.json'))).toHaveLength(0);
  });
});

describe('sex/age gates', () => {
  test(`woman ${OSTEO_WOMEN_AGE_MIN} fires`, () => {
    expect(osteoporosisScreeningRule(bundle({ patient: { id: 'a', name: 'a', dob: dobForAge(OSTEO_WOMEN_AGE_MIN), sex: 'female' } }))).toHaveLength(1);
  });
  test(`woman ${OSTEO_WOMEN_AGE_MIN - 1} → zero`, () => {
    expect(osteoporosisScreeningRule(bundle({ patient: { id: 'a', name: 'a', dob: dobForAge(OSTEO_WOMEN_AGE_MIN - 1), sex: 'female' } }))).toHaveLength(0);
  });
  test(`man ${OSTEO_MEN_AGE_MIN} fires (consensus path)`, () => {
    const f = osteoporosisScreeningRule(bundle({ patient: { id: 'a', name: 'a', dob: dobForAge(OSTEO_MEN_AGE_MIN), sex: 'male' } }));
    expect(f).toHaveLength(1);
    expect(f[0].summary).toMatch(/consensus society/);
  });
  test(`man 65 → zero (below male threshold)`, () => {
    expect(osteoporosisScreeningRule(bundle({ patient: { id: 'a', name: 'a', dob: dobForAge(65), sex: 'male' } }))).toHaveLength(0);
  });
});

describe('recency window', () => {
  test(`DEXA ${OSTEO_RECENCY_MONTHS - 1} months ago → zero`, () => {
    const b = bundle({ observations: [{ loincCode: '38269-7', effectiveDate: isoMonthsAgo(OSTEO_RECENCY_MONTHS - 1) }] });
    expect(osteoporosisScreeningRule(b)).toHaveLength(0);
  });
  test(`DEXA ${OSTEO_RECENCY_MONTHS + 1} months ago → fires`, () => {
    const b = bundle({ observations: [{ loincCode: '38269-7', effectiveDate: isoMonthsAgo(OSTEO_RECENCY_MONTHS + 1) }] });
    expect(osteoporosisScreeningRule(b)).toHaveLength(1);
  });
  test('display substring "bone density" → zero', () => {
    const b = bundle({ observations: [{ display: 'Bone density study, DEXA femoral neck', effectiveDate: isoMonthsAgo(12) }] });
    expect(osteoporosisScreeningRule(b)).toHaveLength(0);
  });
});

describe('cross-rule isolation — existing fixtures (does-not-throw)', () => {
  const ALL = fs.readdirSync(FIXTURES_DIR).filter((f) => f.startsWith('fixture-') && f.endsWith('.json'));
  for (const fx of ALL) {
    if (['fixture-62-osteo-woman-65-no-dexa.json', 'fixture-63-osteo-dexa-3yr-ago.json', 'fixture-64-osteo-prior-diagnosis.json'].includes(fx)) continue;
    test(`${fx} does not throw`, () => {
      expect(() => osteoporosisScreeningRule(loadFixture(fx))).not.toThrow();
    });
  }
});

describe('empty bundle', () => {
  test('zero findings', () => {
    const b: PatientBundle = { patient: { id: 'x', name: 'x' }, conditions: [], medications: [], observations: [], allergies: [] };
    expect(osteoporosisScreeningRule(b)).toHaveLength(0);
  });
});
