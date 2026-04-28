// End-to-end persistence verification covering Phase 7 of v7.
// Exercises round-trips through every persisted surface, then checks
// security posture (anon must not see service-role data).

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const envText = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
for (const line of envText.split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2];
}

const server = createClient(
  process.env.KAIROS_SUPABASE_URL,
  process.env.KAIROS_SUPABASE_SERVICE_KEY,
  { auth: { persistSession: false } },
);
const anon = createClient(
  process.env.NEXT_PUBLIC_KAIROS_SUPABASE_URL,
  process.env.NEXT_PUBLIC_KAIROS_SUPABASE_ANON_KEY,
);

let failures = 0;
function check(label, ok, detail = "") {
  console.log(`${ok ? "OK  " : "FAIL"}  ${label}${detail ? "  — " + detail : ""}`);
  if (!ok) failures += 1;
}

async function fetchOne(table, filters) {
  let q = server.from(table).select("*");
  for (const [k, v] of Object.entries(filters)) q = q.eq(k, v);
  const { data, error } = await q.maybeSingle();
  if (error && error.code !== "PGRST116") throw error;
  return data;
}

async function fetchMany(table, filters = {}) {
  let q = server.from(table).select("*");
  for (const [k, v] of Object.entries(filters)) q = q.eq(k, v);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

// 1. Investigations
const linn = await fetchOne("kairos_investigations", { id: "investigation_linnehan_001" });
const hart = await fetchOne("kairos_investigations", { id: "investigation_hartwell_001" });
check("Linnehan investigation persists", !!linn);
check("Hartwell investigation persists", !!hart);

const linnTps = await fetchMany("kairos_investigation_touchpoints", { investigation_id: "investigation_linnehan_001" });
const hartTps = await fetchMany("kairos_investigation_touchpoints", { investigation_id: "investigation_hartwell_001" });
check("Linnehan has 6 touchpoints", linnTps.length === 6, `got ${linnTps.length}`);
check("Hartwell has 3 touchpoints", hartTps.length === 3, `got ${hartTps.length}`);

// 2. Evidence
const whitfieldEv = await fetchMany("kairos_evidence", { encounter_id: "whitfield_encounter_001" });
const marburyEv = await fetchMany("kairos_evidence", { encounter_id: "marbury_encounter_001" });
check("Whitfield has 3 seeded evidence items", whitfieldEv.length === 3);
check("Marbury has 3 seeded evidence items", marburyEv.length === 3);
check("Whitfield seeds include family + outside_clinician sources",
  whitfieldEv.some((e) => e.source === "family") && whitfieldEv.some((e) => e.source === "outside_clinician"));

// 3. Evidence round-trip
const probeId = "11111111-2222-4333-8444-555566667777";
await server.from("kairos_evidence").insert({
  id: probeId,
  encounter_id: "whitfield_encounter_001",
  question_id: "probe_q",
  question_text: "probe question",
  answer: "probe answer",
  source: "patient",
});
const after = await fetchMany("kairos_evidence", { encounter_id: "whitfield_encounter_001" });
check("Evidence round-trip insert visible", after.length === 4);
await server.from("kairos_evidence").delete().eq("id", probeId);

// 4. SBAR versioning round-trip — verify monotonic version
const probeEnc = "phase7_probe_encounter";
await server.from("kairos_sbar_versions").delete().eq("encounter_id", probeEnc);
for (let v = 1; v <= 3; v++) {
  await server.from("kairos_sbar_versions").insert({
    encounter_id: probeEnc, version: v,
    situation: "s", background: "b", assessment: "a", recommendation: "r",
    evidence_hash: "h", evidence_count: v, model: "test",
  });
}
const versions = await fetchMany("kairos_sbar_versions", { encounter_id: probeEnc });
check("SBAR versions persist with unique versions", versions.length === 3 && new Set(versions.map((v) => v.version)).size === 3);
await server.from("kairos_sbar_versions").delete().eq("encounter_id", probeEnc);

// 5. Pre-visit task
const cosgrove = await fetchOne("kairos_pre_visit_tasks", { id: "pre_visit_cosgrove_001" });
check("Cosgrove pre-visit task persists", !!cosgrove);
check("Cosgrove has 17 reported meds", (cosgrove?.patient_reported_meds || []).length === 17);

// 6. Discrepancy resolution round-trip
const resProbeId = `disc_probe_${Date.now()}`;
const { data: resInserted } = await server.from("kairos_discrepancy_resolutions").insert({
  pre_visit_task_id: "pre_visit_cosgrove_001",
  discrepancy_id: resProbeId,
  action: "dismissed",
  actor_id: "ma_demo",
  actor_role: "MA",
  reason: "phase 7 probe",
}).select().single();
check("Discrepancy resolution round-trip", !!resInserted);
await server.from("kairos_discrepancy_resolutions").delete().eq("id", resInserted.id);

// 7. Attestation log round-trip
const attProbe = await server.from("kairos_attestation_log").insert({
  pre_visit_task_id: "pre_visit_cosgrove_001",
  actor_id: "ma_demo",
  actor_role: "MA",
  click_type: "medications_reviewed",
  earned: false,
  discrepancy_count: 11,
  unresolved_count: 6,
  patient_name: "Cosgrove probe",
}).select().single();
check("Attestation log round-trip (unearned)", !attProbe.error && attProbe.data.earned === false);
await server.from("kairos_attestation_log").delete().eq("id", attProbe.data.id);

// 8. Security posture: anon should NOT see service-role data
const { data: anonInv } = await anon.from("kairos_investigations").select("id");
check("Anon client cannot see investigations (RLS enforced)",
  !anonInv || anonInv.length === 0,
  anonInv ? `anon saw ${anonInv.length} rows` : "blocked");

console.log(`\n${failures === 0 ? "ALL PASSED" : `${failures} FAILURES`}`);
process.exit(failures === 0 ? 0 : 1);
