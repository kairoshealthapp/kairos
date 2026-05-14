import * as fs from 'fs';
import * as path from 'path';
import {
  t2dmStatinRule,
  T2DM_STATIN_AGE_MIN,
  T2DM_STATIN_AGE_MAX,
} from '../rules/t2dm-statin';
import { statinInitiationRule } from '../rules/statin-initiation';
import type { PatientBundle, PatientCondition } from '../types';

const FIXTURES_DIR = path.join(__dirname, '..', 'fixtures');

function loadFixture(filename: string): PatientBundle {
  const raw = fs.readFileSync(path.join(FIXTURES_DIR, filename), 'utf8');
  return JSON.parse(raw) as PatientBundle;
}

function dobForAge(age: number): string {
  const d = new Date();
  d.setUTCFullYear(d.getUTCFullYear() - age);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

const T2DM: PatientCondition = {
  code: 'E11.9',
  codeSystem: 'http://hl7.org/fhir/sid/icd-10-cm',
  display: 'Type 2 diabetes mellitus',
  status: 'active',
};

function bundle(overrides: Partial<PatientBundle>): PatientBundle {
  return {
    patient: { id: 't', name: 'Test', dob: dobForAge(55), sex: 'male' },
    conditions: [T2DM],
    medications: [],
    observations: [],
    allergies: [],
    ...overrides,
  };
}

describe('fixture-40 — 55yo M T2DM no statin → fires gap', () => {
  const findings = t2dmStatinRule(loadFixture('fixture-40-t2dm-statin-gap.json'));

  test('one finding', () => {
    expect(findings).toHaveLength(1);
    expect(findings[0].ruleId).toBe('t2dm-statin');
    expect(findings[0].severity).toBe('gap');
    expect(findings[0].status).toBe('missing');
  });

  test('summary cites ADA Standards 2026', () => {
    expect(findings[0].summary).toMatch(/ADA Standards/);
    expect(findings[0].summary).toMatch(/2026/);
  });
});

describe('fixture-41 — 60yo F T2DM on rosuvastatin → suppression', () => {
  test('zero findings', () => {
    expect(t2dmStatinRule(loadFixture('fixture-41-t2dm-on-rosuvastatin.json'))).toHaveLength(0);
  });
});

describe('fixture-42 — 35yo M T2DM → zero (below age band)', () => {
  test('zero findings', () => {
    expect(t2dmStatinRule(loadFixture('fixture-42-t2dm-age-out-of-band.json'))).toHaveLength(0);
  });
});

describe('convergent-evidence pattern — fixture-17 fires BOTH statin rules', () => {
  // fixture-17: 55yo M T2DM, LDL 120, no statin. Sourced for rule #5
  // (statin-initiation, diabetes-age path) and now also satisfies rule
  // #11 (ADA T2DM age 40-75). Both rules fire — different evidence
  // pedigrees, same clinical action. This is the intentional
  // convergent-evidence pattern (ADR 0016).
  const fx = loadFixture('fixture-17-statin-diabetes-gap.json');
  const statinFinding = statinInitiationRule(fx);
  const t2dmFinding = t2dmStatinRule(fx);

  test('statin-initiation rule fires (diabetes-age path)', () => {
    expect(statinFinding).toHaveLength(1);
    expect(statinFinding[0].summary).toMatch(/diabetes/);
  });

  test('t2dm-statin rule also fires (ADA citation)', () => {
    expect(t2dmFinding).toHaveLength(1);
    expect(t2dmFinding[0].summary).toMatch(/ADA Standards/);
  });

  test('combined findings count = 2 with distinct ruleIds', () => {
    const combined = [...statinFinding, ...t2dmFinding];
    expect(combined).toHaveLength(2);
    const ruleIds = combined.map((f) => f.ruleId).sort();
    expect(ruleIds).toEqual(['statin-initiation', 't2dm-statin']);
  });
});

describe('cross-rule isolation — most fixtures emit zero t2dm-statin', () => {
  // Co-trigger fixtures with T2DM age 40-75 no-statin documented below.
  for (const fx of [
    'fixture-01-all-gaps.json',
    'fixture-02-tartrate-trap.json',
    'fixture-03-full-gdmt.json',
    'fixture-04-mra-contraindicated.json',
    'fixture-05-bb-asthma.json',
    'fixture-06-lpa-screening-gap.json',
    'fixture-07-lpa-measured-normal.json',
    'fixture-08-lpa-measured-elevated.json',
    'fixture-09-nsaid-hf-interaction.json',
    'fixture-10-nsaid-hf-multiple.json',
    'fixture-12-apob-ascvd-at-goal.json',  // on atorvastatin → suppressed
    'fixture-13-apob-non-qualifying-adult.json',
    'fixture-15-statin-secondary-prevention-gap.json',
    'fixture-16-statin-ldl-190-gap.json',
    'fixture-18-statin-already-on-therapy.json',
    'fixture-19-afib-anticoagulation-gap-male.json',  // 72yo M T2DM but no statin → CO-TRIGGER
    'fixture-20-afib-anticoagulation-gap-female.json',
    'fixture-21-afib-on-apixaban.json',
    'fixture-22-afib-aspirin-only-still-fires.json',  // 70yo F T2DM no statin → CO-TRIGGER
    'fixture-23-afib-low-risk-no-gap.json',
    'fixture-24-hfpef-sglt2i-gap.json',  // 70yo F T2DM → CO-TRIGGER
    'fixture-25-hfpef-on-empagliflozin.json',
    'fixture-26-hfpef-egfr-contraindicated.json',
    'fixture-27-hfpef-t1dm.json',
    'fixture-28-post-mi-bb-gap.json',
    'fixture-29-post-mi-tartrate-trap.json',
    'fixture-30-post-mi-on-carvedilol.json',
    'fixture-31-old-mi-13-months.json',
    'fixture-32-post-mi-acei-gap-low-ef.json',
    'fixture-33-post-mi-on-lisinopril.json',
    'fixture-34-post-mi-preserved-ef-no-gap.json',
    'fixture-35-post-mi-lvef-unknown.json',
    'fixture-39-t2dm-egfr-contraindicated.json',  // T2DM age 70 no statin → CO-TRIGGER expected
  ]) {
    // Skip the documented co-triggers in this loop and assert them
    // separately below.
    if ([
      'fixture-19-afib-anticoagulation-gap-male.json',
      'fixture-22-afib-aspirin-only-still-fires.json',
      'fixture-24-hfpef-sglt2i-gap.json',
      'fixture-39-t2dm-egfr-contraindicated.json',
    ].includes(fx)) continue;

    test(`${fx} → zero t2dm-statin findings`, () => {
      expect(t2dmStatinRule(loadFixture(fx))).toHaveLength(0);
    });
  }

  // Intentional co-triggers — T2DM patients age 40-75 not on a statin.
  test('fixture-19 (72yo M T2DM, no statin) → CO-TRIGGER fires t2dm-statin', () => {
    expect(t2dmStatinRule(loadFixture('fixture-19-afib-anticoagulation-gap-male.json'))).toHaveLength(1);
  });

  test('fixture-22 (70yo F T2DM, no statin) → CO-TRIGGER fires t2dm-statin', () => {
    expect(t2dmStatinRule(loadFixture('fixture-22-afib-aspirin-only-still-fires.json'))).toHaveLength(1);
  });

  test('fixture-24 (70yo F T2DM, no statin) → CO-TRIGGER fires t2dm-statin', () => {
    expect(t2dmStatinRule(loadFixture('fixture-24-hfpef-sglt2i-gap.json'))).toHaveLength(1);
  });

  test('fixture-39 (70yo M T2DM, no statin) → CO-TRIGGER fires t2dm-statin', () => {
    expect(t2dmStatinRule(loadFixture('fixture-39-t2dm-egfr-contraindicated.json'))).toHaveLength(1);
  });

  test('fixture-38 (55yo M T2DM, no statin) → CO-TRIGGER fires t2dm-statin', () => {
    expect(t2dmStatinRule(loadFixture('fixture-38-t2dm-no-ckd-no-gap.json'))).toHaveLength(1);
  });

  // fixture-11, 14, 36, 37, 40 contain T2DM patients age 40-75 without
  // statin. Verify dual-rule firing or appropriate suppression.
  test('fixture-11 (T2DM in band, no statin) → fires t2dm-statin', () => {
    expect(t2dmStatinRule(loadFixture('fixture-11-apob-diabetes-qualifier.json'))).toHaveLength(1);
  });

  test('fixture-14 (T2DM in band, no statin) → fires t2dm-statin', () => {
    expect(t2dmStatinRule(loadFixture('fixture-14-apob-measured-suppression.json'))).toHaveLength(1);
  });

  test('fixture-17 (T2DM in band, no statin) → fires t2dm-statin', () => {
    expect(t2dmStatinRule(loadFixture('fixture-17-statin-diabetes-gap.json'))).toHaveLength(1);
  });

  test('fixture-36 (T2DM in band, no statin) → fires t2dm-statin', () => {
    expect(t2dmStatinRule(loadFixture('fixture-36-t2dm-ckd-sglt2i-gap.json'))).toHaveLength(1);
  });

  test('fixture-37 (T2DM in band, no statin) → fires t2dm-statin', () => {
    expect(t2dmStatinRule(loadFixture('fixture-37-t2dm-ckd-on-canagliflozin.json'))).toHaveLength(1);
  });
});

describe('age boundaries', () => {
  test(`age ${T2DM_STATIN_AGE_MIN} fires`, () => {
    const b = bundle({ patient: { id: 'a', name: 'a', dob: dobForAge(T2DM_STATIN_AGE_MIN), sex: 'male' } });
    expect(t2dmStatinRule(b)).toHaveLength(1);
  });

  test(`age ${T2DM_STATIN_AGE_MIN - 1} does NOT fire`, () => {
    const b = bundle({ patient: { id: 'a', name: 'a', dob: dobForAge(T2DM_STATIN_AGE_MIN - 1), sex: 'male' } });
    expect(t2dmStatinRule(b)).toHaveLength(0);
  });

  test(`age ${T2DM_STATIN_AGE_MAX} fires`, () => {
    const b = bundle({ patient: { id: 'a', name: 'a', dob: dobForAge(T2DM_STATIN_AGE_MAX), sex: 'male' } });
    expect(t2dmStatinRule(b)).toHaveLength(1);
  });

  test(`age ${T2DM_STATIN_AGE_MAX + 1} does NOT fire`, () => {
    const b = bundle({ patient: { id: 'a', name: 'a', dob: dobForAge(T2DM_STATIN_AGE_MAX + 1), sex: 'male' } });
    expect(t2dmStatinRule(b)).toHaveLength(0);
  });
});

describe('T1DM exclusion', () => {
  test('T1DM age 50 → zero findings (v1 T2DM-only scope)', () => {
    const b = bundle({
      conditions: [{ code: 'E10.9', codeSystem: 'icd10', status: 'active', display: 'T1DM' }],
    });
    expect(t2dmStatinRule(b)).toHaveLength(0);
  });
});

describe('empty bundle', () => {
  test('does not throw, zero findings', () => {
    const b: PatientBundle = {
      patient: { id: 'x', name: 'x' },
      conditions: [],
      medications: [],
      observations: [],
      allergies: [],
    };
    expect(() => t2dmStatinRule(b)).not.toThrow();
    expect(t2dmStatinRule(b)).toHaveLength(0);
  });
});
