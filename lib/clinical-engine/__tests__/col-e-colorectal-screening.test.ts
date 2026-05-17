import * as fs from 'fs';
import * as path from 'path';
import {
  colColorectalScreeningRule,
  COL_AGE_MIN,
  COL_AGE_MAX,
} from '../rules/col-e-colorectal-screening';
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
    patient: { id: 't', name: 'Test', dob: dobForAge(55), sex: 'male' },
    conditions: [],
    medications: [],
    observations: [],
    allergies: [],
    ...overrides,
  };
}

describe('fixture-49 — 58yo M no screening → gap', () => {
  const findings = colColorectalScreeningRule(loadFixture('fixture-49-col-screening-gap.json'));
  test('one finding', () => {
    expect(findings).toHaveLength(1);
    expect(findings[0].ruleId).toBe('col-e-colorectal-screening');
    expect(findings[0].summary).toMatch(/USPSTF 2021 Grade A/);
  });
});

describe('fixture-50 — 62yo F colonoscopy 4yr ago → zero', () => {
  test('zero findings', () => {
    expect(colColorectalScreeningRule(loadFixture('fixture-50-col-colonoscopy-on-file.json'))).toHaveLength(0);
  });
});

describe('fixture-51 — 47yo M FIT 4mo ago → zero (Grade B band)', () => {
  test('zero findings', () => {
    expect(colColorectalScreeningRule(loadFixture('fixture-51-col-fit-on-file.json'))).toHaveLength(0);
  });
});

describe('fixture-52 — 65yo F total colectomy → zero (suppression)', () => {
  test('zero findings', () => {
    expect(colColorectalScreeningRule(loadFixture('fixture-52-col-total-colectomy.json'))).toHaveLength(0);
  });
});

describe('age boundaries', () => {
  test(`age ${COL_AGE_MIN} fires (Grade B)`, () => {
    const b = adultBundle({ patient: { id: 'a', name: 'a', dob: dobForAge(COL_AGE_MIN), sex: 'male' } });
    const f = colColorectalScreeningRule(b);
    expect(f).toHaveLength(1);
    expect(f[0].summary).toMatch(/Grade B/);
  });
  test(`age ${COL_AGE_MIN - 1} → zero (below band)`, () => {
    const b = adultBundle({ patient: { id: 'a', name: 'a', dob: dobForAge(COL_AGE_MIN - 1), sex: 'male' } });
    expect(colColorectalScreeningRule(b)).toHaveLength(0);
  });
  test(`age 55 fires (Grade A)`, () => {
    const b = adultBundle({ patient: { id: 'a', name: 'a', dob: dobForAge(55), sex: 'male' } });
    const f = colColorectalScreeningRule(b);
    expect(f).toHaveLength(1);
    expect(f[0].summary).toMatch(/Grade A/);
  });
  test(`age ${COL_AGE_MAX} fires (Grade A)`, () => {
    const b = adultBundle({ patient: { id: 'a', name: 'a', dob: dobForAge(COL_AGE_MAX), sex: 'male' } });
    expect(colColorectalScreeningRule(b)).toHaveLength(1);
  });
  test(`age ${COL_AGE_MAX + 1} → zero (above band)`, () => {
    const b = adultBundle({ patient: { id: 'a', name: 'a', dob: dobForAge(COL_AGE_MAX + 1), sex: 'male' } });
    expect(colColorectalScreeningRule(b)).toHaveLength(0);
  });
});

describe('modality recency windows', () => {
  test('colonoscopy 9 years ago → zero', () => {
    const b = adultBundle({
      observations: [{ display: 'Screening colonoscopy', effectiveDate: isoMonthsAgo(108) }],
    });
    expect(colColorectalScreeningRule(b)).toHaveLength(0);
  });
  test('colonoscopy 11 years ago → fires (stale)', () => {
    const b = adultBundle({
      observations: [{ display: 'Screening colonoscopy', effectiveDate: isoMonthsAgo(132) }],
    });
    expect(colColorectalScreeningRule(b)).toHaveLength(1);
  });
  test('FIT 13 months ago → fires (stale)', () => {
    const b = adultBundle({
      observations: [{ loincCode: '29771-3', value: 0, effectiveDate: isoMonthsAgo(13), category: 'laboratory' }],
    });
    expect(colColorectalScreeningRule(b)).toHaveLength(1);
  });
  test('Cologuard 2 years ago → zero', () => {
    const b = adultBundle({
      observations: [{ loincCode: '77353-1', value: 0, effectiveDate: isoMonthsAgo(24), category: 'laboratory' }],
    });
    expect(colColorectalScreeningRule(b)).toHaveLength(0);
  });
  test('flexible sigmoidoscopy 4 years ago → zero', () => {
    const b = adultBundle({
      observations: [{ display: 'Flexible sigmoidoscopy, screening', effectiveDate: isoMonthsAgo(48) }],
    });
    expect(colColorectalScreeningRule(b)).toHaveLength(0);
  });
  test('CT colonography 4 years ago → zero', () => {
    const b = adultBundle({
      observations: [{ display: 'CT colonography, virtual colonoscopy', effectiveDate: isoMonthsAgo(48) }],
    });
    expect(colColorectalScreeningRule(b)).toHaveLength(0);
  });
});

describe('cross-rule isolation — no existing fixture under 76 carries colon screening modality', () => {
  // Existing fixtures 01-48 do not document colorectal screening modalities.
  // Fixtures with patients in the 45-75 age band fire as co-triggers.
  const ALL = fs.readdirSync(FIXTURES_DIR).filter((f) => f.startsWith('fixture-') && f.endsWith('.json'));
  const NEW_OWN = new Set([
    'fixture-49-col-screening-gap.json',
    'fixture-50-col-colonoscopy-on-file.json',
    'fixture-51-col-fit-on-file.json',
    'fixture-52-col-total-colectomy.json',
  ]);
  for (const fx of ALL) {
    if (NEW_OWN.has(fx)) continue;
    test(`${fx} → outcome depends on patient age band`, () => {
      const bundle = loadFixture(fx);
      const dob = bundle.patient.dob;
      if (!dob) {
        expect(colColorectalScreeningRule(bundle)).toHaveLength(0);
        return;
      }
      const asOf = new Date();
      const birth = new Date(dob);
      let years = asOf.getUTCFullYear() - birth.getUTCFullYear();
      const mDiff = asOf.getUTCMonth() - birth.getUTCMonth();
      if (mDiff < 0 || (mDiff === 0 && asOf.getUTCDate() < birth.getUTCDate())) years -= 1;
      if (years >= COL_AGE_MIN && years <= COL_AGE_MAX) {
        expect(colColorectalScreeningRule(bundle)).toHaveLength(1);
      } else {
        expect(colColorectalScreeningRule(bundle)).toHaveLength(0);
      }
    });
  }
});

describe('empty bundle', () => {
  test('does not throw, zero findings', () => {
    const b: PatientBundle = { patient: { id: 'x', name: 'x' }, conditions: [], medications: [], observations: [], allergies: [] };
    expect(() => colColorectalScreeningRule(b)).not.toThrow();
    expect(colColorectalScreeningRule(b)).toHaveLength(0);
  });
});
