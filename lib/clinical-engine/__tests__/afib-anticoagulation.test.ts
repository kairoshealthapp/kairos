import * as fs from 'fs';
import * as path from 'path';
import {
  afibAnticoagulationRule,
  calculateChaDsVasc,
  ANTICOAGULANT_RXCUIS,
  CHADSVASC_MALE_THRESHOLD,
  CHADSVASC_FEMALE_THRESHOLD,
  AGE_BAND_LOW_MIN,
  AGE_BAND_LOW_MAX,
  AGE_HIGH_MIN,
} from '../rules/afib-anticoagulation';
import type { PatientBundle, PatientCondition, PatientMedication } from '../types';

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

function bundle(overrides: Partial<PatientBundle>): PatientBundle {
  return {
    patient: { id: 't', name: 'Test', dob: dobForAge(70), sex: 'male' },
    conditions: [],
    medications: [],
    observations: [],
    allergies: [],
    ...overrides,
  };
}

const AFIB: PatientCondition = {
  code: 'I48.0',
  codeSystem: 'http://hl7.org/fhir/sid/icd-10-cm',
  display: 'Paroxysmal atrial fibrillation',
  status: 'active',
};

describe('fixture-19 — male, AFib + HTN + T2DM (CHA₂DS₂-VASc 3, above male threshold 2)', () => {
  const findings = afibAnticoagulationRule(loadFixture('fixture-19-afib-anticoagulation-gap-male.json'));

  test('one finding with correct ruleId/severity/status', () => {
    expect(findings).toHaveLength(1);
    expect(findings[0].ruleId).toBe('afib-anticoagulation');
    expect(findings[0].severity).toBe('gap');
    expect(findings[0].status).toBe('missing');
  });

  test('summary cites CHA₂DS₂-VASc 3 and the three components', () => {
    expect(findings[0].summary).toMatch(/CHA₂DS₂-VASc 3/);
    expect(findings[0].summary).toMatch(/hypertension/);
    expect(findings[0].summary).toMatch(/diabetes/);
    expect(findings[0].summary).toMatch(/age 65.74/);
  });
});

describe('fixture-20 — female, AFib + HTN + prior TIA (CHA₂DS₂-VASc 5)', () => {
  const findings = afibAnticoagulationRule(loadFixture('fixture-20-afib-anticoagulation-gap-female.json'));

  test('one finding fires above female threshold of 3', () => {
    expect(findings).toHaveLength(1);
  });

  test('summary cites prior stroke +2 and female sex +1', () => {
    expect(findings[0].summary).toMatch(/prior stroke\/TIA/);
    expect(findings[0].summary).toMatch(/female sex/);
  });
});

describe('fixture-21 — AFib on apixaban → suppression', () => {
  test('zero findings (active OAC)', () => {
    expect(afibAnticoagulationRule(loadFixture('fixture-21-afib-on-apixaban.json'))).toHaveLength(0);
  });
});

describe('fixture-22 — AFib on aspirin 81 only → fires anyway', () => {
  test('one finding (aspirin does NOT satisfy stroke prevention)', () => {
    const findings = afibAnticoagulationRule(loadFixture('fixture-22-afib-aspirin-only-still-fires.json'));
    expect(findings).toHaveLength(1);
  });
});

describe('fixture-23 — 55yo male AFib with CHA₂DS₂-VASc 0 → no fire', () => {
  test('zero findings (below male threshold of 2)', () => {
    expect(afibAnticoagulationRule(loadFixture('fixture-23-afib-low-risk-no-gap.json'))).toHaveLength(0);
  });
});

describe('cross-rule isolation — fixtures 01-18 emit zero AFib findings', () => {
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
    'fixture-11-apob-diabetes-qualifier.json',
    'fixture-12-apob-ascvd-at-goal.json',
    'fixture-13-apob-non-qualifying-adult.json',
    'fixture-14-apob-measured-suppression.json',
    'fixture-15-statin-secondary-prevention-gap.json',
    'fixture-16-statin-ldl-190-gap.json',
    'fixture-17-statin-diabetes-gap.json',
    'fixture-18-statin-already-on-therapy.json',
  ]) {
    test(`${fx} → zero AFib findings`, () => {
      expect(afibAnticoagulationRule(loadFixture(fx))).toHaveLength(0);
    });
  }
});

describe('threshold edges — male', () => {
  test('male CHA₂DS₂-VASc = 1 (just HTN) → no fire', () => {
    const b = bundle({
      patient: { id: 'm1', name: 'm1', dob: dobForAge(50), sex: 'male' },
      conditions: [AFIB, { code: 'I10', codeSystem: 'icd10', status: 'active' }],
    });
    expect(afibAnticoagulationRule(b)).toHaveLength(0);
  });

  test('male CHA₂DS₂-VASc = 2 (HTN + DM) → fires', () => {
    const b = bundle({
      patient: { id: 'm2', name: 'm2', dob: dobForAge(50), sex: 'male' },
      conditions: [
        AFIB,
        { code: 'I10', codeSystem: 'icd10', status: 'active' },
        { code: 'E11.9', codeSystem: 'icd10', status: 'active' },
      ],
    });
    expect(afibAnticoagulationRule(b)).toHaveLength(1);
  });
});

describe('threshold edges — female', () => {
  test('female CHA₂DS₂-VASc = 2 (sex + HTN) → no fire (below female threshold 3)', () => {
    const b = bundle({
      patient: { id: 'f1', name: 'f1', dob: dobForAge(50), sex: 'female' },
      conditions: [AFIB, { code: 'I10', codeSystem: 'icd10', status: 'active' }],
    });
    expect(afibAnticoagulationRule(b)).toHaveLength(0);
  });

  test('female CHA₂DS₂-VASc = 3 (sex + HTN + DM) → fires', () => {
    const b = bundle({
      patient: { id: 'f2', name: 'f2', dob: dobForAge(50), sex: 'female' },
      conditions: [
        AFIB,
        { code: 'I10', codeSystem: 'icd10', status: 'active' },
        { code: 'E11.9', codeSystem: 'icd10', status: 'active' },
      ],
    });
    expect(afibAnticoagulationRule(b)).toHaveLength(1);
  });
});

describe('age boundaries', () => {
  test(`age ${AGE_BAND_LOW_MIN - 1} contributes 0`, () => {
    const r = calculateChaDsVasc(bundle({
      patient: { id: 'a', name: 'a', dob: dobForAge(AGE_BAND_LOW_MIN - 1), sex: 'male' },
    }));
    expect(r.score).toBe(0);
  });

  test(`age ${AGE_BAND_LOW_MIN} contributes 1 (age 65-74 band)`, () => {
    const r = calculateChaDsVasc(bundle({
      patient: { id: 'a', name: 'a', dob: dobForAge(AGE_BAND_LOW_MIN), sex: 'male' },
    }));
    expect(r.score).toBe(1);
  });

  test(`age ${AGE_BAND_LOW_MAX} contributes 1`, () => {
    const r = calculateChaDsVasc(bundle({
      patient: { id: 'a', name: 'a', dob: dobForAge(AGE_BAND_LOW_MAX), sex: 'male' },
    }));
    expect(r.score).toBe(1);
  });

  test(`age ${AGE_HIGH_MIN} contributes 2 (jumps from band)`, () => {
    const r = calculateChaDsVasc(bundle({
      patient: { id: 'a', name: 'a', dob: dobForAge(AGE_HIGH_MIN), sex: 'male' },
    }));
    expect(r.score).toBe(2);
  });
});

describe('prior stroke contributes 2 points', () => {
  test('AFib + cerebral infarction I63.50 alone hits male threshold 2', () => {
    const b = bundle({
      patient: { id: 's', name: 's', dob: dobForAge(50), sex: 'male' },
      conditions: [AFIB, { code: 'I63.50', codeSystem: 'icd10', status: 'active' }],
    });
    const r = calculateChaDsVasc(b);
    expect(r.score).toBe(2);
    expect(afibAnticoagulationRule(b)).toHaveLength(1);
  });
});

describe('atrial flutter is treated as AFib for this rule', () => {
  for (const code of ['I48.3', 'I48.4', 'I48.92']) {
    test(`${code} (atrial flutter) + threshold-qualifying score fires`, () => {
      const b = bundle({
        patient: { id: 'fl', name: 'fl', dob: dobForAge(50), sex: 'male' },
        conditions: [
          { code, codeSystem: 'icd10', status: 'active' },
          { code: 'I10', codeSystem: 'icd10', status: 'active' },
          { code: 'E11.9', codeSystem: 'icd10', status: 'active' },
        ],
      });
      expect(afibAnticoagulationRule(b)).toHaveLength(1);
    });
  }
});

describe('each anticoagulant suppresses individually', () => {
  for (const [name, rxcui] of Object.entries(ANTICOAGULANT_RXCUIS)) {
    test(`active ${name} (RxCUI ${rxcui}) suppresses`, () => {
      const meds: PatientMedication[] = [
        {
          rxnormCode: rxcui,
          name: `${name} test product`,
          genericName: name,
          status: 'active',
          route: 'oral',
        },
      ];
      const b = bundle({
        patient: { id: 'a', name: 'a', dob: dobForAge(70), sex: 'male' },
        conditions: [AFIB, { code: 'I10', codeSystem: 'icd10', status: 'active' }],
        medications: meds,
      });
      expect(afibAnticoagulationRule(b)).toHaveLength(0);
    });
  }
});

describe('inactive anticoagulant prescription does not suppress', () => {
  test('AFib + completed warfarin → still fires', () => {
    const b = bundle({
      patient: { id: 'a', name: 'a', dob: dobForAge(70), sex: 'male' },
      conditions: [AFIB, { code: 'I10', codeSystem: 'icd10', status: 'active' }],
      medications: [
        { rxnormCode: ANTICOAGULANT_RXCUIS.warfarin, name: 'warfarin 5 MG Oral Tablet', genericName: 'warfarin', status: 'completed' },
      ],
    });
    expect(afibAnticoagulationRule(b)).toHaveLength(1);
  });
});

describe('unknown sex safer default', () => {
  test('AFib + qualifying components but no sex → zero (defer rather than guess)', () => {
    const b: PatientBundle = {
      patient: { id: 'nosex', name: 'no sex', dob: dobForAge(70) },
      conditions: [AFIB, { code: 'I10', codeSystem: 'icd10', status: 'active' }, { code: 'E11.9', codeSystem: 'icd10', status: 'active' }],
      medications: [],
      observations: [],
      allergies: [],
    };
    expect(afibAnticoagulationRule(b)).toHaveLength(0);
  });
});

describe('empty bundle', () => {
  test('does not throw; zero findings', () => {
    const b: PatientBundle = {
      patient: { id: 'x', name: 'x' },
      conditions: [],
      medications: [],
      observations: [],
      allergies: [],
    };
    expect(() => afibAnticoagulationRule(b)).not.toThrow();
    expect(afibAnticoagulationRule(b)).toHaveLength(0);
  });
});

describe('threshold export checks', () => {
  test('exports match guideline thresholds', () => {
    expect(CHADSVASC_MALE_THRESHOLD).toBe(2);
    expect(CHADSVASC_FEMALE_THRESHOLD).toBe(3);
  });
});
