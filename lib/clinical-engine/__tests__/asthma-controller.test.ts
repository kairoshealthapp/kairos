import * as fs from 'fs';
import * as path from 'path';
import { asthmaControllerRule, ASTHMA_EXACERBATION_WINDOW_MONTHS } from '../rules/asthma-controller';
import type { PatientBundle } from '../types';

const FIXTURES_DIR = path.join(__dirname, '..', 'fixtures');

function loadFixture(filename: string): PatientBundle {
  return JSON.parse(fs.readFileSync(path.join(FIXTURES_DIR, filename), 'utf8')) as PatientBundle;
}

function isoMonthsAgo(months: number): string {
  const d = new Date();
  d.setUTCMonth(d.getUTCMonth() - months);
  return d.toISOString().slice(0, 10);
}

function asthmaBundle(overrides: Partial<PatientBundle> = {}): PatientBundle {
  return {
    patient: { id: 't', name: 'Test', dob: '1990-01-01', sex: 'female' },
    conditions: [{ code: 'J45.40', codeSystem: 'icd10', status: 'active', display: 'asthma' }],
    medications: [],
    observations: [],
    allergies: [],
    ...overrides,
  };
}

describe('fixture-71 — SABA-only asthma → gap', () => {
  const f = asthmaControllerRule(loadFixture('fixture-71-asthma-saba-only.json'));
  test('one finding', () => {
    expect(f).toHaveLength(1);
    expect(f[0].ruleId).toBe('asthma-controller');
  });
});

describe('fixture-72 — on ICS-LABA → zero', () => {
  test('zero findings', () => {
    expect(asthmaControllerRule(loadFixture('fixture-72-asthma-on-ics-laba.json'))).toHaveLength(0);
  });
});

describe('fixture-73 — recent exacerbation, no ICS → gap', () => {
  const f = asthmaControllerRule(loadFixture('fixture-73-asthma-exacerbation.json'));
  test('one finding', () => {
    expect(f).toHaveLength(1);
    expect(f[0].summary).toMatch(/exacerbation/);
  });
});

describe('uncontrolled signal logic', () => {
  test('asthma + ICS-only, no SABA, no exacerbation → zero', () => {
    const b = asthmaBundle({
      medications: [
        { rxnormCode: 'x', name: 'fluticasone 110 mcg', genericName: 'fluticasone', status: 'active', route: 'inhalation' },
      ],
    });
    expect(asthmaControllerRule(b)).toHaveLength(0);
  });
  test('asthma + no meds, no exacerbation → zero (no uncontrolled signal)', () => {
    expect(asthmaControllerRule(asthmaBundle())).toHaveLength(0);
  });
});

describe('ICS recognition coverage', () => {
  for (const gen of ['fluticasone', 'budesonide', 'mometasone', 'beclomethasone', 'ciclesonide']) {
    test(`${gen} active suppresses gap`, () => {
      const b = asthmaBundle({
        medications: [
          { rxnormCode: 'x', name: gen, genericName: gen, status: 'active', route: 'inhalation' },
          { rxnormCode: '435', name: 'albuterol', genericName: 'albuterol', status: 'active', route: 'inhalation' },
        ],
      });
      expect(asthmaControllerRule(b)).toHaveLength(0);
    });
  }
});

describe('exacerbation window', () => {
  test('exacerbation 6mo ago → fires', () => {
    const b = asthmaBundle({
      conditions: [
        { code: 'J45.41', codeSystem: 'icd10', status: 'resolved', display: 'exac', onsetDate: isoMonthsAgo(6) },
        { code: 'J45.40', codeSystem: 'icd10', status: 'active', display: 'asthma' },
      ],
    });
    expect(asthmaControllerRule(b)).toHaveLength(1);
  });
  test(`exacerbation ${ASTHMA_EXACERBATION_WINDOW_MONTHS + 1} months ago → does not count`, () => {
    const b = asthmaBundle({
      conditions: [
        { code: 'J45.41', codeSystem: 'icd10', status: 'resolved', display: 'exac', onsetDate: isoMonthsAgo(ASTHMA_EXACERBATION_WINDOW_MONTHS + 1) },
        { code: 'J45.40', codeSystem: 'icd10', status: 'active', display: 'asthma' },
      ],
    });
    expect(asthmaControllerRule(b)).toHaveLength(0);
  });
});

describe('cross-rule isolation', () => {
  const ALL = fs.readdirSync(FIXTURES_DIR).filter((f) => f.startsWith('fixture-') && f.endsWith('.json'));
  for (const fx of ALL) {
    if (['fixture-71-asthma-saba-only.json', 'fixture-72-asthma-on-ics-laba.json', 'fixture-73-asthma-exacerbation.json'].includes(fx)) continue;
    test(`${fx} → zero (no asthma ICD in other fixtures)`, () => {
      expect(asthmaControllerRule(loadFixture(fx))).toHaveLength(0);
    });
  }
});

describe('empty bundle', () => {
  test('zero findings', () => {
    const b: PatientBundle = { patient: { id: 'x', name: 'x' }, conditions: [], medications: [], observations: [], allergies: [] };
    expect(asthmaControllerRule(b)).toHaveLength(0);
  });
});
