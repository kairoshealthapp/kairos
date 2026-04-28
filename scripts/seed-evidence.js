// One-shot seed for kairos_evidence. Idempotent per encounter: if any evidence
// row already exists for an encounter_id, the script skips that encounter
// (delete rows manually to force a re-seed).
//
// Usage: node scripts/seed-evidence.js [--force]

import { readFileSync } from "node:fs";
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

// Stable UUIDs (UUIDv4 shape, hand-picked literals) so reruns are idempotent.
const SEEDS = {
  whitfield_encounter_001: [
    {
      id: "11111111-1111-4111-8111-w00000000001",
      questionId: "seed_001",
      questionText: 'Confirm current symptoms — what specifically is "worse"?',
      answer:
        "Spouse reports increasing SOB over past 3 days, worse with exertion. Sleeping in recliner since Tuesday. No chest pain. Cough productive of clear sputum.",
      source: "family",
      sourceDetail: "Wife (spouse on phone)",
      capturedMinutesAgo: 5,
    },
    {
      id: "11111111-1111-4111-8111-w00000000002",
      questionId: "seed_002",
      questionText: "Has he weighed himself? Trend?",
      answer: "Up 6 lbs since last Friday per home scale. Current weight 198.",
      source: "family",
      sourceDetail: "Wife",
      capturedMinutesAgo: 4,
    },
    {
      id: "11111111-1111-4111-8111-w00000000003",
      questionId: "seed_003",
      questionText: "Reason Lasix was discontinued on 3/1?",
      answer:
        "Per Renee (VA RN): pre-renal AKI on 2/28 labs (Cr 1.8, baseline 1.2). Plan was to hold and recheck in 2 weeks. Has not been restarted. No labs since.",
      source: "outside_clinician",
      sourceDetail: "Renee, VA cardiology RN",
      capturedMinutesAgo: 3,
    },
  ],
  marbury_encounter_001: [
    {
      id: "22222222-2222-4222-8222-m00000000001",
      questionId: "seed_h001",
      questionText: "How is patient taking the labetalol — any missed doses?",
      answer:
        "Reports taking morning dose consistently. Has missed evening dose 3-4 times in past 2 weeks because she \"forgets after dinner.\" Going to set phone alarm.",
      source: "patient",
      sourceDetail: "",
      capturedMinutesAgo: 8,
    },
    {
      id: "22222222-2222-4222-8222-m00000000002",
      questionId: "seed_h002",
      questionText: "Any symptoms with the higher readings?",
      answer:
        "Headache on 4/25 morning when SBP 156. No chest pain, no vision changes, no shortness of breath. Headaches resolve with Tylenol.",
      source: "patient",
      sourceDetail: "",
      capturedMinutesAgo: 7,
    },
    {
      id: "22222222-2222-4222-8222-m00000000003",
      questionId: "seed_h003",
      questionText: "Sodium intake / dietary changes?",
      answer:
        "Says she has been more careful — switched from regular to low-sodium soup, stopped adding salt at table. Husband says she still eats out for lunch 3-4x/week.",
      source: "patient",
      sourceDetail: "",
      capturedMinutesAgo: 6,
    },
  ],
};

// The "wXX" / "mXX" suffixes above aren't valid UUID hex chars. Coerce to valid
// UUID by replacing non-hex with deterministic hex values. Done here so the
// SEEDS table above stays human-readable.
function normalizeUuid(s) {
  return s.replace(/[^0-9a-fA-F-]/g, (ch) => {
    const code = ch.charCodeAt(0);
    return ((code & 0xf) % 16).toString(16);
  });
}

async function seedEncounter(encounterId, items) {
  const { count, error: cntErr } = await supabase
    .from("kairos_evidence")
    .select("*", { count: "exact", head: true })
    .eq("encounter_id", encounterId);
  if (cntErr) throw cntErr;

  if (count > 0 && !force) {
    console.log(`SKIP ${encounterId} (${count} rows exist; pass --force to replace)`);
    return;
  }

  if (count > 0 && force) {
    const { error: delErr } = await supabase
      .from("kairos_evidence")
      .delete()
      .eq("encounter_id", encounterId);
    if (delErr) throw delErr;
    console.log(`DELETED ${count} rows for ${encounterId} (force)`);
  }

  const now = Date.now();
  const rows = items.map((it) => ({
    id: normalizeUuid(it.id),
    encounter_id: encounterId,
    question_id: it.questionId,
    question_text: it.questionText,
    answer: it.answer,
    source: it.source,
    source_detail: it.sourceDetail || null,
    captured_at: new Date(now - it.capturedMinutesAgo * 60 * 1000).toISOString(),
  }));

  const { error: insErr } = await supabase
    .from("kairos_evidence")
    .insert(rows);
  if (insErr) throw insErr;

  console.log(`SEEDED ${encounterId} (${rows.length} evidence items)`);
}

for (const [encounterId, items] of Object.entries(SEEDS)) {
  await seedEncounter(encounterId, items);
}

console.log("done.");
