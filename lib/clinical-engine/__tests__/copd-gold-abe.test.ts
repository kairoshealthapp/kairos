import * as fs from 'fs';
import * as path from 'path';
import {
  copdGoldAbeRule,
  classifyGold,
  COPD_SYMPTOM_MMRC_THRESHOLD,
  COPD_EXACERBATION_E_GROUP_THRESHOLD,
  COPD_EOS_ICS_THRESHOLD,
} from '../rules/copd-gold-abe';
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

function copdBundle(overrides: Partial<PatientBundle> = {}): PatientBundle {
  return {
    patient: { id: 't', name: 'Test', dob: '1958-01-01', sex: 'male' },
    conditions: [{ code: 'J44.9', codeSystem: 'icd10', status: 'active', display: 'COPD' }],
    medications: [],
    observations: [
      { loincCode: '33365-8', value: 0.6, effectiveDate: '2026-01-01', category: 'laboratory' },
    ],
    allergies: [],
    ...overrides,
  };
}

describe('fixture-68 — Group B no LABA+LAMA → gap', () => {
  const f = copdGoldAbeRule(loadFixture('fixture-68-copd-group-b-no-laba-lama.json'));
  test('one finding', () => {
    expect(f).toHaveLength(1);
    expect(f[0].subcategory).toBe('group-b-missing-laba-lama');
  });
});

describe('fixture-69 — Group E + eos≥300 on LABA+LAMA only → missing triple', () => {
  const f = copdGoldAbeRule(loadFixture('fixture-69-copd-group-e-triple-eos-high.json'));
  test('one finding (group-e-missing-triple)', () => {
    expect(f).toHaveLength(1);
    expect(f[0].subcategory).toBe('group-e-missing-triple');
  });
});

describe('fixture-70 — Group A on albuterol → zero', () => {
  test('zero findings', () => {
    expect(copdGoldAbeRule(loadFixture('fixture-70-copd-group-a-on-albuterol.json'))).toHaveLength(0);
  });
});

describe('non-COPD or no spirometry → zero', () => {
  test('no J44 ICD → zero', () => {
    expect(copdGoldAbeRule(copdBundle({ conditions: [] }))).toHaveLength(0);
  });
  test('J44 but no spirometry → zero', () => {
    expect(copdGoldAbeRule(copdBundle({ observations: [] }))).toHaveLength(0);
  });
  test('J44 + FEV1/FVC 0.8 (not obstructed) → zero', () => {
    expect(copdGoldAbeRule(copdBundle({ observations: [{ loincCode: '33365-8', value: 0.8, effectiveDate: '2026-01-01', category: 'laboratory' }] }))).toHaveLength(0);
  });
});

describe('classifyGold', () => {
  test('exacerbations ≥2 → E regardless of symptoms', () => {
    const b = copdBundle({
      conditions: [
        { code: 'J44.9', codeSystem: 'icd10', status: 'active', display: 'COPD' },
        { code: 'J44.1', codeSystem: 'icd10', status: 'resolved', display: 'COPD exac', onsetDate: isoMonthsAgo(3) },
        { code: 'J44.1', codeSystem: 'icd10', status: 'resolved', display: 'COPD exac', onsetDate: isoMonthsAgo(8) },
      ],
    });
    expect(classifyGold(b)).toBe('E');
  });
  test(`mMRC ${COPD_SYMPTOM_MMRC_THRESHOLD} → B (no exacerbations)`, () => {
    const b = copdBundle({
      observations: [
        { loincCode: '33365-8', value: 0.6, effectiveDate: '2026-01-01', category: 'laboratory' },
        { loincCode: '89270-4', value: COPD_SYMPTOM_MMRC_THRESHOLD, effectiveDate: '2026-01-01', category: 'survey' },
      ],
    });
    expect(classifyGold(b)).toBe('B');
  });
  test(`mMRC ${COPD_SYMPTOM_MMRC_THRESHOLD - 1} → A`, () => {
    const b = copdBundle({
      observations: [
        { loincCode: '33365-8', value: 0.6, effectiveDate: '2026-01-01', category: 'laboratory' },
        { loincCode: '89270-4', value: COPD_SYMPTOM_MMRC_THRESHOLD - 1, effectiveDate: '2026-01-01', category: 'survey' },
      ],
    });
    expect(classifyGold(b)).toBe('A');
  });
});

describe('group E without ICS-qualifying eos', () => {
  test(`eos ${COPD_EOS_ICS_THRESHOLD - 1}, on LABA+LAMA → zero`, () => {
    const b = copdBundle({
      conditions: [
        { code: 'J44.9', codeSystem: 'icd10', status: 'active', display: 'COPD' },
        { code: 'J44.1', codeSystem: 'icd10', status: 'resolved', display: 'exac', onsetDate: isoMonthsAgo(2) },
        { code: 'J44.1', codeSystem: 'icd10', status: 'resolved', display: 'exac', onsetDate: isoMonthsAgo(6) },
      ],
      medications: [
        { rxnormCode: '1487535', name: 'umeclidinium/vilanterol', genericName: 'umeclidinium/vilanterol', status: 'active', route: 'inhalation' },
      ],
      observations: [
        { loincCode: '33365-8', value: 0.55, effectiveDate: '2026-01-01', category: 'laboratory' },
        { loincCode: '26449-9', value: COPD_EOS_ICS_THRESHOLD - 1, effectiveDate: '2026-01-01', category: 'laboratory' },
      ],
    });
    expect(copdGoldAbeRule(b)).toHaveLength(0);
  });
});

describe('cross-rule isolation — existing fixtures (does-not-throw)', () => {
  const ALL = fs.readdirSync(FIXTURES_DIR).filter((f) => f.startsWith('fixture-') && f.endsWith('.json'));
  for (const fx of ALL) {
    if (['fixture-68-copd-group-b-no-laba-lama.json', 'fixture-69-copd-group-e-triple-eos-high.json', 'fixture-70-copd-group-a-on-albuterol.json'].includes(fx)) continue;
    test(`${fx} → zero findings (no other fixture has J44 ICD)`, () => {
      expect(copdGoldAbeRule(loadFixture(fx))).toHaveLength(0);
    });
  }
});

describe('empty bundle', () => {
  test('zero findings', () => {
    const b: PatientBundle = { patient: { id: 'x', name: 'x' }, conditions: [], medications: [], observations: [], allergies: [] };
    expect(copdGoldAbeRule(b)).toHaveLength(0);
  });
});
