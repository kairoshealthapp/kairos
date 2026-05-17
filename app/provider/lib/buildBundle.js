// Builds a clinical-engine PatientBundle from a /provider schedule
// entry. Schedule rows carry only the header (name, age, sex,
// visitType) plus a compact inline `bundle` descriptor with conditions,
// medications, observations, allergies. This helper synthesizes a DOB
// from the integer age and assembles the full bundle shape the rule
// engine consumes.
//
// "Today" for age math is pinned to the provider page date so age-gated
// rules behave deterministically across the build.

const PROVIDER_DATE = new Date("2026-05-17T00:00:00Z");

function dobFromAge(age) {
  const n = parseInt(age, 10);
  if (!Number.isFinite(n)) return undefined;
  const y = PROVIDER_DATE.getUTCFullYear() - n;
  return `${y}-01-15`; // mid-January so age math is unambiguous
}

function normalizeSex(sex) {
  if (!sex) return undefined;
  const s = String(sex).toUpperCase();
  if (s === "M") return "male";
  if (s === "F") return "female";
  return sex;
}

export default function buildBundle(visit) {
  if (!visit) return null;
  const b = visit.bundle || {};
  return {
    patient: {
      id: visit.id,
      name: visit.name,
      dob: dobFromAge(visit.age),
      sex: normalizeSex(visit.sex),
    },
    conditions: Array.isArray(b.conditions) ? b.conditions : [],
    medications: Array.isArray(b.medications) ? b.medications : [],
    observations: Array.isArray(b.observations) ? b.observations : [],
    allergies: Array.isArray(b.allergies) ? b.allergies : [],
  };
}
