import * as fs from 'fs';
import * as path from 'path';
import {
  gsdGlycemicStatusRule,
  GSD_AGE_MIN,
  GSD_A1C_POOR_CONTROL_THRESHOLD,
  GSD_RECENCY_MONTHS,
} from '../rules/gsd-glycemic-status';
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

function dmBundle(overrides: Partial<PatientBundle> = {}): PatientBundle {
  return {
    patient: { id: 't', name: 'Test', dob: dobForAge(60), sex: 'male' },
    conditions: [{ code: 'E11.9', codeSystem: 'icd10', status: 'active', display: 'T2DM' }],
    medications: [],
    observations: [],
    allergies: [],
    ...overrides,
  };
}

function a1c(val: number, effDate: string) {
  return [{ loincCode: '4548-4', value: val, unit: '%', effectiveDate: effDate, category: 'laboratory' }];
}

describe('fixture-46 — 54yo M T2DM A1C 10.4% → uncontrolled gap', () => {
  const findings = gsdGlycemicStatusRule(loadFixture('fixture-46-gsd-uncontrolled.json'));
  test('one finding', () => {
    expect(findings).toHaveLength(1);
    expect(findings[0].ruleId).toBe('gsd-glycemic-status');
    expect(findings[0].subcategory).toBe('uncontrolled');
  });
  test('summary cites the A1C value', () => {
    expect(findings[0].summary).toMatch(/10\.4%/);
  });
});

describe('fixture-47 — 48yo F T2DM A1C 14 months ago → missing gap', () => {
  const findings = gsdGlycemicStatusRule(loadFixture('fixture-47-gsd-no-recent-a1c.json'));
  test('one missing-measurement finding', () => {
    expect(findings).toHaveLength(1);
    expect(findings[0].subcategory).toBe('missing-measurement');
  });
});

describe('fixture-48 — 60yo M T2DM A1C 6.7% controlled → zero findings', () => {
  test('zero findings', () => {
    expect(gsdGlycemicStatusRule(loadFixture('fixture-48-gsd-controlled.json'))).toHaveLength(0);
  });
});

describe('age and DM gates', () => {
  const recent = isoMonthsAgo(2);
  test(`age ${GSD_AGE_MIN} fires`, () => {
    const b = dmBundle({ patient: { id: 'a', name: 'a', dob: dobForAge(GSD_AGE_MIN), sex: 'male' } });
    expect(gsdGlycemicStatusRule(b)).toHaveLength(1);
  });
  test(`age ${GSD_AGE_MIN - 1} → zero`, () => {
    const b = dmBundle({ patient: { id: 'a', name: 'a', dob: dobForAge(GSD_AGE_MIN - 1), sex: 'male' } });
    expect(gsdGlycemicStatusRule(b)).toHaveLength(0);
  });
  test('T1DM also qualifies', () => {
    const b = dmBundle({
      conditions: [{ code: 'E10.9', codeSystem: 'icd10', status: 'active', display: 'T1DM' }],
      observations: a1c(10.5, recent),
    });
    expect(gsdGlycemicStatusRule(b)).toHaveLength(1);
    expect(gsdGlycemicStatusRule(b)[0].subcategory).toBe('uncontrolled');
  });
  test('non-diabetic → zero', () => {
    const b = dmBundle({ conditions: [{ code: 'I10', codeSystem: 'icd10', status: 'active', display: 'HTN' }] });
    expect(gsdGlycemicStatusRule(b)).toHaveLength(0);
  });
});

describe('A1C threshold boundaries', () => {
  const recent = isoMonthsAgo(1);
  test(`exactly ${GSD_A1C_POOR_CONTROL_THRESHOLD}% → controlled (zero)`, () => {
    const b = dmBundle({ observations: a1c(GSD_A1C_POOR_CONTROL_THRESHOLD, recent) });
    expect(gsdGlycemicStatusRule(b)).toHaveLength(0);
  });
  test(`${GSD_A1C_POOR_CONTROL_THRESHOLD + 0.1}% → uncontrolled`, () => {
    const b = dmBundle({ observations: a1c(GSD_A1C_POOR_CONTROL_THRESHOLD + 0.1, recent) });
    const f = gsdGlycemicStatusRule(b);
    expect(f).toHaveLength(1);
    expect(f[0].subcategory).toBe('uncontrolled');
  });
});

describe('recency window', () => {
  test(`A1C ${GSD_RECENCY_MONTHS - 1} months ago, normal → zero`, () => {
    const b = dmBundle({ observations: a1c(6.5, isoMonthsAgo(GSD_RECENCY_MONTHS - 1)) });
    expect(gsdGlycemicStatusRule(b)).toHaveLength(0);
  });
  test(`A1C ${GSD_RECENCY_MONTHS + 1} months ago → missing-measurement`, () => {
    const b = dmBundle({ observations: a1c(6.5, isoMonthsAgo(GSD_RECENCY_MONTHS + 1)) });
    const f = gsdGlycemicStatusRule(b);
    expect(f).toHaveLength(1);
    expect(f[0].subcategory).toBe('missing-measurement');
  });
});

describe('cross-rule isolation — existing diabetes fixtures fire as co-triggers (no A1C on file)', () => {
  // Every existing fixture with E10.x/E11.x ICD has no A1C observation,
  // therefore every diabetes-bearing fixture fires missing-measurement.
  const DIABETES_FIXTURES = [
    'fixture-11-apob-diabetes-qualifier.json',
    'fixture-14-apob-measured-suppression.json',
    'fixture-17-statin-diabetes-gap.json',
    'fixture-19-afib-anticoagulation-gap-male.json',
    'fixture-22-afib-aspirin-only-still-fires.json',
    'fixture-24-hfpef-sglt2i-gap.json',
    'fixture-27-hfpef-t1dm.json',
    'fixture-36-t2dm-ckd-sglt2i-gap.json',
    'fixture-37-t2dm-ckd-on-canagliflozin.json',
    'fixture-38-t2dm-no-ckd-no-gap.json',
    'fixture-39-t2dm-egfr-contraindicated.json',
    'fixture-40-t2dm-statin-gap.json',
    'fixture-41-t2dm-on-rosuvastatin.json',
    // fixture-42 — patient age below GSD_AGE_MIN if dob is recent? 1991-02-14 → adult, fires
    'fixture-42-t2dm-age-out-of-band.json',
    'fixture-61-ais-young-diabetes-pneumo.json',  // 42yo F T2DM (added for AIS-E rule)
  ];
  for (const fx of DIABETES_FIXTURES) {
    test(`${fx} → CO-TRIGGER missing-measurement (no A1C)`, () => {
      const findings = gsdGlycemicStatusRule(loadFixture(fx));
      expect(findings).toHaveLength(1);
      expect(findings[0].subcategory).toBe('missing-measurement');
    });
  }

  // Every other fixture (non-diabetic) emits zero.
  const ALL = fs.readdirSync(FIXTURES_DIR).filter((f) => f.startsWith('fixture-') && f.endsWith('.json'));
  const NEW_OWN = new Set(['fixture-46-gsd-uncontrolled.json', 'fixture-47-gsd-no-recent-a1c.json', 'fixture-48-gsd-controlled.json']);
  for (const fx of ALL) {
    if (DIABETES_FIXTURES.includes(fx) || NEW_OWN.has(fx)) continue;
    test(`${fx} (non-diabetic) → zero findings`, () => {
      expect(gsdGlycemicStatusRule(loadFixture(fx))).toHaveLength(0);
    });
  }
});

describe('empty bundle', () => {
  test('does not throw, zero findings', () => {
    const b: PatientBundle = { patient: { id: 'x', name: 'x' }, conditions: [], medications: [], observations: [], allergies: [] };
    expect(() => gsdGlycemicStatusRule(b)).not.toThrow();
    expect(gsdGlycemicStatusRule(b)).toHaveLength(0);
  });
});
