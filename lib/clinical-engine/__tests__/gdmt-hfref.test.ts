import * as fs from 'fs';
import * as path from 'path';
import { gdmtHfrefRule, EGFR_LOINC_CODES } from '../rules/gdmt-hfref';
import type { Finding, PatientBundle } from '../types';

const FIXTURES_DIR = path.join(__dirname, '..', 'fixtures');

function loadFixture(filename: string): PatientBundle {
  const raw = fs.readFileSync(path.join(FIXTURES_DIR, filename), 'utf8');
  return JSON.parse(raw) as PatientBundle;
}

function findBySubAndStatus(
  findings: Finding[],
  subcategory: string,
  status: Finding['status']
): Finding | undefined {
  return findings.find(
    (f) => f.subcategory === subcategory && f.status === status
  );
}

function gapLikeStatuses(): Finding['status'][] {
  return ['missing', 'contraindicated', 'non-evidence-based'];
}

describe('fixture-01-all-gaps.json — HFrEF, no GDMT meds', () => {
  const bundle = loadFixture('fixture-01-all-gaps.json');
  const findings = gdmtHfrefRule(bundle);

  test('ACEi/ARB/ARNi gap fires', () => {
    expect(findBySubAndStatus(findings, 'acei-arb-arni', 'missing')).toBeDefined();
  });

  test('Beta-blocker gap fires', () => {
    expect(findBySubAndStatus(findings, 'beta-blocker', 'missing')).toBeDefined();
  });

  test('MRA gap fires', () => {
    expect(findBySubAndStatus(findings, 'mra', 'missing')).toBeDefined();
  });

  test('SGLT2i gap fires', () => {
    expect(findBySubAndStatus(findings, 'sglt2i', 'missing')).toBeDefined();
  });

  test('exactly 4 findings total', () => {
    expect(findings).toHaveLength(4);
  });
});

describe('fixture-02-tartrate-trap.json — lisinopril + metoprolol tartrate', () => {
  const bundle = loadFixture('fixture-02-tartrate-trap.json');
  const findings = gdmtHfrefRule(bundle);

  test('ACEi/ARB/ARNi gap does NOT fire (lisinopril present)', () => {
    const gapLike = findings.find(
      (f) =>
        f.subcategory === 'acei-arb-arni' &&
        gapLikeStatuses().includes(f.status)
    );
    expect(gapLike).toBeUndefined();
  });

  test('Beta-blocker non-evidence-based finding fires', () => {
    expect(
      findBySubAndStatus(findings, 'beta-blocker', 'non-evidence-based')
    ).toBeDefined();
  });

  test('MRA gap fires', () => {
    expect(findBySubAndStatus(findings, 'mra', 'missing')).toBeDefined();
  });

  test('SGLT2i gap fires', () => {
    expect(findBySubAndStatus(findings, 'sglt2i', 'missing')).toBeDefined();
  });

  test('exactly 3 findings total', () => {
    expect(findings).toHaveLength(3);
  });
});

describe('fixture-03-full-gdmt.json — full quadruple therapy', () => {
  const bundle = loadFixture('fixture-03-full-gdmt.json');
  const findings = gdmtHfrefRule(bundle);

  test('zero findings (no gaps, no contraindications, no non-evidence-based)', () => {
    expect(findings).toHaveLength(0);
  });
});

describe('fixture-04-mra-contraindicated.json — eGFR 26 contraindicates MRA', () => {
  const bundle = loadFixture('fixture-04-mra-contraindicated.json');
  const findings = gdmtHfrefRule(bundle);

  test('ACEi/ARB/ARNi gap does NOT fire (lisinopril present)', () => {
    const gapLike = findings.find(
      (f) =>
        f.subcategory === 'acei-arb-arni' &&
        gapLikeStatuses().includes(f.status)
    );
    expect(gapLike).toBeUndefined();
  });

  test('Beta-blocker gap does NOT fire (carvedilol present)', () => {
    const gapLike = findings.find(
      (f) =>
        f.subcategory === 'beta-blocker' &&
        gapLikeStatuses().includes(f.status)
    );
    expect(gapLike).toBeUndefined();
  });

  test('MRA contraindicated finding fires (eGFR 26 < 30)', () => {
    expect(
      findBySubAndStatus(findings, 'mra', 'contraindicated')
    ).toBeDefined();
  });

  test('MRA missing gap does NOT fire (distinct from contraindicated)', () => {
    expect(findBySubAndStatus(findings, 'mra', 'missing')).toBeUndefined();
  });

  test('SGLT2i gap does NOT fire (empagliflozin present)', () => {
    const gapLike = findings.find(
      (f) =>
        f.subcategory === 'sglt2i' && gapLikeStatuses().includes(f.status)
    );
    expect(gapLike).toBeUndefined();
  });

  test('exactly 1 finding total', () => {
    expect(findings).toHaveLength(1);
  });
});

describe('fixture-05-bb-asthma.json — J45.50 contraindicates beta-blocker', () => {
  const bundle = loadFixture('fixture-05-bb-asthma.json');
  const findings = gdmtHfrefRule(bundle);

  test('ACEi/ARB/ARNi gap does NOT fire (lisinopril present)', () => {
    const gapLike = findings.find(
      (f) =>
        f.subcategory === 'acei-arb-arni' &&
        gapLikeStatuses().includes(f.status)
    );
    expect(gapLike).toBeUndefined();
  });

  test('Beta-blocker contraindicated finding fires (J45.50)', () => {
    expect(
      findBySubAndStatus(findings, 'beta-blocker', 'contraindicated')
    ).toBeDefined();
  });

  test('Beta-blocker missing gap does NOT fire (distinct from contraindicated)', () => {
    expect(
      findBySubAndStatus(findings, 'beta-blocker', 'missing')
    ).toBeUndefined();
  });

  test('MRA gap does NOT fire (spironolactone present)', () => {
    const gapLike = findings.find(
      (f) => f.subcategory === 'mra' && gapLikeStatuses().includes(f.status)
    );
    expect(gapLike).toBeUndefined();
  });

  test('SGLT2i gap does NOT fire (dapagliflozin present)', () => {
    const gapLike = findings.find(
      (f) =>
        f.subcategory === 'sglt2i' && gapLikeStatuses().includes(f.status)
    );
    expect(gapLike).toBeUndefined();
  });

  test('exactly 1 finding total', () => {
    expect(findings).toHaveLength(1);
  });
});

describe('eGFR multi-code coverage — MRA contraindication fires for every eGFR LOINC variant', () => {
  // Regression test for the eGFR single-code shortcut lift
  // (session 38 cleanup). Verifies the multi-code scan covers
  // all three eGFR LOINC variants we expect to see in US labs.
  for (const loinc of EGFR_LOINC_CODES) {
    test(`HFrEF + eGFR 26 via LOINC ${loinc} → MRA contraindicated`, () => {
      const bundle: PatientBundle = {
        patient: { id: `egfr-${loinc}`, name: 'Test', dob: '1955-01-01', sex: 'male' },
        conditions: [
          {
            code: 'I50.22',
            codeSystem: 'http://hl7.org/fhir/sid/icd-10-cm',
            display: 'Chronic systolic (congestive) heart failure',
            status: 'active',
          },
        ],
        medications: [],
        observations: [
          {
            loincCode: loinc,
            display: 'Glomerular filtration rate',
            value: 26,
            unit: 'mL/min/1.73m2',
            effectiveDate: '2026-04-15',
            category: 'laboratory',
          },
        ],
        allergies: [],
      };
      const findings = gdmtHfrefRule(bundle);
      const mraFinding = findings.find(
        (f) => f.subcategory === 'mra' && f.status === 'contraindicated'
      );
      expect(mraFinding).toBeDefined();
    });
  }
});
