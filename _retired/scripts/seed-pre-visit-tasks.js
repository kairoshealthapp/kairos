// One-shot seed for kairos_pre_visit_tasks. Idempotent — skips tasks whose id
// already exists. Pass --force to delete and reinsert (also clears any
// dependent discrepancy_resolutions rows via ON DELETE CASCADE).
//
// Usage: node scripts/seed-pre-visit-tasks.js [--force]

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");

const envText = readFileSync(path.join(REPO_ROOT, ".env.local"), "utf8");
for (const line of envText.split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2];
}

const force = process.argv.includes("--force");

const supabase = createClient(
  process.env.KAIROS_SUPABASE_URL,
  process.env.KAIROS_SUPABASE_SERVICE_KEY,
  { auth: { persistSession: false } },
);

function resolveTimeToken(value) {
  if (typeof value !== "string") return value;
  const now = Date.now();
  const dayMs = 1000 * 60 * 60 * 24;
  const days = value.match(/^<(\d+)\s+days?\s+ago>$/i);
  if (days) return new Date(now - Number(days[1]) * dayMs).toISOString();
  const hours = value.match(/^<(\d+)\s+hours?\s+ago>$/i);
  if (hours) return new Date(now - Number(hours[1]) * 60 * 60 * 1000).toISOString();
  const future = value.match(/^<in\s+(\d+)\s+days?>$/i);
  if (future) return new Date(now + Number(future[1]) * dayMs).toISOString();
  return value;
}

function resolveTokensDeep(node) {
  if (Array.isArray(node)) return node.map(resolveTokensDeep);
  if (node && typeof node === "object") {
    const out = {};
    for (const k of Object.keys(node)) out[k] = resolveTokensDeep(node[k]);
    return out;
  }
  return resolveTimeToken(node);
}

async function seedTask(seed) {
  const { data: existing } = await supabase
    .from("kairos_pre_visit_tasks")
    .select("id")
    .eq("id", seed.id)
    .maybeSingle();

  if (existing && !force) {
    console.log(`SKIP ${seed.id} (already exists; pass --force to replace)`);
    return;
  }

  if (existing && force) {
    const { error: delErr } = await supabase
      .from("kairos_pre_visit_tasks")
      .delete()
      .eq("id", seed.id);
    if (delErr) throw delErr;
    console.log(`DELETED ${seed.id} (force)`);
  }

  const row = {
    id: seed.id,
    patient_id: seed.patientId,
    appointment_date: seed.appointmentDate,
    capture_method: seed.captureMethod,
    captured_at: seed.capturedAt,
    status: seed.status ?? "submitted",
    patient_reported_meds: seed.patientReportedMeds ?? [],
    patient_notes: seed.patientNotes ?? null,
  };
  const { error } = await supabase.from("kairos_pre_visit_tasks").insert(row);
  if (error) throw error;

  console.log(`SEEDED ${seed.id} (${row.patient_reported_meds.length} reported meds)`);
}

const seedDir = path.join(REPO_ROOT, "data", "preVisitTasks");
const files = readdirSync(seedDir).filter((f) => f.endsWith(".json"));

for (const file of files) {
  const raw = readFileSync(path.join(seedDir, file), "utf8");
  const seed = resolveTokensDeep(JSON.parse(raw));
  await seedTask(seed);
}

console.log("done.");
