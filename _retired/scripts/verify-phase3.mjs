import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const envText = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
for (const line of envText.split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2];
}

const supabase = createClient(
  process.env.KAIROS_SUPABASE_URL,
  process.env.KAIROS_SUPABASE_SERVICE_KEY,
  { auth: { persistSession: false } },
);

const { data, error } = await supabase
  .from("kairos_investigations")
  .select("*, touchpoints:kairos_investigation_touchpoints(*)")
  .order("last_activity_at", { ascending: false });

if (error) { console.error(error); process.exit(1); }

for (const inv of data) {
  console.log(`${inv.id}  status=${inv.status}  tps=${inv.touchpoints.length}  last_activity=${inv.last_activity_at}`);
  for (const t of inv.touchpoints.sort((a,b)=>new Date(a.occurred_at)-new Date(b.occurred_at))) {
    console.log(`  ${t.occurred_at}  ${t.kind.padEnd(16)}  ${t.summary.slice(0,70)}`);
  }
}

// Test addTouchpoint round-trip
const probeId = `tp_probe_${Date.now()}`;
const { error: insErr } = await supabase.from("kairos_investigation_touchpoints").insert({
  id: probeId,
  investigation_id: "investigation_linnehan_001",
  kind: "secure_chat",
  bucket: "patient_call",
  occurred_at: new Date().toISOString(),
  summary: "PROBE: round-trip test (will be deleted)",
  source_actor: "test",
  data: {},
});
if (insErr) { console.error("insert failed:", insErr); process.exit(1); }

const { data: linn2 } = await supabase
  .from("kairos_investigations")
  .select("last_activity_at")
  .eq("id", "investigation_linnehan_001")
  .single();
console.log(`\nAfter probe insert: linnehan last_activity_at = ${linn2.last_activity_at} (should be ~now)`);

await supabase.from("kairos_investigation_touchpoints").delete().eq("id", probeId);
console.log("probe touchpoint cleaned up");
