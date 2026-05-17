import * as fs from 'fs';
import * as path from 'path';
import {
  lscLungCancerScreeningRule,
  LSC_AGE_MIN,
  LSC_AGE_MAX,
  LSC_PACK_YEARS_THRESHOLD,
  LSC_QUIT_WINDOW_YEARS,
} from '../rules/lsc-lung-cancer-screening';
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

function isoYearsAgo(years: number): string {
  const d = new Date();
  d.setUTCFullYear(d.getUTCFullYear() - years);
  return d.toISOString().slice(0, 10);
}

function smokerBundle(overrides: Partial<PatientBundle> = {}): PatientBundle {
  return {
    patient: { id: 't', name: 'Test', dob: dobForAge(60), sex: 'male' },
    conditions: [],
    medications: [],
    observations: [
      { loincCode: '72166-2', display: 'Current every day smoker', effectiveDate: '2026-01-01', category: 'social-history' },
      { loincCode: '88029-4', value: 30, effectiveDate: '2026-01-01', category: 'social-history' },
    ],
    allergies: [],
    ...overrides,
  };
}

describe('fixture-74 — eligible current smoker no LDCT → gap', () => {
  test('one finding', () => {
    expect(lscLungCancerScreeningRule(loadFixture('fixture-74-lsc-eligible-no-ldct.json'))).toHaveLength(1);
  });
});

describe('fixture-75 — former smoker quit 20yr ago → zero (out of window)', () => {
  test('zero findings', () => {
    expect(lscLungCancerScreeningRule(loadFixture('fixture-75-lsc-former-quit-20yr.json'))).toHaveLength(0);
  });
});

describe('fixture-76 — eligible, LDCT 6mo ago → zero', () => {
  test('zero findings', () => {
    expect(lscLungCancerScreeningRule(loadFixture('fixture-76-lsc-ldct-recent.json'))).toHaveLength(0);
  });
});

describe('age gate', () => {
  test(`age ${LSC_AGE_MIN} eligible → fires`, () => {
    expect(lscLungCancerScreeningRule(smokerBundle({ patient: { id: 'a', name: 'a', dob: dobForAge(LSC_AGE_MIN), sex: 'male' } }))).toHaveLength(1);
  });
  test(`age ${LSC_AGE_MIN - 1} → zero`, () => {
    expect(lscLungCancerScreeningRule(smokerBundle({ patient: { id: 'a', name: 'a', dob: dobForAge(LSC_AGE_MIN - 1), sex: 'male' } }))).toHaveLength(0);
  });
  test(`age ${LSC_AGE_MAX + 1} → zero`, () => {
    expect(lscLungCancerScreeningRule(smokerBundle({ patient: { id: 'a', name: 'a', dob: dobForAge(LSC_AGE_MAX + 1), sex: 'male' } }))).toHaveLength(0);
  });
});

describe('pack-years threshold', () => {
  test(`exactly ${LSC_PACK_YEARS_THRESHOLD} fires`, () => {
    const b = smokerBundle({ observations: [
      { loincCode: '72166-2', display: 'Current every day smoker', effectiveDate: '2026-01-01', category: 'social-history' },
      { loincCode: '88029-4', value: LSC_PACK_YEARS_THRESHOLD, effectiveDate: '2026-01-01', category: 'social-history' },
    ]});
    expect(lscLungCancerScreeningRule(b)).toHaveLength(1);
  });
  test(`${LSC_PACK_YEARS_THRESHOLD - 1} pack-years → zero`, () => {
    const b = smokerBundle({ observations: [
      { loincCode: '72166-2', display: 'Current every day smoker', effectiveDate: '2026-01-01', category: 'social-history' },
      { loincCode: '88029-4', value: LSC_PACK_YEARS_THRESHOLD - 1, effectiveDate: '2026-01-01', category: 'social-history' },
    ]});
    expect(lscLungCancerScreeningRule(b)).toHaveLength(0);
  });
});

describe('quit-status windows', () => {
  test(`former smoker quit ${LSC_QUIT_WINDOW_YEARS - 1} years ago → fires`, () => {
    const b = smokerBundle({ observations: [
      { loincCode: '72166-2', display: 'Former smoker', effectiveDate: '2026-01-01', category: 'social-history' },
      { loincCode: '88029-4', value: 25, effectiveDate: '2026-01-01', category: 'social-history' },
      { loincCode: '74010-0', effectiveDate: isoYearsAgo(LSC_QUIT_WINDOW_YEARS - 1), category: 'social-history' },
    ]});
    expect(lscLungCancerScreeningRule(b)).toHaveLength(1);
  });
  test(`former smoker quit ${LSC_QUIT_WINDOW_YEARS + 1} years ago → zero`, () => {
    const b = smokerBundle({ observations: [
      { loincCode: '72166-2', display: 'Former smoker', effectiveDate: '2026-01-01', category: 'social-history' },
      { loincCode: '88029-4', value: 25, effectiveDate: '2026-01-01', category: 'social-history' },
      { loincCode: '74010-0', effectiveDate: isoYearsAgo(LSC_QUIT_WINDOW_YEARS + 1), category: 'social-history' },
    ]});
    expect(lscLungCancerScreeningRule(b)).toHaveLength(0);
  });
  test('never smoker → zero', () => {
    const b = smokerBundle({ observations: [
      { loincCode: '72166-2', display: 'Never smoker', effectiveDate: '2026-01-01', category: 'social-history' },
      { loincCode: '88029-4', value: 0, effectiveDate: '2026-01-01', category: 'social-history' },
    ]});
    expect(lscLungCancerScreeningRule(b)).toHaveLength(0);
  });
  test('unknown smoking status → zero', () => {
    const b = smokerBundle({ observations: [
      { loincCode: '88029-4', value: 30, effectiveDate: '2026-01-01', category: 'social-history' },
    ]});
    expect(lscLungCancerScreeningRule(b)).toHaveLength(0);
  });
});

describe('prior lung cancer suppression', () => {
  test('C34 ICD → zero', () => {
    const b = smokerBundle({ conditions: [{ code: 'C34.91', codeSystem: 'icd10', status: 'active', display: 'Lung CA' }] });
    expect(lscLungCancerScreeningRule(b)).toHaveLength(0);
  });
});

describe('cross-rule isolation', () => {
  const ALL = fs.readdirSync(FIXTURES_DIR).filter((f) => f.startsWith('fixture-') && f.endsWith('.json'));
  for (const fx of ALL) {
    if (['fixture-74-lsc-eligible-no-ldct.json', 'fixture-75-lsc-former-quit-20yr.json', 'fixture-76-lsc-ldct-recent.json'].includes(fx)) continue;
    test(`${fx} → zero (no other fixture documents pack-years + current smoker status)`, () => {
      expect(lscLungCancerScreeningRule(loadFixture(fx))).toHaveLength(0);
    });
  }
});

describe('empty bundle', () => {
  test('zero findings', () => {
    const b: PatientBundle = { patient: { id: 'x', name: 'x' }, conditions: [], medications: [], observations: [], allergies: [] };
    expect(lscLungCancerScreeningRule(b)).toHaveLength(0);
  });
});
