#!/usr/bin/env node
/* eslint-disable no-console */

// JWT structural diagnostic for Epic Backend Services (v8 Phase 1).
//
// Generates a JWT using the same logic as firekraker-monorepo/clinai/lib/epic-auth.js
// (the source of truth for the kairos-auth Worker JWKS), decodes header/payload,
// and verifies every field against the Epic Backend Services spec.
//
// Also confirms the public JWKS endpoint at auth.firekraker.net is reachable
// from outside our network and contains the expected key.
//
// Does NOT call Epic's token endpoint. Run separately when structure is verified.

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

// --- Expected values per Epic Backend Services spec + our app registration ---
const EXPECTED_CLIENT_ID = "a85de553-5013-47e8-9f3b-f3c797176f81";
const EXPECTED_AUDIENCE  = "https://fhir.epic.com/interconnect-fhir-oauth/oauth2/token";
const EXPECTED_KID       = "clinai-key-1";
const EXPECTED_ALG       = "RS384";
const EXPECTED_TYP       = "JWT";
const JWKS_URL           = "https://auth.firekraker.net/.well-known/jwks.json";
const PRIVATE_KEY_PATH   = path.resolve("C:/Users/kents/firekraker-monorepo/.env.master");

// --- Tiny output helpers ----------------------------------------------------
const FAILS = [];
function pass(label, value) {
  console.log(`  PASS  ${label}: ${value}`);
}
function fail(label, value, expected) {
  FAILS.push(label);
  console.log(`  FAIL  ${label}: got ${JSON.stringify(value)} | expected ${JSON.stringify(expected)}`);
}
function check(label, actual, expected) {
  if (actual === expected) pass(label, JSON.stringify(actual));
  else fail(label, actual, expected);
}
function section(title) {
  console.log(`\n=== ${title} ===`);
}

// --- base64url helpers ------------------------------------------------------
function b64url(buf) {
  return Buffer.from(buf).toString("base64").replace(/=+$/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
function b64urlDecode(str) {
  const pad = str.length % 4 === 0 ? "" : "=".repeat(4 - (str.length % 4));
  return Buffer.from(str.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64");
}

// --- Read private key from monorepo .env.master ------------------------------
function loadPrivateKeyPem() {
  const text = fs.readFileSync(PRIVATE_KEY_PATH, "utf8");
  const line = text.split(/\r?\n/).find(l => l.startsWith("CLINAI_PRIVATE_KEY_PEM="));
  if (!line) throw new Error("CLINAI_PRIVATE_KEY_PEM not found in .env.master");
  let val = line.slice("CLINAI_PRIVATE_KEY_PEM=".length).trim();
  if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
  return val.includes("\\n") ? val.replace(/\\n/g, "\n") : val;
}

// --- Build + sign JWT (same shape as clinai/lib/epic-auth.js) ----------------
function buildJwt(privateKeyPem, clientId, audience) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: EXPECTED_ALG, typ: EXPECTED_TYP, kid: EXPECTED_KID };
  const payload = {
    iss: clientId,
    sub: clientId,
    aud: audience,
    exp: now + 240,
    nbf: now,
    iat: now,
    jti: crypto.randomUUID(),
  };
  const headerB64  = b64url(JSON.stringify(header));
  const payloadB64 = b64url(JSON.stringify(payload));
  const signingInput = `${headerB64}.${payloadB64}`;
  // RS384 = RSASSA-PKCS1-v1_5 with SHA-384 — node's default RSA padding for crypto.sign.
  const signature = crypto.sign("sha384", Buffer.from(signingInput), privateKeyPem);
  const jwt = `${signingInput}.${b64url(signature)}`;
  return { jwt, header, payload };
}

// --- Decode and verify JWT structure -----------------------------------------
function verifyJwtStructure(jwt) {
  section("JWT STRUCTURE");
  const parts = jwt.split(".");
  if (parts.length !== 3) {
    fail("token shape", parts.length, 3);
    return;
  }
  pass("token shape", "3 parts (header.payload.signature)");

  const header  = JSON.parse(b64urlDecode(parts[0]).toString("utf8"));
  const payload = JSON.parse(b64urlDecode(parts[1]).toString("utf8"));

  console.log("\n  Decoded header:  " + JSON.stringify(header));
  console.log("  Decoded payload: " + JSON.stringify(payload));

  section("HEADER CHECKS");
  check("alg",         header.alg, EXPECTED_ALG);
  check("kid",         header.kid, EXPECTED_KID);
  check("typ",         header.typ, EXPECTED_TYP);

  section("PAYLOAD CHECKS");
  check("iss",         payload.iss, EXPECTED_CLIENT_ID);
  check("sub",         payload.sub, EXPECTED_CLIENT_ID);

  // sub must equal iss (Epic Backend Services explicit requirement)
  if (payload.sub === payload.iss) pass("sub === iss", "true");
  else fail("sub === iss", `sub=${payload.sub}, iss=${payload.iss}`, "equal");

  // aud — exact match, no whitespace, no trailing slash
  if (payload.aud === EXPECTED_AUDIENCE) {
    pass("aud (exact match)", JSON.stringify(payload.aud));
  } else {
    fail("aud (exact match)", payload.aud, EXPECTED_AUDIENCE);
  }
  if (typeof payload.aud === "string" && payload.aud === payload.aud.trim()) {
    pass("aud (no whitespace)", "clean");
  } else {
    fail("aud (no whitespace)", payload.aud, "trimmed");
  }
  if (typeof payload.aud === "string" && !payload.aud.endsWith("/")) {
    pass("aud (no trailing slash)", "clean");
  } else {
    fail("aud (no trailing slash)", payload.aud, "no trailing /");
  }

  // exp ≤ iat + 300
  const lifetime = payload.exp - payload.iat;
  if (lifetime > 0 && lifetime <= 300) {
    pass("exp - iat ≤ 300s", `${lifetime}s`);
  } else {
    fail("exp - iat ≤ 300s", `${lifetime}s`, "≤ 300s");
  }

  // jti present and looks like a unique token
  if (typeof payload.jti === "string" && payload.jti.length >= 16) {
    pass("jti present", payload.jti);
  } else {
    fail("jti present", payload.jti, "non-empty unique string");
  }

  // jti uniqueness sanity — generate two and confirm difference
  const a = crypto.randomUUID(), b = crypto.randomUUID();
  if (a !== b) pass("jti generator unique", `${a} != ${b}`);
  else fail("jti generator unique", "duplicate", "unique");
}

// --- External JWKS verification ---------------------------------------------
async function verifyJwksExternal() {
  section("JWKS EXTERNAL REACHABILITY");
  console.log(`  GET ${JWKS_URL}`);
  let res;
  try {
    res = await fetch(JWKS_URL, {
      cache: "no-store",
      headers: { Accept: "application/json", "User-Agent": "kairos-jwt-diagnostic/1.0" },
    });
  } catch (err) {
    fail("network fetch", err && err.message, "successful HTTPS response");
    return;
  }

  // HTTP 200
  if (res.status === 200) pass("HTTP status", "200");
  else fail("HTTP status", res.status, 200);

  // Confirm it's served by Cloudflare (proves we hit the public edge, not anything local)
  const cfRay  = res.headers.get("cf-ray");
  const server = res.headers.get("server");
  if (cfRay && /cloudflare/i.test(server || "")) {
    pass("served by Cloudflare edge (public)", `cf-ray=${cfRay}, server=${server}`);
  } else {
    fail("served by Cloudflare edge (public)", `cf-ray=${cfRay}, server=${server}`, "cloudflare-served response");
  }

  const text = await res.text();
  let jwks;
  try {
    jwks = JSON.parse(text);
    pass("body is valid JSON", `${text.length} bytes`);
  } catch (err) {
    fail("body is valid JSON", err && err.message, "parseable JSON");
    console.log("  body: " + text.slice(0, 400));
    return;
  }

  if (Array.isArray(jwks.keys) && jwks.keys.length > 0) {
    pass("JWKS shape", `keys[] with ${jwks.keys.length} entry`);
  } else {
    fail("JWKS shape", JSON.stringify(jwks), "{ keys: [...] }");
    return;
  }

  const key = jwks.keys.find(k => k && k.kid === EXPECTED_KID);
  if (key) pass(`key with kid="${EXPECTED_KID}"`, "present");
  else { fail(`key with kid="${EXPECTED_KID}"`, jwks.keys.map(k => k && k.kid), EXPECTED_KID); return; }

  check("key.alg", key.alg, EXPECTED_ALG);
  check("key.kty", key.kty, "RSA");
  check("key.use", key.use, "sig");
  if (typeof key.n === "string" && key.n.length > 0) pass("key.n present", `${key.n.length} chars`);
  else fail("key.n present", key.n, "non-empty modulus");
  if (typeof key.e === "string" && key.e.length > 0) pass("key.e present", key.e);
  else fail("key.e present", key.e, "non-empty exponent");
}

// --- Cross-check: signed JWT's kid resolves against the live JWKS ------------
async function crossCheckKidAgainstJwks(header) {
  section("CROSS-CHECK: JWT kid resolves in live JWKS");
  try {
    const res = await fetch(JWKS_URL, { cache: "no-store" });
    const jwks = await res.json();
    const found = (jwks.keys || []).some(k => k && k.kid === header.kid && k.alg === header.alg);
    if (found) pass("kid+alg pair found in JWKS", `${header.kid} / ${header.alg}`);
    else fail("kid+alg pair found in JWKS", `${header.kid} / ${header.alg}`, "match in keys[]");
  } catch (err) {
    fail("cross-check fetch", err && err.message, "successful");
  }
}

// --- Main --------------------------------------------------------------------
async function main() {
  console.log("Kairos v8 JWT structural diagnostic");
  console.log("===================================");
  console.log(`time:      ${new Date().toISOString()}`);
  console.log(`client_id: ${EXPECTED_CLIENT_ID}`);
  console.log(`token_url: ${EXPECTED_AUDIENCE}`);
  console.log(`jwks_url:  ${JWKS_URL}`);

  let privateKeyPem;
  try {
    privateKeyPem = loadPrivateKeyPem();
    pass("private key loaded", `${privateKeyPem.length} chars from .env.master`);
  } catch (err) {
    fail("private key load", err.message, "PEM string");
    summarize();
    process.exit(1);
  }

  const { jwt, header } = buildJwt(privateKeyPem, EXPECTED_CLIENT_ID, EXPECTED_AUDIENCE);
  console.log("\nGenerated client_assertion (do NOT POST yet):");
  console.log("  " + jwt);

  verifyJwtStructure(jwt);
  await verifyJwksExternal();
  await crossCheckKidAgainstJwks(header);

  summarize();
}

function summarize() {
  section("SUMMARY");
  if (FAILS.length === 0) {
    console.log("  ALL CHECKS PASSED — JWT structure and JWKS endpoint are spec-compliant.");
    console.log("  (Did NOT call Epic token endpoint. Run probe separately when authorized.)");
    process.exitCode = 0;
  } else {
    console.log(`  ${FAILS.length} FAIL(s):`);
    for (const f of FAILS) console.log(`    - ${f}`);
    console.log("\n  STOP. Do not run the Epic probe. Report failures and confirm before fixing.");
    process.exitCode = 2;
  }
}

main().catch(err => {
  console.error("UNCAUGHT:", err);
  process.exitCode = 1;
});
