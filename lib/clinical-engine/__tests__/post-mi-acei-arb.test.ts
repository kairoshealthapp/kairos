import * as fs from 'fs';
import * as path from 'path';
import {
  postMiAceiArbRule,
  POST_MI_ACEI_TIMEFRAME_MONTHS,
  POST_MI_ACEI_LVEF_HIGH_RISK_THRESHOLD,
} from '../rules/post-mi-acei-arb';
import type { PatientBundle, PatientCondition, PatientObservation } from '../types';

const FIXTURES_DIR = path.join(__dirname, '..', 'fixtures');

function loadFixture(filename: string): PatientBundle {
  const raw = fs.readFileSync(path.join(FIXTURES_DIR, filename), 'utf8');
  return JSON.parse(raw) as PatientBundle;
}

function isoDateMonthsAgo(months: number, dayOffset = 0): string {
  const d = new Date();
  d.setUTCMonth(d.getUTCMonth() - months);
  d.setUTCDate(d.getUTCDate() + dayOffset);
  return d.toISOString().slice(0, 10);
}

function recentMi(months: number, code = 'I21.3'): PatientCondition {
  return {
    code,
    codeSystem: 'http://hl7.org/fhir/sid/icd-10-cm',
    display: 'Acute MI',
    status: 'active',
    onsetDate: isoDateMonthsAgo(months),
  };
}

function lvefObs(value: number): PatientObservation {
  return {
    loincCode: '10230-1',
    display: 'LVEF',
    value,
    unit: '%',
    effectiveDate: isoDateMonthsAgo(2),
    category: 'imaging',
  };
}

function bundle(overrides: Partial<PatientBundle>): PatientBundle {
  return {
    patient: { id: 't', name: 'Test', dob: '1955-01-01', sex: 'male' },
    conditions: [],
    medications: [],
    observations: [],
    allergies: [],
    ...overrides,
  };
}

describe('fixture-32 — STEMI 2 months ago, LVEF 30%, no ACEi → fires', () => {
  const findings = postMiAceiArbRule(loadFixture('fixture-32-post-mi-acei-gap-low-ef.json'));

  test('one gap finding', () => {
    expect(findings).toHaveLength(1);
    expect(findings[0].ruleId).toBe('post-mi-acei-arb');
    expect(findings[0].severity).toBe('gap');
    expect(findings[0].status).toBe('missing');
  });

  test('summary cites LVEF and 2025 ACS Class 1', () => {
    expect(findings[0].summary).toMatch(/LVEF 30/);
    expect(findings[0].summary).toMatch(/Class 1/);
  });
});

describe('fixture-33 — NSTEMI 5 months ago, on lisinopril → suppression', () => {
  test('zero findings (active ACEi)', () => {
    expect(postMiAceiArbRule(loadFixture('fixture-33-post-mi-on-lisinopril.json'))).toHaveLength(0);
  });
});

describe('fixture-34 — NSTEMI 3 months ago, LVEF 55%, no high-risk → zero', () => {
  test('zero findings (preserved EF, no other high-risk criteria)', () => {
    expect(postMiAceiArbRule(loadFixture('fixture-34-post-mi-preserved-ef-no-gap.json'))).toHaveLength(0);
  });
});

describe('fixture-35 — STEMI 4 months ago, LVEF unknown → fires (safer default)', () => {
  const findings = postMiAceiArbRule(loadFixture('fixture-35-post-mi-lvef-unknown.json'));

  test('one finding', () => {
    expect(findings).toHaveLength(1);
  });

  test('summary cites LVEF not documented as safer default', () => {
    expect(findings[0].summary).toMatch(/LVEF not documented/);
  });
});

describe('cross-rule isolation — fixtures 01-31 emit zero post-MI ACEi findings', () => {
  // fixture-28 has STEMI with LVEF 38 + on lisinopril → suppression by ACEi ⇒ 0 findings.
  // fixture-29 has NSTEMI with HTN absent / DM absent / LVEF absent → safer default fires!
  //   But fixture-29 has no ACEi/ARB. Actually fixture-29 has only metoprolol tartrate.
  //   LVEF unknown, no high-risk criteria? HTN absent, DM absent, anterior STEMI? code is I21.4 NSTEMI (not anterior STEMI).
  //   So fixture-29 has LVEF unknown → safer-default high-risk fires.
  //   This is an intentional co-trigger: a tartrate-trap patient post-MI is ALSO a candidate
  //   for ACEi (which they're not on). Document the dual finding.
  // fixture-30 has STEMI I21.3 + carvedilol (BB, not ACEi). LVEF unknown → safer default fires.
  //   Also an intentional co-trigger.
  // fixture-31 has MI 13 months ago → outside window → 0 findings.
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
    'fixture-19-afib-anticoagulation-gap-male.json',
    'fixture-20-afib-anticoagulation-gap-female.json',
    'fixture-21-afib-on-apixaban.json',
    'fixture-22-afib-aspirin-only-still-fires.json',
    'fixture-23-afib-low-risk-no-gap.json',
    'fixture-24-hfpef-sglt2i-gap.json',
    'fixture-25-hfpef-on-empagliflozin.json',
    'fixture-26-hfpef-egfr-contraindicated.json',
    'fixture-27-hfpef-t1dm.json',
    'fixture-28-post-mi-bb-gap.json',
    'fixture-31-old-mi-13-months.json',
  ]) {
    test(`${fx} → zero post-MI ACEi findings`, () => {
      expect(postMiAceiArbRule(loadFixture(fx))).toHaveLength(0);
    });
  }

  // Intentional co-trigger: fixture-29 NSTEMI + tartrate, LVEF unknown → safer-default fires.
  test('fixture-29 (tartrate-trap, LVEF unknown) → intentionally fires ACEi gap (safer default)', () => {
    expect(postMiAceiArbRule(loadFixture('fixture-29-post-mi-tartrate-trap.json'))).toHaveLength(1);
  });

  // Intentional co-trigger: fixture-30 STEMI on carvedilol but no ACEi, LVEF unknown → fires.
  test('fixture-30 (STEMI on carvedilol, no ACEi, LVEF unknown) → intentionally fires ACEi gap', () => {
    expect(postMiAceiArbRule(loadFixture('fixture-30-post-mi-on-carvedilol.json'))).toHaveLength(1);
  });
});

describe('LVEF boundary', () => {
  test(`LVEF ${POST_MI_ACEI_LVEF_HIGH_RISK_THRESHOLD - 1}% fires (high-risk)`, () => {
    const b = bundle({
      conditions: [recentMi(3)],
      observations: [lvefObs(POST_MI_ACEI_LVEF_HIGH_RISK_THRESHOLD - 1)],
    });
    expect(postMiAceiArbRule(b)).toHaveLength(1);
  });

  test(`LVEF ${POST_MI_ACEI_LVEF_HIGH_RISK_THRESHOLD}% fires (≤40 qualifies)`, () => {
    const b = bundle({
      conditions: [recentMi(3)],
      observations: [lvefObs(POST_MI_ACEI_LVEF_HIGH_RISK_THRESHOLD)],
    });
    expect(postMiAceiArbRule(b)).toHaveLength(1);
  });

  test(`LVEF ${POST_MI_ACEI_LVEF_HIGH_RISK_THRESHOLD + 1}% with no other high-risk → zero`, () => {
    const b = bundle({
      conditions: [recentMi(3)],
      observations: [lvefObs(POST_MI_ACEI_LVEF_HIGH_RISK_THRESHOLD + 1)],
    });
    expect(postMiAceiArbRule(b)).toHaveLength(0);
  });
});

describe('high-risk criteria — each independently fires', () => {
  test('preserved LVEF + HTN → fires', () => {
    const b = bundle({
      conditions: [
        recentMi(3),
        { code: 'I10', codeSystem: 'icd10', status: 'active' },
      ],
      observations: [lvefObs(55)],
    });
    expect(postMiAceiArbRule(b)).toHaveLength(1);
  });

  test('preserved LVEF + DM → fires', () => {
    const b = bundle({
      conditions: [
        recentMi(3),
        { code: 'E11.9', codeSystem: 'icd10', status: 'active' },
      ],
      observations: [lvefObs(55)],
    });
    expect(postMiAceiArbRule(b)).toHaveLength(1);
  });

  test('anterior STEMI (I21.0) + preserved LVEF + no other criteria → fires', () => {
    const b = bundle({
      conditions: [recentMi(3, 'I21.09')],
      observations: [lvefObs(55)],
    });
    expect(postMiAceiArbRule(b)).toHaveLength(1);
  });
});

describe('ARNi suppresses (sacubitril/valsartan)', () => {
  test('recent MI + low LVEF + sacubitril/valsartan → zero', () => {
    const b = bundle({
      conditions: [recentMi(3)],
      observations: [lvefObs(30)],
      medications: [
        { rxnormCode: '1656328', name: 'sacubitril/valsartan 49-51 MG', genericName: 'sacubitril/valsartan', status: 'active' },
      ],
    });
    expect(postMiAceiArbRule(b)).toHaveLength(0);
  });
});

describe('ARB suppresses (losartan)', () => {
  test('recent MI + low LVEF + losartan → zero', () => {
    const b = bundle({
      conditions: [recentMi(3)],
      observations: [lvefObs(30)],
      medications: [
        { rxnormCode: '52175', name: 'losartan 50 MG', genericName: 'losartan', status: 'active' },
      ],
    });
    expect(postMiAceiArbRule(b)).toHaveLength(0);
  });
});

describe('time-boundary mirrors BB rule', () => {
  test(`MI ${POST_MI_ACEI_TIMEFRAME_MONTHS} months 1 day ago → zero`, () => {
    const b = bundle({
      conditions: [{ code: 'I21.3', codeSystem: 'icd10', status: 'active', onsetDate: isoDateMonthsAgo(POST_MI_ACEI_TIMEFRAME_MONTHS, -1) }],
      observations: [lvefObs(30)],
    });
    expect(postMiAceiArbRule(b)).toHaveLength(0);
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
    expect(() => postMiAceiArbRule(b)).not.toThrow();
    expect(postMiAceiArbRule(b)).toHaveLength(0);
  });
});
