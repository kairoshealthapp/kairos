import * as fs from 'fs';
import * as path from 'path';
import { tscTobaccoCessationRule, TSC_RECENCY_MONTHS, TSC_AGE_MIN } from '../rules/tsc-e-tobacco-cessation';
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
    patient: { id: 't', name: 'Test', dob: dobForAge(40), sex: 'male' },
    conditions: [],
    medications: [],
    observations: [],
    allergies: [],
    ...overrides,
  };
}

describe('fixture-77 — no tobacco screen → missing-screen', () => {
  const f = tscTobaccoCessationRule(loadFixture('fixture-77-tsc-no-screen.json'));
  test('one finding', () => {
    expect(f).toHaveLength(1);
    expect(f[0].subcategory).toBe('missing-screen');
  });
});

describe('fixture-78 — current smoker no intervention → missing-cessation', () => {
  const f = tscTobaccoCessationRule(loadFixture('fixture-78-tsc-current-no-intervention.json'));
  test('one finding', () => {
    expect(f).toHaveLength(1);
    expect(f[0].subcategory).toBe('missing-cessation');
  });
});

describe('fixture-79 — current smoker on varenicline → zero', () => {
  test('zero findings', () => {
    expect(tscTobaccoCessationRule(loadFixture('fixture-79-tsc-on-varenicline.json'))).toHaveLength(0);
  });
});

describe('age gate', () => {
  test(`age ${TSC_AGE_MIN - 1} → zero`, () => {
    const b = adultBundle({ patient: { id: 'a', name: 'a', dob: dobForAge(TSC_AGE_MIN - 1), sex: 'male' } });
    expect(tscTobaccoCessationRule(b)).toHaveLength(0);
  });
});

describe('cessation recognition', () => {
  const recent = isoMonthsAgo(2);
  test('counseling by display token suppresses', () => {
    const b = adultBundle({
      observations: [
        { loincCode: '72166-2', display: 'Current every day smoker', effectiveDate: recent, category: 'social-history' },
        { display: 'Tobacco cessation counseling 5 minutes (CPT 99406)', effectiveDate: recent, category: 'procedure' },
      ],
    });
    expect(tscTobaccoCessationRule(b)).toHaveLength(0);
  });
  test('nicotine patch suppresses', () => {
    const b = adultBundle({
      medications: [{ rxnormCode: '7393', name: 'nicotine 21 MG transdermal patch', genericName: 'nicotine', status: 'active', route: 'transdermal' }],
      observations: [{ loincCode: '72166-2', display: 'Current every day smoker', effectiveDate: recent, category: 'social-history' }],
    });
    expect(tscTobaccoCessationRule(b)).toHaveLength(0);
  });
  test('bupropion suppresses', () => {
    const b = adultBundle({
      medications: [{ rxnormCode: '42347', name: 'bupropion SR 150 MG', genericName: 'bupropion', status: 'active', route: 'oral' }],
      observations: [{ loincCode: '72166-2', display: 'Current every day smoker', effectiveDate: recent, category: 'social-history' }],
    });
    expect(tscTobaccoCessationRule(b)).toHaveLength(0);
  });
  test('inactive pharmacotherapy does NOT suppress', () => {
    const b = adultBundle({
      medications: [{ rxnormCode: '588227', name: 'varenicline', genericName: 'varenicline', status: 'discontinued', route: 'oral' }],
      observations: [{ loincCode: '72166-2', display: 'Current every day smoker', effectiveDate: recent, category: 'social-history' }],
    });
    expect(tscTobaccoCessationRule(b)).toHaveLength(1);
  });
});

describe('non-smoker is fully satisfied', () => {
  test('former smoker → zero (screen satisfied, not current)', () => {
    const b = adultBundle({
      observations: [{ loincCode: '72166-2', display: 'Former smoker', effectiveDate: isoMonthsAgo(2), category: 'social-history' }],
    });
    expect(tscTobaccoCessationRule(b)).toHaveLength(0);
  });
  test('never smoker → zero', () => {
    const b = adultBundle({
      observations: [{ loincCode: '72166-2', display: 'Never smoker', effectiveDate: isoMonthsAgo(2), category: 'social-history' }],
    });
    expect(tscTobaccoCessationRule(b)).toHaveLength(0);
  });
});

describe('recency window', () => {
  test(`screen ${TSC_RECENCY_MONTHS + 1} months ago → missing-screen`, () => {
    const b = adultBundle({
      observations: [{ loincCode: '72166-2', display: 'Never smoker', effectiveDate: isoMonthsAgo(TSC_RECENCY_MONTHS + 1), category: 'social-history' }],
    });
    expect(tscTobaccoCessationRule(b)).toHaveLength(1);
  });
});

describe('cross-rule isolation', () => {
  const ALL = fs.readdirSync(FIXTURES_DIR).filter((f) => f.startsWith('fixture-') && f.endsWith('.json'));
  const NEW_OWN = new Set(['fixture-77-tsc-no-screen.json', 'fixture-78-tsc-current-no-intervention.json', 'fixture-79-tsc-on-varenicline.json']);
  // Every adult fixture without tobacco screen documented will fire missing-screen.
  // Verify the rule does not throw on existing fixtures (it can fire on many of them).
  for (const fx of ALL) {
    if (NEW_OWN.has(fx)) continue;
    test(`${fx} does not throw`, () => {
      expect(() => tscTobaccoCessationRule(loadFixture(fx))).not.toThrow();
    });
  }
});

describe('empty bundle', () => {
  test('zero findings', () => {
    const b: PatientBundle = { patient: { id: 'x', name: 'x' }, conditions: [], medications: [], observations: [], allergies: [] };
    expect(tscTobaccoCessationRule(b)).toHaveLength(0);
  });
});
