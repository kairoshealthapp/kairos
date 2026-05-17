import * as fs from 'fs';
import * as path from 'path';
import {
  depressionScreeningRule,
  DEPRESSION_AGE_MIN,
  DEPRESSION_RECENCY_MONTHS,
  DEPRESSION_PHQ2_POSITIVE_THRESHOLD,
} from '../rules/depression-screening';
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
    patient: { id: 't', name: 'Test', dob: dobForAge(40), sex: 'male' },
    conditions: [],
    medications: [],
    observations: [],
    allergies: [],
    ...overrides,
  };
}

describe('fixture-65 — 35yo M no PHQ-2 → missing-screen', () => {
  const f = depressionScreeningRule(loadFixture('fixture-65-depression-no-phq2.json'));
  test('one finding', () => {
    expect(f).toHaveLength(1);
    expect(f[0].subcategory).toBe('missing-screen');
  });
});

describe('fixture-66 — 44yo F PHQ-2=4, no PHQ-9 → missing-followup', () => {
  const f = depressionScreeningRule(loadFixture('fixture-66-depression-phq2-positive-no-phq9.json'));
  test('one finding', () => {
    expect(f).toHaveLength(1);
    expect(f[0].subcategory).toBe('missing-followup');
  });
});

describe('fixture-67 — 52yo M PHQ-2=1 negative → zero', () => {
  test('zero findings', () => {
    expect(depressionScreeningRule(loadFixture('fixture-67-depression-negative-phq2.json'))).toHaveLength(0);
  });
});

describe('age gate', () => {
  test(`age ${DEPRESSION_AGE_MIN} fires`, () => {
    expect(depressionScreeningRule(bundle({ patient: { id: 'a', name: 'a', dob: dobForAge(DEPRESSION_AGE_MIN), sex: 'male' } }))).toHaveLength(1);
  });
  test(`age ${DEPRESSION_AGE_MIN - 1} → zero (adolescent)`, () => {
    expect(depressionScreeningRule(bundle({ patient: { id: 'a', name: 'a', dob: dobForAge(DEPRESSION_AGE_MIN - 1), sex: 'male' } }))).toHaveLength(0);
  });
});

describe('PHQ-2 threshold and PHQ-9 follow-up', () => {
  const recent = isoMonthsAgo(2);
  test(`PHQ-2 = ${DEPRESSION_PHQ2_POSITIVE_THRESHOLD} (positive boundary), no PHQ-9 → followup gap`, () => {
    const b = bundle({ observations: [{ loincCode: '55758-7', value: DEPRESSION_PHQ2_POSITIVE_THRESHOLD, effectiveDate: recent, category: 'survey' }] });
    const f = depressionScreeningRule(b);
    expect(f).toHaveLength(1);
    expect(f[0].subcategory).toBe('missing-followup');
  });
  test(`PHQ-2 = ${DEPRESSION_PHQ2_POSITIVE_THRESHOLD - 1} (below threshold) → zero`, () => {
    const b = bundle({ observations: [{ loincCode: '55758-7', value: DEPRESSION_PHQ2_POSITIVE_THRESHOLD - 1, effectiveDate: recent, category: 'survey' }] });
    expect(depressionScreeningRule(b)).toHaveLength(0);
  });
  test('positive PHQ-2 + same-day PHQ-9 → zero', () => {
    const b = bundle({
      observations: [
        { loincCode: '55758-7', value: 5, effectiveDate: recent, category: 'survey' },
        { loincCode: '44249-1', value: 14, effectiveDate: recent, category: 'survey' },
      ],
    });
    expect(depressionScreeningRule(b)).toHaveLength(0);
  });
  test('positive PHQ-2 + earlier-only PHQ-9 → followup gap (PHQ-9 predates PHQ-2)', () => {
    const b = bundle({
      observations: [
        { loincCode: '55758-7', value: 5, effectiveDate: isoMonthsAgo(1), category: 'survey' },
        { loincCode: '44249-1', value: 14, effectiveDate: isoMonthsAgo(8), category: 'survey' },
      ],
    });
    const f = depressionScreeningRule(b);
    expect(f).toHaveLength(1);
    expect(f[0].subcategory).toBe('missing-followup');
  });
});

describe('recency window', () => {
  test(`PHQ-2 ${DEPRESSION_RECENCY_MONTHS + 1} months ago → missing-screen`, () => {
    const b = bundle({ observations: [{ loincCode: '55758-7', value: 0, effectiveDate: isoMonthsAgo(DEPRESSION_RECENCY_MONTHS + 1), category: 'survey' }] });
    const f = depressionScreeningRule(b);
    expect(f).toHaveLength(1);
    expect(f[0].subcategory).toBe('missing-screen');
  });
});

describe('cross-rule isolation — existing fixtures (does-not-throw)', () => {
  const ALL = fs.readdirSync(FIXTURES_DIR).filter((f) => f.startsWith('fixture-') && f.endsWith('.json'));
  for (const fx of ALL) {
    if (['fixture-65-depression-no-phq2.json', 'fixture-66-depression-phq2-positive-no-phq9.json', 'fixture-67-depression-negative-phq2.json'].includes(fx)) continue;
    test(`${fx} does not throw`, () => {
      expect(() => depressionScreeningRule(loadFixture(fx))).not.toThrow();
    });
  }
});

describe('empty bundle', () => {
  test('zero findings', () => {
    const b: PatientBundle = { patient: { id: 'x', name: 'x' }, conditions: [], medications: [], observations: [], allergies: [] };
    expect(depressionScreeningRule(b)).toHaveLength(0);
  });
});
