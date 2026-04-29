// One-shot seed script: load data/investigations/*.json into Supabase.
//
// Idempotent by default — skips investigations whose id already exists.
// Pass --force to delete and reinsert (useful when refreshing demo timestamps,
// since time tokens are resolved at insert time and frozen thereafter).
//
// Usage:  node scripts/seed-investigations.js [--force]

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");

// Load .env.local
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
  const hourMs = 1000 * 60 * 60;
  const minMs = 1000 * 60;

  let m = value.match(/^<minutes-ago:(\d+)>$/);
  if (m) return new Date(now - Number(m[1]) * minMs).toISOString();

  m = value.match(/^<hours-ago:(\d+)>$/);
  if (m) return new Date(now - Number(m[1]) * hourMs).toISOString();

  m = value.match(/^<days-ago:(\d+)\s+(\d{1,2}):(\d{2})>$/);
  if (m) {
    const d = new Date(now - Number(m[1]) * dayMs);
    d.setHours(Number(m[2]), Number(m[3]), 0, 0);
    return d.toISOString();
  }

  m = value.match(/^<today\s+(\d{1,2}):(\d{2})>$/);
  if (m) {
    const d = new Date();
    d.setHours(Number(m[1]), Number(m[2]), 0, 0);
    return d.toISOString();
  }

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

function loadSeed(file) {
  const raw = readFileSync(
    path.join(REPO_ROOT, "data", "investigations", file),
    "utf8",
  );
  const parsed = JSON.parse(raw);
  const resolved = resolveTokensDeep(parsed);
  // Recompute lastActivityAt from newest touchpoint after token resolution.
  const tps = resolved.touchpoints || [];
  if (tps.length) {
    const last = tps
      .map((t) => t.occurredAt)
      .filter(Boolean)
      .sort()
      .pop();
    if (last) resolved.lastActivityAt = last;
  }
  return resolved;
}

async function seedOne(seed) {
  const { data: existing } = await supabase
    .from("kairos_investigations")
    .select("id")
    .eq("id", seed.id)
    .maybeSingle();

  if (existing && !force) {
    console.log(`SKIP ${seed.id} (already exists; pass --force to replace)`);
    return;
  }

  if (existing && force) {
    // ON DELETE CASCADE on touchpoints handles cleanup.
    const { error: delErr } = await supabase
      .from("kairos_investigations")
      .delete()
      .eq("id", seed.id);
    if (delErr) throw delErr;
    console.log(`DELETED ${seed.id} (force)`);
  }

  const { error: invErr } = await supabase
    .from("kairos_investigations")
    .insert({
      id: seed.id,
      patient_id: seed.patientId,
      title: seed.title,
      clinical_concern: seed.clinicalConcern ?? null,
      status: seed.status ?? "open",
      created_at: seed.createdAt,
      last_activity_at: seed.lastActivityAt,
    });
  if (invErr) throw invErr;

  if (seed.touchpoints?.length) {
    const rows = seed.touchpoints.map((tp) => ({
      id: tp.id,
      investigation_id: seed.id,
      kind: tp.kind,
      bucket: tp.bucket,
      occurred_at: tp.occurredAt,
      summary: tp.summary,
      data: tp.data ?? {},
      source_actor: tp.sourceActor,
      source_detail: tp.sourceDetail ?? null,
    }));
    const { error: tpErr } = await supabase
      .from("kairos_investigation_touchpoints")
      .insert(rows);
    if (tpErr) throw tpErr;
  }

  console.log(`SEEDED ${seed.id} (${seed.touchpoints?.length || 0} touchpoints)`);
}

const seedDir = path.join(REPO_ROOT, "data", "investigations");
const files = readdirSync(seedDir).filter((f) => f.endsWith(".json"));

for (const file of files) {
  const seed = loadSeed(file);
  await seedOne(seed);
}

console.log("done.");
