#!/usr/bin/env node
/* eslint-disable no-console */

// ─────────────────────────────────────────────────────────────────────────────
// sandbox-probe.js — One-off Epic FHIR R4 sandbox probe (Phase 1 fixture pull)
//
// Run manually:    node scripts/sandbox-probe.js
//
// NOT wired into the app. NOT imported by any /rn or /provider surface.
// Reads the Epic Backend Services credentials from the firekraker-monorepo
// .env.master at C:\Users\kents\firekraker-monorepo\.env.master as a one-way
// reference — the private key is NEVER copied into this repo.
//
// Note on credential variables:
//   The task brief referenced EPIC_FHIR_CLIENT_ID / EPIC_FHIR_PRIVATE_KEY,
//   but the canonical names in .env.master (matching the working clinai
//   Backend Services setup verified by scripts/jwt-diagnostic.js) are:
//     - CLINAI_CLIENT_ID    (alias-checked; falls back to the registered
//       a85de553-… client ID hardcoded here, which is the same value)
//     - CLINAI_PRIVATE_KEY_PEM
//   We ALSO accept EPIC_FHIR_CLIENT_ID / EPIC_FHIR_PRIVATE_KEY if present.
//
// Purpose: see the actual shape of sandbox FHIR data before writing GDMT-gap
// rule logic against it. Per-patient JSON dumps are written to
// scripts/fixtures/ (gitignored).
// ─────────────────────────────────────────────────────────────────────────────

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

// ── Configuration ───────────────────────────────────────────────────────────
const ENV_MASTER_PATH = "C:/Users/kents/firekraker-monorepo/.env.master";
const FALLBACK_CLIENT_ID = "a85de553-5013-47e8-9f3b-f3c797176f81";
const TOKEN_URL = "https://fhir.epic.com/interconnect-fhir-oauth/oauth2/token";
const FHIR_BASE = "https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4";
const JWT_KID = "clinai-key-1";          // matches public JWKS at auth.firekraker.net
const JWT_ALG = "RS384";

const PATIENTS = [
  { name: "Camila Lopez",      id: "erXuFYUfucBZaryVksYEcMg3" },
  { name: "Derrick Lin",       id: "eq081-VQEgP8drUUqCWzHfw3" },
  { name: "Desiree Lambridge",    id: "eAB3mDIBBcyUKviyzrxsnAw3" },
  { name: "Elijah Pendrelle",      id: "eIXesllypH3M9tAA5WdJftQ3" },
  { name: "Linda Ross",        id: "eIH9a6H4v6tlBwy0t8QrxSA3" },
  { name: "Olivia Roberts",    id: "eq3p3kmtns1Bo4eAitJSOhg3" },
  { name: "Warren McGinnis",   id: "e0w0LEDCYtfckT6N.CkJKCw3" },
];

const FIXTURES_DIR = path.resolve(__dirname, "fixtures");

// ── .env.master reader ──────────────────────────────────────────────────────
function readEnvMaster() {
  const text = fs.readFileSync(ENV_MASTER_PATH, "utf8");
  const env = {};
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    env[key] = val.includes("\\n") ? val.replace(/\\n/g, "\n") : val;
  }
  return env;
}

function loadCredentials() {
  const env = readEnvMaster();
  const clientId =
    env.EPIC_FHIR_CLIENT_ID || env.CLINAI_CLIENT_ID || FALLBACK_CLIENT_ID;
  const privateKey = env.EPIC_FHIR_PRIVATE_KEY || env.CLINAI_PRIVATE_KEY_PEM;
  if (!privateKey) {
    throw new Error(
      "No private key found in .env.master (looked for EPIC_FHIR_PRIVATE_KEY, CLINAI_PRIVATE_KEY_PEM)"
    );
  }
  return { clientId, privateKey };
}

// ── JWT helpers ─────────────────────────────────────────────────────────────
function b64url(buf) {
  return Buffer.from(buf)
    .toString("base64")
    .replace(/=+$/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function buildSignedJwt(clientId, privateKeyPem) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: JWT_ALG, typ: "JWT", kid: JWT_KID };
  const payload = {
    iss: clientId,
    sub: clientId,
    aud: TOKEN_URL,
    exp: now + 240, // ≤ 5 minutes per Epic Backend Services spec
    nbf: now,
    iat: now,
    jti: crypto.randomUUID(),
  };
  const signingInput = `${b64url(JSON.stringify(header))}.${b64url(
    JSON.stringify(payload)
  )}`;
  const signature = crypto.sign("sha384", Buffer.from(signingInput), privateKeyPem);
  return { jwt: `${signingInput}.${b64url(signature)}`, payload };
}

// ── Token exchange ──────────────────────────────────────────────────────────
async function getAccessToken(clientId, privateKey) {
  const { jwt, payload } = buildSignedJwt(clientId, privateKey);
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_assertion_type:
      "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
    client_assertion: jwt,
  });

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body,
  });

  const text = await res.text();
  if (!res.ok) {
    console.error("\n[FATAL] Token endpoint returned non-2xx.");
    console.error(`  HTTP ${res.status} ${res.statusText}`);
    console.error(`  client_id used: ${clientId}`);
    console.error(`  jwt jti:        ${payload.jti}`);
    console.error(`  response body:`);
    console.error(text);
    throw new Error("JWT auth failed — see response body above");
  }

  let json;
  try { json = JSON.parse(text); } catch (e) {
    throw new Error(`Token response was not JSON: ${text}`);
  }
  return json;
}

// ── FHIR fetch helper ───────────────────────────────────────────────────────
async function fhirFetch(token, urlPath) {
  const url = urlPath.startsWith("http") ? urlPath : `${FHIR_BASE}${urlPath}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/fhir+json",
    },
  });
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch (e) { body = { _raw: text }; }
  return { status: res.status, ok: res.ok, body };
}

// ── Per-patient query plan ──────────────────────────────────────────────────
function patientQueries(pid) {
  const enc = encodeURIComponent(pid);
  return {
    Patient: `/Patient/${enc}`,
    Condition: `/Condition?patient=${enc}&clinical-status=active`,
    MedicationRequest: `/MedicationRequest?patient=${enc}&status=active`,
    Observation_laboratory: `/Observation?patient=${enc}&category=laboratory&_count=100&_sort=-date`,
    Observation_LVEF: `/Observation?patient=${enc}&code=${encodeURIComponent("http://loinc.org|10230-1")}`,
    Observation_LVSF: `/Observation?patient=${enc}&code=${encodeURIComponent("http://loinc.org|8806-2")}`,
    DiagnosticReport_cardiology: `/DiagnosticReport?patient=${enc}&category=cardiology`,
    AllergyIntolerance: `/AllergyIntolerance?patient=${enc}`,
    Encounter: `/Encounter?patient=${enc}&_count=10&_sort=-date`,
  };
}

// ── HF / LVEF detection helpers (for the one-line summary only) ─────────────
const HF_ICD10 = /^I50(\.|$)/i;
const HF_SNOMED_HF = new Set([
  "84114007",   // Heart failure
  "42343007",   // Congestive heart failure
  "10633002",   // CHF
  "703272007",  // Heart failure with reduced ejection fraction
  "85232009",   // Left ventricular failure
]);

function bundleEntries(b, resourceType) {
  if (!b || b.resourceType !== "Bundle" || !Array.isArray(b.entry)) return [];
  const all = b.entry.map(e => e.resource).filter(Boolean);
  // Skip OperationOutcome warnings that Epic mixes into search bundles.
  return resourceType
    ? all.filter(r => r.resourceType === resourceType)
    : all.filter(r => r.resourceType !== "OperationOutcome");
}

function detectHfCodes(conditionBundle) {
  const codes = [];
  for (const c of bundleEntries(conditionBundle, "Condition")) {
    const codings = (c.code && c.code.coding) || [];
    for (const cd of codings) {
      const sys = (cd.system || "").toLowerCase();
      const code = cd.code || "";
      if (sys.includes("icd-10") && HF_ICD10.test(code)) codes.push(`ICD10:${code}`);
      if (sys.includes("snomed") && HF_SNOMED_HF.has(code)) codes.push(`SNOMED:${code}`);
    }
  }
  return codes;
}

function cardiacHistoryCodes(conditionBundle) {
  // Surrogate cardiac flags when no I50 is present (sandbox is sparse on HFrEF).
  const flags = [];
  for (const c of bundleEntries(conditionBundle, "Condition")) {
    const codings = (c.code && c.code.coding) || [];
    for (const cd of codings) {
      const sys = (cd.system || "").toLowerCase();
      const code = cd.code || "";
      if (sys.includes("icd-10") && /^I(2[0-5]|51)/.test(code)) {
        flags.push(`ICD10:${code} (${cd.display || ""})`.trim());
      }
    }
  }
  return Array.from(new Set(flags));
}

function summarizeLvef(...obsBundles) {
  let count = 0;
  let latest = null; // { date, value, unit }
  for (const bundle of obsBundles) {
    for (const o of bundleEntries(bundle, "Observation")) {
      count++;
      const dt = o.effectiveDateTime || o.issued || (o.effectivePeriod && o.effectivePeriod.start);
      const v = o.valueQuantity ? `${o.valueQuantity.value}${o.valueQuantity.unit || ""}` : (o.valueString || "");
      if (!latest || (dt && dt > (latest.date || ""))) latest = { date: dt || "?", value: v };
    }
  }
  return { count, latest };
}

function patientName(p) {
  if (!p || !Array.isArray(p.name) || !p.name[0]) return "(unknown)";
  const n = p.name[0];
  const given = Array.isArray(n.given) ? n.given.join(" ") : "";
  return `${given} ${n.family || ""}`.trim() || "(unknown)";
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log("=== Epic FHIR R4 sandbox probe — Kairos Phase 1 ===");
  console.log(`Run at: ${new Date().toISOString()}`);
  console.log(`Endpoint: ${FHIR_BASE}\n`);

  const { clientId, privateKey } = loadCredentials();
  console.log(`client_id: ${clientId}`);

  console.log("\n[1/3] Exchanging JWT for access token…");
  const tok = await getAccessToken(clientId, privateKey);
  const expiresAt = new Date(Date.now() + (tok.expires_in || 0) * 1000);
  console.log(`  ✓ access_token acquired (expires_in=${tok.expires_in}s, scope=${tok.scope || "n/a"})`);
  console.log(`  ✓ token_type=${tok.token_type}, expires_at≈${expiresAt.toISOString()}`);

  if (!fs.existsSync(FIXTURES_DIR)) fs.mkdirSync(FIXTURES_DIR, { recursive: true });

  console.log(`\n[2/3] Probing ${PATIENTS.length} patients…\n`);
  const summaries = [];

  for (const pat of PATIENTS) {
    const queries = patientQueries(pat.id);
    const dump = {
      _meta: {
        fetched_at: new Date().toISOString(),
        patient_id: pat.id,
        patient_name: pat.name,
        endpoint: FHIR_BASE,
      },
    };

    // Patient first — if 404, skip the rest.
    const patientRes = await fhirFetch(tok.access_token, queries.Patient);
    if (patientRes.status === 404) {
      console.log(`  SKIP ${pat.name} (${pat.id}): Patient 404`);
      summaries.push({ ...pat, accessible: false, reason: "404" });
      continue;
    }
    if (!patientRes.ok) {
      console.log(`  SKIP ${pat.name} (${pat.id}): Patient HTTP ${patientRes.status}`);
      summaries.push({ ...pat, accessible: false, reason: `HTTP ${patientRes.status}` });
      continue;
    }
    dump.Patient = patientRes.body;

    // Run the rest in sequence (sandbox is rate-sensitive, keep it gentle).
    const otherKeys = Object.keys(queries).filter(k => k !== "Patient");
    for (const key of otherKeys) {
      const r = await fhirFetch(tok.access_token, queries[key]);
      dump[key] = r.body;
    }

    const hfCodes = detectHfCodes(dump.Condition);
    const cardiacFlags = cardiacHistoryCodes(dump.Condition);
    const activeMedCount = bundleEntries(dump.MedicationRequest, "MedicationRequest").length;
    const lvef = summarizeLvef(dump.Observation_LVEF, dump.Observation_LVSF);
    const allergyCount = bundleEntries(dump.AllergyIntolerance, "AllergyIntolerance").length;
    const resolvedName = patientName(dump.Patient) || pat.name;

    const lvefStr = lvef.count
      ? `${lvef.count} (latest=${lvef.latest ? `${lvef.latest.value} @ ${lvef.latest.date}` : "?"})`
      : "0";
    const cardiacStr = cardiacFlags.length ? ` cardiac_hx=[${cardiacFlags.join("; ")}]` : "";
    const line = `PATIENT ${resolvedName} ${pat.id}: HF_conditions=${hfCodes.length} (codes: [${hfCodes.join(", ")}]), active_meds=${activeMedCount}, LVEF_observations=${lvefStr}, allergies=${allergyCount}${cardiacStr}`;
    console.log("  " + line);

    summaries.push({
      ...pat,
      resolvedName,
      accessible: true,
      hfCodes,
      cardiacFlags,
      activeMedCount,
      lvefCount: lvef.count,
      lvefLatest: lvef.latest,
      allergyCount,
    });

    const slug = pat.name.split(/\s+/)[0].toLowerCase();
    const outPath = path.join(FIXTURES_DIR, `sandbox-${slug}.json`);
    fs.writeFileSync(outPath, JSON.stringify(dump, null, 2), "utf8");
  }

  console.log(`\n[3/3] Wrote fixtures to ${FIXTURES_DIR}`);
  console.log(`Done. ${summaries.filter(s => s.accessible).length}/${PATIENTS.length} patients accessible.`);
}

main().catch(err => {
  console.error("\n[FAILED]", err && err.stack || err);
  process.exit(1);
});
