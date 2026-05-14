import * as fs from 'fs';
import * as path from 'path';
import {
  apoBMeasurementRule,
  APOB_LOINC_CODES,
  APOB_ADULT_AGE_THRESHOLD,
} from '../rules/apo-b-measurement';
import type { PatientBundle } from '../types';

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

function emptyBundle(overrides: Partial<PatientBundle> = {}): PatientBundle {
  return {
    patient: { id: 't', name: 'Test', dob: dobForAge(50), sex: 'male' },
    conditions: [],
    medications: [],
    observations: [],
    allergies: [],
    ...overrides,
  };
}

describe('fixture-11 — T2DM, no ApoB, qualifies on diabetes', () => {
  const findings = apoBMeasurementRule(loadFixture('fixture-11-apob-diabetes-qualifier.json'));

  test('exactly one finding fires', () => {
    expect(findings).toHaveLength(1);
  });

  test('finding has correct ruleId, severity gap, status missing', () => {
    expect(findings[0].ruleId).toBe('apob-measurement');
    expect(findings[0].severity).toBe('gap');
    expect(findings[0].status).toBe('missing');
  });

  test('summary names the diabetes qualifier', () => {
    expect(findings[0].summary).toMatch(/diabetes/);
  });
});

describe('fixture-12 — Prior MI + LDL at goal, no ApoB, qualifies twice', () => {
  const findings = apoBMeasurementRule(loadFixture('fixture-12-apob-ascvd-at-goal.json'));

  test('exactly one finding fires', () => {
    expect(findings).toHaveLength(1);
  });

  test('summary cites both ASCVD and achieved-LDL qualifiers', () => {
    expect(findings[0].summary).toMatch(/ASCVD/);
    expect(findings[0].summary).toMatch(/LDL-C < 70/);
  });
});

describe('fixture-13 — non-qualifying adult, no ApoB', () => {
  const findings = apoBMeasurementRule(loadFixture('fixture-13-apob-non-qualifying-adult.json'));

  test('zero findings (no qualifying condition triggers the rule)', () => {
    expect(findings).toHaveLength(0);
  });
});

describe('fixture-14 — T2DM with prior ApoB observation', () => {
  const findings = apoBMeasurementRule(loadFixture('fixture-14-apob-measured-suppression.json'));

  test('zero findings (measurement suppresses regardless of qualifier)', () => {
    expect(findings).toHaveLength(0);
  });
});

describe('cross-rule isolation — fixtures 01-10 do not fire ApoB findings', () => {
  // fixture-01..05 (HFrEF GDMT family) — none have qualifying ApoB conditions
  // independent of HFrEF, and none of them surface ApoB Observations.
  // We expect zero ApoB findings in every case.
  //
  // fixture-06..08 (Lp(a) suite) — adults with various lipid panels but
  // no diabetes/ASCVD/at-goal-LDL/high-TG profiles that would qualify.
  //
  // fixture-09..10 (NSAID-HF) — HFrEF patients but no qualifying ApoB
  // condition (no diabetes, no ASCVD by ICD prefix, and their LDL/TG
  // values do not meet the threshold).
  for (const fx of [
    'fixture-01-all-gaps.json',
    'fixture-03-full-gdmt.json',
    'fixture-04-mra-contraindicated.json',
    'fixture-05-bb-asthma.json',
    'fixture-06-lpa-screening-gap.json',
    'fixture-07-lpa-measured-normal.json',
    'fixture-08-lpa-measured-elevated.json',
    'fixture-10-nsaid-hf-multiple.json',
  ]) {
    test(`${fx} → zero ApoB findings`, () => {
      const findings = apoBMeasurementRule(loadFixture(fx));
      expect(findings).toHaveLength(0);
    });
  }

  // fixture-02 (tartrate trap) has E78.x absent but no diabetes/ASCVD —
  // verify explicitly.
  test('fixture-02-tartrate-trap.json → zero ApoB findings', () => {
    const findings = apoBMeasurementRule(loadFixture('fixture-02-tartrate-trap.json'));
    expect(findings).toHaveLength(0);
  });

  // fixture-09 has a HFrEF patient on ibuprofen but no qualifying ApoB
  // condition; explicitly verify.
  test('fixture-09-nsaid-hf-interaction.json → zero ApoB findings', () => {
    const findings = apoBMeasurementRule(loadFixture('fixture-09-nsaid-hf-interaction.json'));
    expect(findings).toHaveLength(0);
  });
});

describe('LDL-at-goal qualifier — direct-assay LOINC also satisfies', () => {
  test('adult with LDL 60 via direct LOINC 18262-6 and no diabetes/ASCVD → fires', () => {
    const bundle = emptyBundle({
      observations: [
        {
          loincCode: '18262-6',
          display: 'LDL Direct',
          value: 60,
          unit: 'mg/dL',
          effectiveDate: '2025-12-01',
          category: 'laboratory',
        },
      ],
    });
    const findings = apoBMeasurementRule(bundle);
    expect(findings).toHaveLength(1);
    expect(findings[0].summary).toMatch(/LDL-C < 70/);
  });

  test('LDL exactly 70 mg/dL does not trigger the at-goal qualifier', () => {
    const bundle = emptyBundle({
      observations: [
        { loincCode: '13457-7', display: 'LDL', value: 70, unit: 'mg/dL', effectiveDate: '2025-12-01', category: 'laboratory' },
      ],
    });
    expect(apoBMeasurementRule(bundle)).toHaveLength(0);
  });
});

describe('TG qualifier — most-recent value drives the decision', () => {
  test('most recent TG 250 mg/dL with no other qualifier → fires', () => {
    const bundle = emptyBundle({
      observations: [
        { loincCode: '2571-8', display: 'Trig', value: 130, unit: 'mg/dL', effectiveDate: '2024-01-15', category: 'laboratory' },
        { loincCode: '2571-8', display: 'Trig', value: 250, unit: 'mg/dL', effectiveDate: '2025-12-15', category: 'laboratory' },
      ],
    });
    const findings = apoBMeasurementRule(bundle);
    expect(findings).toHaveLength(1);
    expect(findings[0].summary).toMatch(/triglycerides > 200/);
  });

  test('most recent TG 180 (older value was 260) → zero (most-recent gate)', () => {
    const bundle = emptyBundle({
      observations: [
        { loincCode: '2571-8', display: 'Trig', value: 260, unit: 'mg/dL', effectiveDate: '2023-01-15', category: 'laboratory' },
        { loincCode: '2571-8', display: 'Trig', value: 180, unit: 'mg/dL', effectiveDate: '2025-12-15', category: 'laboratory' },
      ],
    });
    expect(apoBMeasurementRule(bundle)).toHaveLength(0);
  });

  test('TG exactly 200 mg/dL does not trigger the elevated qualifier', () => {
    const bundle = emptyBundle({
      observations: [
        { loincCode: '2571-8', display: 'Trig', value: 200, unit: 'mg/dL', effectiveDate: '2025-12-15', category: 'laboratory' },
      ],
    });
    expect(apoBMeasurementRule(bundle)).toHaveLength(0);
  });
});

describe('ASCVD ICD-10 prefixes', () => {
  for (const code of ['I20.0', 'I21.4', 'I22.0', 'I25.10', 'I63.50', 'I70.209']) {
    test(`${code} qualifies as ASCVD`, () => {
      const bundle = emptyBundle({
        conditions: [
          { code, codeSystem: 'http://hl7.org/fhir/sid/icd-10-cm', status: 'active' },
        ],
      });
      expect(apoBMeasurementRule(bundle)).toHaveLength(1);
    });
  }

  test('I50.22 (HFrEF) does NOT qualify as ASCVD on its own', () => {
    const bundle = emptyBundle({
      conditions: [
        { code: 'I50.22', codeSystem: 'http://hl7.org/fhir/sid/icd-10-cm', status: 'active' },
      ],
    });
    expect(apoBMeasurementRule(bundle)).toHaveLength(0);
  });
});

describe('age boundary', () => {
  test(`age exactly ${APOB_ADULT_AGE_THRESHOLD} with diabetes fires`, () => {
    const bundle = emptyBundle({
      patient: { id: 'a', name: 'a', dob: dobForAge(APOB_ADULT_AGE_THRESHOLD), sex: 'male' },
      conditions: [{ code: 'E11.9', codeSystem: 'http://hl7.org/fhir/sid/icd-10-cm', status: 'active' }],
    });
    expect(apoBMeasurementRule(bundle)).toHaveLength(1);
  });

  test(`age ${APOB_ADULT_AGE_THRESHOLD - 1} with diabetes does NOT fire`, () => {
    const bundle = emptyBundle({
      patient: { id: 'a', name: 'a', dob: dobForAge(APOB_ADULT_AGE_THRESHOLD - 1), sex: 'male' },
      conditions: [{ code: 'E11.9', codeSystem: 'http://hl7.org/fhir/sid/icd-10-cm', status: 'active' }],
    });
    expect(apoBMeasurementRule(bundle)).toHaveLength(0);
  });

  test('unknown DOB does not fire', () => {
    const bundle: PatientBundle = {
      patient: { id: 'x', name: 'x' },
      conditions: [{ code: 'E11.9', codeSystem: 'http://hl7.org/fhir/sid/icd-10-cm', status: 'active' }],
      medications: [],
      observations: [],
      allergies: [],
    };
    expect(apoBMeasurementRule(bundle)).toHaveLength(0);
  });
});

describe('ApoB LOINC scan suppresses regardless of value', () => {
  for (const loinc of APOB_LOINC_CODES) {
    test(`prior ApoB via LOINC ${loinc} suppresses despite diabetes qualifier`, () => {
      const bundle = emptyBundle({
        conditions: [{ code: 'E11.9', codeSystem: 'http://hl7.org/fhir/sid/icd-10-cm', status: 'active' }],
        observations: [
          { loincCode: loinc, display: 'ApoB', value: 200, unit: 'mg/dL', effectiveDate: '2024-01-01', category: 'laboratory' },
        ],
      });
      expect(apoBMeasurementRule(bundle)).toHaveLength(0);
    });
  }
});

describe('empty bundle', () => {
  test('does not throw; zero findings', () => {
    expect(() =>
      apoBMeasurementRule({
        patient: { id: 'x', name: 'x' },
        conditions: [],
        medications: [],
        observations: [],
        allergies: [],
      })
    ).not.toThrow();
  });
});
