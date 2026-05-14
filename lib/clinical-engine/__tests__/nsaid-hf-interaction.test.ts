import * as fs from 'fs';
import * as path from 'path';
import {
  nsaidHfInteractionRule,
  NSAID_RXCUIS,
} from '../rules/nsaid-hf-interaction';
import type { Finding, PatientBundle, PatientMedication } from '../types';

const FIXTURES_DIR = path.join(__dirname, '..', 'fixtures');

function loadFixture(filename: string): PatientBundle {
  const raw = fs.readFileSync(path.join(FIXTURES_DIR, filename), 'utf8');
  return JSON.parse(raw) as PatientBundle;
}

function hfrefBundle(meds: PatientMedication[]): PatientBundle {
  return {
    patient: { id: 'inline', name: 'inline', dob: '1955-01-01', sex: 'male' },
    conditions: [
      {
        code: 'I50.22',
        codeSystem: 'http://hl7.org/fhir/sid/icd-10-cm',
        display: 'Chronic systolic (congestive) heart failure',
        status: 'active',
        onsetDate: '2020-01-01',
      },
    ],
    medications: meds,
    observations: [],
    allergies: [],
  };
}

describe('fixture-09-nsaid-hf-interaction.json — HFrEF + active ibuprofen', () => {
  const findings = nsaidHfInteractionRule(loadFixture('fixture-09-nsaid-hf-interaction.json'));

  test('exactly one finding emitted', () => {
    expect(findings).toHaveLength(1);
  });

  test('finding has correct ruleId, severity critical, status interaction', () => {
    expect(findings[0].ruleId).toBe('nsaid-hf-interaction');
    expect(findings[0].severity).toBe('critical');
    expect(findings[0].status).toBe('interaction');
  });

  test('subcategory identifies the offending NSAID ingredient', () => {
    expect(findings[0].subcategory).toBe('ibuprofen');
  });

  test('summary cites the 2022 AHA/ACC/HFSA guideline and Class 3', () => {
    expect(findings[0].summary).toMatch(/2022 AHA\/ACC\/HFSA/);
    expect(findings[0].summary).toMatch(/Class 3/);
  });
});

describe('fixture-10-nsaid-hf-multiple.json — HFrEF + active naproxen AND diclofenac', () => {
  const findings = nsaidHfInteractionRule(loadFixture('fixture-10-nsaid-hf-multiple.json'));

  test('exactly two findings emitted (one per drug)', () => {
    expect(findings).toHaveLength(2);
  });

  test('one finding per offending NSAID', () => {
    const subs = findings.map((f) => f.subcategory).sort();
    expect(subs).toEqual(['diclofenac', 'naproxen']);
  });

  test('all findings carry severity critical and status interaction', () => {
    for (const f of findings) {
      expect(f.severity).toBe('critical');
      expect(f.status).toBe('interaction');
    }
  });
});

describe('cross-rule isolation — fixtures 01-05 emit zero NSAID findings', () => {
  for (const fx of [
    'fixture-01-all-gaps.json',
    'fixture-02-tartrate-trap.json',
    'fixture-03-full-gdmt.json',
    'fixture-04-mra-contraindicated.json',
    'fixture-05-bb-asthma.json',
  ]) {
    test(`${fx} → zero NSAID findings`, () => {
      const findings = nsaidHfInteractionRule(loadFixture(fx));
      expect(findings).toHaveLength(0);
    });
  }
});

describe('cross-rule isolation — Lp(a) fixtures 06-08 emit zero NSAID findings', () => {
  for (const fx of [
    'fixture-06-lpa-screening-gap.json',
    'fixture-07-lpa-measured-normal.json',
    'fixture-08-lpa-measured-elevated.json',
  ]) {
    test(`${fx} → zero NSAID findings (no HFrEF condition)`, () => {
      const findings = nsaidHfInteractionRule(loadFixture(fx));
      expect(findings).toHaveLength(0);
    });
  }
});

describe('inactive NSAID prescription does not fire', () => {
  test('HFrEF + completed ibuprofen → zero findings', () => {
    const bundle = hfrefBundle([
      {
        rxnormCode: NSAID_RXCUIS.ibuprofen,
        name: 'ibuprofen 600 MG Oral Tablet',
        genericName: 'ibuprofen',
        dose: '600 mg TID PRN',
        route: 'oral',
        status: 'completed',
      },
    ]);
    expect(nsaidHfInteractionRule(bundle)).toHaveLength(0);
  });

  test('HFrEF + stopped naproxen → zero findings', () => {
    const bundle = hfrefBundle([
      {
        rxnormCode: NSAID_RXCUIS.naproxen,
        name: 'naproxen 500 MG Oral Tablet',
        genericName: 'naproxen',
        route: 'oral',
        status: 'stopped',
      },
    ]);
    expect(nsaidHfInteractionRule(bundle)).toHaveLength(0);
  });
});

describe('aspirin exclusion — low-dose aspirin does not fire', () => {
  test('HFrEF + active aspirin 81 mg → zero findings', () => {
    const bundle = hfrefBundle([
      {
        rxnormCode: '1191',
        name: 'aspirin 81 MG Oral Tablet',
        genericName: 'aspirin',
        dose: '81 mg daily',
        route: 'oral',
        status: 'active',
      },
    ]);
    expect(nsaidHfInteractionRule(bundle)).toHaveLength(0);
  });
});

describe('non-HFrEF patient does not fire', () => {
  test('no HF condition + active ibuprofen → zero findings', () => {
    const bundle: PatientBundle = {
      patient: { id: 'nonhf', name: 'no HF', dob: '1970-01-01', sex: 'male' },
      conditions: [],
      medications: [
        {
          rxnormCode: NSAID_RXCUIS.ibuprofen,
          name: 'ibuprofen 600 MG Oral Tablet',
          genericName: 'ibuprofen',
          route: 'oral',
          status: 'active',
        },
      ],
      observations: [],
      allergies: [],
    };
    expect(nsaidHfInteractionRule(bundle)).toHaveLength(0);
  });

  test('HFpEF (I50.32) + active ibuprofen → zero findings (HFrEF-only rule)', () => {
    const bundle: PatientBundle = {
      patient: { id: 'hfpef', name: 'HFpEF', dob: '1955-01-01', sex: 'female' },
      conditions: [
        {
          code: 'I50.32',
          codeSystem: 'http://hl7.org/fhir/sid/icd-10-cm',
          display: 'Chronic diastolic (congestive) heart failure',
          status: 'active',
        },
      ],
      medications: [
        {
          rxnormCode: NSAID_RXCUIS.ibuprofen,
          name: 'ibuprofen 600 MG Oral Tablet',
          genericName: 'ibuprofen',
          route: 'oral',
          status: 'active',
        },
      ],
      observations: [],
      allergies: [],
    };
    expect(nsaidHfInteractionRule(bundle)).toHaveLength(0);
  });
});

describe('topical NSAID suppression', () => {
  test('HFrEF + diclofenac gel (route=topical) → zero findings', () => {
    const bundle = hfrefBundle([
      {
        rxnormCode: NSAID_RXCUIS.diclofenac,
        name: 'diclofenac sodium 1% Topical Gel',
        genericName: 'diclofenac',
        dose: '4 g to affected area QID',
        route: 'topical',
        status: 'active',
      },
    ]);
    expect(nsaidHfInteractionRule(bundle)).toHaveLength(0);
  });

  test('HFrEF + transdermal route → zero findings', () => {
    const bundle = hfrefBundle([
      {
        rxnormCode: NSAID_RXCUIS.diclofenac,
        name: 'diclofenac transdermal patch',
        genericName: 'diclofenac',
        route: 'transdermal',
        status: 'active',
      },
    ]);
    expect(nsaidHfInteractionRule(bundle)).toHaveLength(0);
  });

  test('HFrEF + diclofenac with missing route → finding still fires (safer default)', () => {
    const bundle = hfrefBundle([
      {
        rxnormCode: NSAID_RXCUIS.diclofenac,
        name: 'diclofenac 75 MG Tablet',
        genericName: 'diclofenac',
        status: 'active',
      },
    ]);
    expect(nsaidHfInteractionRule(bundle)).toHaveLength(1);
  });
});

describe('full ingredient coverage — each NSAID fires individually', () => {
  for (const [name, rxcui] of Object.entries(NSAID_RXCUIS)) {
    test(`HFrEF + active ${name} (RxCUI ${rxcui}) → one finding`, () => {
      const bundle = hfrefBundle([
        {
          rxnormCode: rxcui,
          name: `${name} test product`,
          genericName: name,
          route: 'oral',
          status: 'active',
        },
      ]);
      const findings = nsaidHfInteractionRule(bundle);
      expect(findings).toHaveLength(1);
      expect(findings[0].subcategory).toBe(name);
    });
  }
});

describe('generic-name fallback when rxnormCode is missing', () => {
  test('HFrEF + ibuprofen with no rxnormCode but name match → fires', () => {
    const bundle = hfrefBundle([
      {
        name: 'ibuprofen 400 MG Oral Tablet',
        genericName: 'ibuprofen',
        route: 'oral',
        status: 'active',
      },
    ]);
    const findings = nsaidHfInteractionRule(bundle);
    expect(findings).toHaveLength(1);
    expect(findings[0].subcategory).toBe('ibuprofen');
  });
});

describe('empty bundle', () => {
  test('does not throw; emits zero findings', () => {
    const bundle: PatientBundle = {
      patient: { id: 'empty', name: 'empty' },
      conditions: [],
      medications: [],
      observations: [],
      allergies: [],
    };
    expect(() => nsaidHfInteractionRule(bundle)).not.toThrow();
    expect(nsaidHfInteractionRule(bundle)).toHaveLength(0);
  });
});
