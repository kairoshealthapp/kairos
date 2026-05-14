import * as fs from 'fs';
import * as path from 'path';
import {
  lpaScreeningRule,
  LPA_LOINC_CODES,
  LPA_ADULT_AGE_THRESHOLD,
} from '../rules/lp-a-screening';
import type { PatientBundle } from '../types';

const FIXTURES_DIR = path.join(__dirname, '..', 'fixtures');

function loadFixture(filename: string): PatientBundle {
  const raw = fs.readFileSync(path.join(FIXTURES_DIR, filename), 'utf8');
  return JSON.parse(raw) as PatientBundle;
}

function dobForAge(age: number): string {
  const d = new Date();
  d.setUTCFullYear(d.getUTCFullYear() - age);
  d.setUTCDate(d.getUTCDate() - 1); // ensure birthday already passed this year
  return d.toISOString().slice(0, 10);
}

function emptyBundle(overrides: Partial<PatientBundle> = {}): PatientBundle {
  return {
    patient: { id: 't', name: 'Test', dob: dobForAge(40), sex: 'male' },
    conditions: [],
    medications: [],
    observations: [],
    allergies: [],
    ...overrides,
  };
}

describe('fixture-06-lpa-screening-gap.json — adult, no Lp(a) ever measured', () => {
  const bundle = loadFixture('fixture-06-lpa-screening-gap.json');
  const findings = lpaScreeningRule(bundle);

  test('exactly one finding emitted', () => {
    expect(findings).toHaveLength(1);
  });

  test('finding has correct ruleId', () => {
    expect(findings[0].ruleId).toBe('lpa-screening');
  });

  test('finding has severity gap and status missing', () => {
    expect(findings[0].severity).toBe('gap');
    expect(findings[0].status).toBe('missing');
  });

  test('finding category is lpa-screening', () => {
    expect(findings[0].category).toBe('lpa-screening');
  });

  test('summary references the 2026 ACC/AHA guideline', () => {
    expect(findings[0].summary).toMatch(/2026 ACC\/AHA/);
    expect(findings[0].summary).toMatch(/Class I/);
  });

  test('recommendation tells clinician to order Lp(a)', () => {
    expect(findings[0].recommendation).toMatch(/Lp\(a\)/);
  });
});

describe('fixture-07-lpa-measured-normal.json — adult, Lp(a) 25 nmol/L on file', () => {
  const bundle = loadFixture('fixture-07-lpa-measured-normal.json');
  const findings = lpaScreeningRule(bundle);

  test('zero findings (screening satisfied regardless of value)', () => {
    expect(findings).toHaveLength(0);
  });
});

describe('fixture-08-lpa-measured-elevated.json — adult, Lp(a) 150 nmol/L on file', () => {
  const bundle = loadFixture('fixture-08-lpa-measured-elevated.json');
  const findings = lpaScreeningRule(bundle);

  test('zero findings (this rule is screening-only; elevated value does not change output)', () => {
    expect(findings).toHaveLength(0);
  });
});

describe('pediatric patient — out of scope', () => {
  const bundle = emptyBundle({
    patient: { id: 'ped', name: 'Pediatric Patient', dob: dobForAge(12), sex: 'female' },
  });
  const findings = lpaScreeningRule(bundle);

  test('zero findings (below adult age threshold)', () => {
    expect(findings).toHaveLength(0);
  });
});

describe('multi-LOINC coverage — adult with each Lp(a) LOINC variant satisfies screening', () => {
  for (const loinc of LPA_LOINC_CODES) {
    test(`zero findings when Lp(a) observation uses LOINC ${loinc}`, () => {
      const bundle = emptyBundle({
        observations: [
          {
            loincCode: loinc,
            display: `Lipoprotein a (${loinc})`,
            value: 30,
            unit: loinc === '10835-7' ? 'mg/dL' : 'nmol/L',
            effectiveDate: '2024-01-15',
            category: 'laboratory',
          },
        ],
      });
      const findings = lpaScreeningRule(bundle);
      expect(findings).toHaveLength(0);
    });
  }
});

describe('empty bundle — adult with no observations at all', () => {
  const bundle = emptyBundle();
  const findings = lpaScreeningRule(bundle);

  test('one gap finding (adult, no observations)', () => {
    expect(findings).toHaveLength(1);
    expect(findings[0].status).toBe('missing');
  });

  test('does not throw on empty arrays', () => {
    expect(() =>
      lpaScreeningRule({
        patient: { id: 'x', name: 'x' },
        conditions: [],
        medications: [],
        observations: [],
        allergies: [],
      })
    ).not.toThrow();
  });
});

describe('age boundary — exactly at threshold fires, just under does not', () => {
  test(`age exactly ${LPA_ADULT_AGE_THRESHOLD} fires a gap`, () => {
    const bundle = emptyBundle({
      patient: { id: 'b1', name: 'b1', dob: dobForAge(LPA_ADULT_AGE_THRESHOLD), sex: 'male' },
    });
    expect(lpaScreeningRule(bundle)).toHaveLength(1);
  });

  test(`age ${LPA_ADULT_AGE_THRESHOLD - 1} emits nothing`, () => {
    const bundle = emptyBundle({
      patient: { id: 'b2', name: 'b2', dob: dobForAge(LPA_ADULT_AGE_THRESHOLD - 1), sex: 'male' },
    });
    expect(lpaScreeningRule(bundle)).toHaveLength(0);
  });
});

describe('unknown DOB — out of scope', () => {
  test('zero findings when patient.dob is missing', () => {
    const bundle: PatientBundle = {
      patient: { id: 'nodob', name: 'No DOB' },
      conditions: [],
      medications: [],
      observations: [],
      allergies: [],
    };
    expect(lpaScreeningRule(bundle)).toHaveLength(0);
  });
});

describe('non-Lp(a) observations do not satisfy screening', () => {
  test('adult with full lipid panel but no Lp(a) still fires gap', () => {
    const bundle = emptyBundle({
      observations: [
        { loincCode: '13457-7', display: 'LDL', value: 130, unit: 'mg/dL', effectiveDate: '2025-01-01', category: 'laboratory' },
        { loincCode: '2085-9', display: 'HDL', value: 50, unit: 'mg/dL', effectiveDate: '2025-01-01', category: 'laboratory' },
        { loincCode: '2571-8', display: 'Trig', value: 150, unit: 'mg/dL', effectiveDate: '2025-01-01', category: 'laboratory' },
      ],
    });
    const findings = lpaScreeningRule(bundle);
    expect(findings).toHaveLength(1);
    expect(findings[0].status).toBe('missing');
  });
});
