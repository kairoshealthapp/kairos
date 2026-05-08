// ============================================================
// FHIR R4 Bundle → PatientBundle normalizer
//
// Accepts the shape produced by scripts/sandbox-probe.js
// (top-level keys: Patient, Condition, MedicationRequest,
//  Observation_laboratory, Observation_LVEF, Observation_LVSF,
//  DiagnosticReport_cardiology, AllergyIntolerance, Encounter)
// AND tolerates hand-curated fixtures with the same key shape.
//
// Defensive: every FHIR field is optional in source data and
// must be optional here. Missing data → undefined, not throw.
// ============================================================

import type {
  PatientBundle,
  PatientCondition,
  PatientMedication,
  PatientObservation,
  PatientAllergy,
  PatientDemographics,
} from './types';

// ── Loose FHIR types we touch (only the slices we read) ─────────────────────
interface FhirCoding {
  system?: string;
  code?: string;
  display?: string;
}
interface FhirCodeableConcept {
  text?: string;
  coding?: FhirCoding[];
}
interface FhirBundleEntry {
  resource?: FhirResource;
}
interface FhirBundle {
  resourceType?: string;
  entry?: FhirBundleEntry[];
}
interface FhirResource {
  resourceType?: string;
  [k: string]: unknown;
}

interface FhirPatient extends FhirResource {
  id?: string;
  birthDate?: string;
  gender?: string;
  name?: Array<{
    text?: string;
    family?: string;
    given?: string[];
  }>;
}
interface FhirCondition extends FhirResource {
  code?: FhirCodeableConcept;
  clinicalStatus?: FhirCodeableConcept;
  onsetDateTime?: string;
  recordedDate?: string;
}
interface FhirMedicationRequest extends FhirResource {
  status?: string;
  medicationCodeableConcept?: FhirCodeableConcept;
  medicationReference?: { display?: string };
  authoredOn?: string;
  dosageInstruction?: Array<{
    text?: string;
    route?: FhirCodeableConcept;
  }>;
}
interface FhirObservation extends FhirResource {
  code?: FhirCodeableConcept;
  category?: FhirCodeableConcept[];
  effectiveDateTime?: string;
  issued?: string;
  effectivePeriod?: { start?: string };
  valueQuantity?: { value?: number; unit?: string };
  valueString?: string;
}
interface FhirAllergy extends FhirResource {
  code?: FhirCodeableConcept;
  reaction?: Array<{
    severity?: string;
    manifestation?: FhirCodeableConcept[];
  }>;
}

// Probe-output bundle shape — every key may be missing.
export interface RawProbeBundle {
  Patient?: FhirPatient;
  Condition?: FhirBundle;
  MedicationRequest?: FhirBundle;
  Observation_laboratory?: FhirBundle;
  Observation_LVEF?: FhirBundle;
  Observation_LVSF?: FhirBundle;
  DiagnosticReport_cardiology?: FhirBundle;
  AllergyIntolerance?: FhirBundle;
  Encounter?: FhirBundle;
  _meta?: unknown;
  [k: string]: unknown;
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function entriesOfType<T extends FhirResource>(
  bundle: FhirBundle | undefined,
  resourceType: string
): T[] {
  if (!bundle || !Array.isArray(bundle.entry)) return [];
  const out: T[] = [];
  for (const e of bundle.entry) {
    const r = e?.resource;
    if (r && r.resourceType === resourceType) out.push(r as T);
  }
  return out;
}

function firstCoding(c?: FhirCodeableConcept): FhirCoding | undefined {
  return c?.coding?.[0];
}

function findCodingBySystem(
  c: FhirCodeableConcept | undefined,
  systemMatcher: (sys: string) => boolean
): FhirCoding | undefined {
  if (!c?.coding) return undefined;
  for (const cd of c.coding) {
    if (cd.system && systemMatcher(cd.system.toLowerCase())) return cd;
  }
  return undefined;
}

// ── Sub-normalizers ─────────────────────────────────────────────────────────
function normalizePatient(p: FhirPatient | undefined): PatientDemographics {
  const n0 = p?.name?.[0];
  const given = Array.isArray(n0?.given) ? n0!.given.join(' ') : '';
  const family = n0?.family ?? '';
  const text = n0?.text ?? `${given} ${family}`.trim();
  return {
    id: p?.id ?? '',
    name: text || '(unknown)',
    dob: p?.birthDate,
    sex: p?.gender,
  };
}

function normalizeCondition(c: FhirCondition): PatientCondition | null {
  const status = firstCoding(c.clinicalStatus)?.code;
  if (status !== 'active') return null;
  const coding = firstCoding(c.code);
  const code = coding?.code;
  if (!code) return null;
  return {
    code,
    codeSystem: coding?.system,
    display: coding?.display ?? c.code?.text,
    status,
    onsetDate: c.onsetDateTime ?? c.recordedDate,
  };
}

function normalizeMedicationRequest(
  m: FhirMedicationRequest
): PatientMedication | null {
  if (m.status !== 'active') return null;
  const cc = m.medicationCodeableConcept;
  const rxnorm = findCodingBySystem(cc, (sys) => sys.includes('rxnorm'));
  const firstCC = firstCoding(cc);
  const name =
    cc?.text ?? firstCC?.display ?? m.medicationReference?.display ?? '(unknown medication)';
  const dose0 = m.dosageInstruction?.[0];
  return {
    rxnormCode: rxnorm?.code,
    name,
    genericName: rxnorm?.display ?? firstCC?.display,
    dose: dose0?.text,
    route: dose0?.route?.text ?? firstCoding(dose0?.route)?.display,
    status: m.status,
    prescribedDate: m.authoredOn,
  };
}

function normalizeObservation(o: FhirObservation): PatientObservation | null {
  const loinc = findCodingBySystem(o.code, (sys) => sys.includes('loinc'));
  const anyCoding = loinc ?? firstCoding(o.code);
  return {
    loincCode: loinc?.code,
    display: anyCoding?.display ?? o.code?.text,
    value: o.valueQuantity?.value,
    unit: o.valueQuantity?.unit,
    effectiveDate:
      o.effectiveDateTime ?? o.issued ?? o.effectivePeriod?.start,
    category: firstCoding(o.category?.[0])?.code,
  };
}

function normalizeAllergy(a: FhirAllergy): PatientAllergy {
  const coding = firstCoding(a.code);
  const reaction0 = a.reaction?.[0];
  const manifest = firstCoding(reaction0?.manifestation?.[0]);
  return {
    code: coding?.code,
    display: coding?.display ?? a.code?.text,
    severity: reaction0?.severity,
    reactionType: manifest?.display ?? reaction0?.manifestation?.[0]?.text,
  };
}

// ── Public ──────────────────────────────────────────────────────────────────
export function normalizeFhirBundle(raw: RawProbeBundle): PatientBundle {
  const patient = normalizePatient(raw.Patient);

  const conditions: PatientCondition[] = entriesOfType<FhirCondition>(
    raw.Condition,
    'Condition'
  )
    .map(normalizeCondition)
    .filter((c): c is PatientCondition => c !== null);

  const medications: PatientMedication[] = entriesOfType<FhirMedicationRequest>(
    raw.MedicationRequest,
    'MedicationRequest'
  )
    .map(normalizeMedicationRequest)
    .filter((m): m is PatientMedication => m !== null);

  // Merge all Observation_* bundles into one stream.
  const obsBundles: Array<FhirBundle | undefined> = [
    raw.Observation_laboratory,
    raw.Observation_LVEF,
    raw.Observation_LVSF,
  ];
  const observations: PatientObservation[] = obsBundles
    .flatMap((b) => entriesOfType<FhirObservation>(b, 'Observation'))
    .map(normalizeObservation)
    .filter((o): o is PatientObservation => o !== null);

  const allergies: PatientAllergy[] = entriesOfType<FhirAllergy>(
    raw.AllergyIntolerance,
    'AllergyIntolerance'
  ).map(normalizeAllergy);

  return { patient, conditions, medications, observations, allergies };
}
