import * as fs from 'fs';
import * as path from 'path';
import {
  postMiBetaBlockerRule,
  POST_MI_BB_TIMEFRAME_MONTHS,
  getMostRecentMi,
} from '../rules/post-mi-beta-blocker';
import { GDMT_BB_RXCUIS, GDMT_BB_GENERIC_NAMES } from '../rules/gdmt-hfref';
import type { PatientBundle, PatientCondition, PatientMedication } from '../types';

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

function buildMi(onsetDate: string, code = 'I21.09'): PatientCondition {
  return {
    code,
    codeSystem: 'http://hl7.org/fhir/sid/icd-10-cm',
    display: 'Acute MI',
    status: 'active',
    onsetDate,
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

describe('fixture-28 — STEMI 3 months ago, no BB → fires gap', () => {
  const findings = postMiBetaBlockerRule(loadFixture('fixture-28-post-mi-bb-gap.json'));

  test('one gap finding', () => {
    expect(findings).toHaveLength(1);
    expect(findings[0].ruleId).toBe('post-mi-beta-blocker');
    expect(findings[0].severity).toBe('gap');
    expect(findings[0].status).toBe('missing');
  });

  test('summary cites 2025 ACC/AHA ACS Class 1', () => {
    expect(findings[0].summary).toMatch(/Class 1/);
    expect(findings[0].summary).toMatch(/2025 ACC\/AHA/);
  });
});

describe('fixture-29 — NSTEMI 6 months ago, on metoprolol tartrate → non-evidence-based finding', () => {
  const findings = postMiBetaBlockerRule(loadFixture('fixture-29-post-mi-tartrate-trap.json'));

  test('one finding with status non-evidence-based', () => {
    expect(findings).toHaveLength(1);
    expect(findings[0].status).toBe('non-evidence-based');
    expect(findings[0].severity).toBe('warning');
  });

  test('summary names tartrate and the evidence-based alternatives', () => {
    expect(findings[0].summary).toMatch(/metoprolol tartrate/);
    expect(findings[0].recommendation).toMatch(/metoprolol succinate|carvedilol|bisoprolol/);
  });
});

describe('fixture-30 — STEMI 4 months ago on carvedilol → suppression', () => {
  test('zero findings (active evidence-based BB)', () => {
    expect(postMiBetaBlockerRule(loadFixture('fixture-30-post-mi-on-carvedilol.json'))).toHaveLength(0);
  });
});

describe('fixture-31 — MI 13 months ago → zero (outside 12-month window)', () => {
  test('zero findings (outside time window)', () => {
    expect(postMiBetaBlockerRule(loadFixture('fixture-31-old-mi-13-months.json'))).toHaveLength(0);
  });
});

describe('cross-rule isolation — fixtures 01-27 emit zero post-MI BB findings', () => {
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
  ]) {
    test(`${fx} → zero post-MI BB findings`, () => {
      expect(postMiBetaBlockerRule(loadFixture(fx))).toHaveLength(0);
    });
  }
});

describe('time-boundary — dynamic-date inline cases', () => {
  test('MI 11 months 29 days ago → fires (inside window)', () => {
    const b = bundle({
      conditions: [buildMi(isoDateMonthsAgo(POST_MI_BB_TIMEFRAME_MONTHS - 1, -29))],
    });
    expect(postMiBetaBlockerRule(b)).toHaveLength(1);
  });

  test(`MI ${POST_MI_BB_TIMEFRAME_MONTHS} months 1 day ago → zero (outside window)`, () => {
    const b = bundle({
      conditions: [buildMi(isoDateMonthsAgo(POST_MI_BB_TIMEFRAME_MONTHS, -1))],
    });
    expect(postMiBetaBlockerRule(b)).toHaveLength(0);
  });
});

describe('each evidence-based BB suppresses individually', () => {
  for (let i = 0; i < GDMT_BB_GENERIC_NAMES.length; i++) {
    const name = GDMT_BB_GENERIC_NAMES[i];
    const rxcui = GDMT_BB_RXCUIS[i];
    test(`active ${name} (RxCUI ${rxcui}) suppresses`, () => {
      const meds: PatientMedication[] = [
        { rxnormCode: rxcui, name: `${name} test product`, genericName: name, status: 'active', route: 'oral' },
      ];
      const b = bundle({
        conditions: [buildMi(isoDateMonthsAgo(3))],
        medications: meds,
      });
      expect(postMiBetaBlockerRule(b)).toHaveLength(0);
    });
  }
});

describe('multiple MIs in history — uses most recent', () => {
  test('most recent MI within window → fires (even if older MI outside)', () => {
    const b = bundle({
      conditions: [
        buildMi(isoDateMonthsAgo(36), 'I21.4'),
        buildMi(isoDateMonthsAgo(2), 'I21.09'),
      ],
    });
    const mi = getMostRecentMi(b);
    expect(mi?.code).toBe('I21.09');
    expect(postMiBetaBlockerRule(b)).toHaveLength(1);
  });
});

describe('I25.2 (old MI history) alone does NOT fire', () => {
  test('I25.2 with no I21.x → zero findings', () => {
    const b = bundle({
      conditions: [
        { code: 'I25.2', codeSystem: 'icd10', status: 'active', display: 'Old myocardial infarction', onsetDate: isoDateMonthsAgo(60) },
      ],
    });
    expect(postMiBetaBlockerRule(b)).toHaveLength(0);
  });
});

describe('inactive/completed BB does NOT suppress', () => {
  test('recent MI + completed metoprolol succinate → fires', () => {
    const b = bundle({
      conditions: [buildMi(isoDateMonthsAgo(3))],
      medications: [
        { rxnormCode: '866924', name: 'metoprolol succinate 25 MG ER', genericName: 'metoprolol succinate', status: 'completed' },
      ],
    });
    expect(postMiBetaBlockerRule(b)).toHaveLength(1);
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
    expect(() => postMiBetaBlockerRule(b)).not.toThrow();
    expect(postMiBetaBlockerRule(b)).toHaveLength(0);
  });
});
