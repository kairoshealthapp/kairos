#!/usr/bin/env node
/**
 * Epic FHIR R4 Sandbox — Capability Test Harness
 *
 * Discovers what reads/writes are possible against Epic's public sandbox.
 * Uses only built-in Node modules. Writes a markdown report at
 * sandbox/capability-report.md.
 *
 * Usage:
 *   node sandbox/fhir-capability-test.js
 *
 * Optional env vars:
 *   EPIC_PRIVATE_KEY_PATH   path to PEM private key for JWT signing
 *   EPIC_CLIENT_ID          override client id
 *   EPIC_TEST_PATIENT       override default test patient id
 */

const https = require('https');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

// ---------- CONFIG ----------
const CONFIG = {
  clientId: process.env.EPIC_CLIENT_ID || 'a85de553-5013-47e8-9f3b-f3c797176f81',
  kid: process.env.EPIC_KID || 'clinai-key-1',
  baseUrl: 'https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4',
  tokenUrl: 'https://fhir.epic.com/interconnect-fhir-oauth/oauth2/token',
  jwksUrl: 'https://auth.firekraker.net/.well-known/jwks.json',
  privateKeyPath: process.env.EPIC_PRIVATE_KEY_PATH || null,
  // Famous Epic sandbox test patient FHIR IDs
  testPatients: [
    process.env.EPIC_TEST_PATIENT,
    'Tbt3KuCY0B5PSrJvCu2j-PlK.aiHdq1rKTY6pBFfBs8',
    'erXuFYUfucBZaryVksYEcMg3', // Camila Lopez
    'eq081-VQEgP8drUUqCWzHfw3', // Derrick Lin
    'eAB3mDIBBcyUKviyzrxsnAw3', // Desiree Lambridge
  ].filter(Boolean),
};

const REPORT_PATH = path.join(__dirname, 'capability-report.md');

// Resources we want to probe with GET search
const READ_RESOURCES = [
  ['Patient',             'Demographics, identifiers'],
  ['Condition',           'Problem list'],
  ['MedicationRequest',   'Active medications'],
  ['Observation',         'Labs, vitals'],
  ['DiagnosticReport',    'Lab/imaging reports'],
  ['DocumentReference',   'Clinical notes / Media tab'],
  ['Communication',       'MyChart messages'],
  ['ServiceRequest',      'Active orders, referrals'],
  ['AllergyIntolerance',  'Allergies'],
  ['Encounter',           'Visit history'],
  ['Procedure',           'Procedure history'],
  ['CarePlan',            'Care plans'],
  ['CareTeam',            'Care team members'],
  ['Coverage',            'Insurance info'],
  ['Practitioner',        'Provider directory'],
  ['PractitionerRole',    'Provider roles per org'],
  ['Organization',        'Facilities, departments'],
  ['Location',            'Physical locations'],
  ['Binary',              'Raw doc bytes (PDFs/images)'],
];

// ---------- LOGGING ----------
const log = [];
function emit(line) {
  console.log(line);
  log.push(line);
}
function section(title) {
  emit('');
  emit('='.repeat(72));
  emit(title);
  emit('='.repeat(72));
}

// ---------- HTTP ----------
function request(method, urlString, { headers = {}, body = null } = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlString);
    const opts = {
      method,
      hostname: u.hostname,
      port: u.port || 443,
      path: u.pathname + u.search,
      headers: {
        'Accept': 'application/fhir+json',
        'User-Agent': 'kairos-fhir-capability-test/1.0',
        ...headers,
      },
    };
    if (body) {
      opts.headers['Content-Length'] = Buffer.byteLength(body);
    }
    const req = https.request(opts, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf8');
        let json = null;
        try { json = raw ? JSON.parse(raw) : null; } catch { /* not JSON */ }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          raw,
          json,
        });
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

// ---------- JWT (RS384, Epic's required alg) ----------
function base64url(buf) {
  return Buffer.from(buf)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function buildClientAssertion(privateKeyPem) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS384', typ: 'JWT', kid: CONFIG.kid };
  const payload = {
    iss: CONFIG.clientId,
    sub: CONFIG.clientId,
    aud: CONFIG.tokenUrl,
    jti: crypto.randomUUID(),
    iat: now,
    exp: now + 240, // <= 5 min per Epic
  };
  const headerB64 = base64url(JSON.stringify(header));
  const payloadB64 = base64url(JSON.stringify(payload));
  const signingInput = `${headerB64}.${payloadB64}`;
  const signer = crypto.createSign('RSA-SHA384');
  signer.update(signingInput);
  signer.end();
  const signature = signer.sign(privateKeyPem);
  return `${signingInput}.${base64url(signature)}`;
}

async function obtainAccessToken(privateKeyPem) {
  const assertion = buildClientAssertion(privateKeyPem);
  const formBody = new URLSearchParams({
    grant_type: 'client_credentials',
    client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
    client_assertion: assertion,
  }).toString();
  return request('POST', CONFIG.tokenUrl, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    body: formBody,
  });
}

// ---------- TEST STEPS ----------
async function fetchMetadata() {
  section('STEP 2: CapabilityStatement (no auth required)');
  const url = `${CONFIG.baseUrl}/metadata`;
  emit(`GET ${url}`);
  const res = await request('GET', url);
  emit(`  -> HTTP ${res.status}`);
  if (res.status !== 200 || !res.json) {
    emit('  metadata fetch failed; raw body (first 500 chars):');
    emit('  ' + (res.raw || '').slice(0, 500));
    return null;
  }
  emit(`  fhirVersion: ${res.json.fhirVersion || '?'}`);
  emit(`  software:    ${res.json.software?.name || '?'} ${res.json.software?.version || ''}`);
  return res.json;
}

function summarizeMetadata(cs) {
  if (!cs) return { resources: [], rows: [] };
  const restEntry = (cs.rest || [])[0] || {};
  const resources = restEntry.resource || [];
  const rows = resources.map((r) => {
    const interactions = (r.interaction || []).map((i) => i.code).sort();
    const searchParams = (r.searchParam || []).map((p) => p.name).sort();
    return {
      type: r.type,
      interactions,
      searchParams,
      profile: r.profile || '',
    };
  });
  emit('');
  emit(`CapabilityStatement lists ${rows.length} resource types.`);
  emit('Top-level interactions per resource (first 25):');
  rows.slice(0, 25).forEach((r) => {
    emit(`  ${r.type.padEnd(28)} ${r.interactions.join(', ') || '(none)'}`);
  });
  if (rows.length > 25) emit(`  ... and ${rows.length - 25} more`);
  return { resources, rows };
}

async function runReadTests(token) {
  section('STEP 3: READ TESTS');
  const authHeader = token ? { Authorization: `Bearer ${token}` } : {};
  const results = [];

  // First: try resolving each test patient by direct read
  emit('Trying test patients by direct read:');
  let goodPatientId = null;
  for (const pid of CONFIG.testPatients) {
    const url = `${CONFIG.baseUrl}/Patient/${pid}`;
    const res = await request('GET', url, { headers: authHeader });
    emit(`  ${pid.padEnd(40)} -> HTTP ${res.status}`);
    if (res.status === 200 && res.json) {
      const name = (res.json.name || [])[0] || {};
      emit(`    name: ${(name.given || []).join(' ')} ${name.family || ''}`);
      if (!goodPatientId) goodPatientId = pid;
    }
    results.push({
      resource: 'Patient',
      op: 'read by id',
      id: pid,
      status: res.status,
      note: res.status === 200 ? 'OK' : (res.json?.issue?.[0]?.diagnostics || ''),
    });
  }

  if (!goodPatientId) {
    emit('');
    emit('No test patient resolved — running search-only probes (most will require auth).');
  } else {
    emit('');
    emit(`Using patient context: ${goodPatientId}`);
  }

  // Per-resource search probe
  for (const [resource, desc] of READ_RESOURCES) {
    let url;
    if (resource === 'Patient') {
      url = `${CONFIG.baseUrl}/Patient?family=Lopez`;
    } else if (resource === 'Practitioner' || resource === 'Organization' || resource === 'Location' || resource === 'PractitionerRole') {
      url = `${CONFIG.baseUrl}/${resource}?_count=5`;
    } else if (resource === 'Binary') {
      // Binary is read-by-id only; skip search
      url = `${CONFIG.baseUrl}/Binary/eABC-not-real`;
    } else if (goodPatientId) {
      url = `${CONFIG.baseUrl}/${resource}?patient=${goodPatientId}&_count=5`;
    } else {
      url = `${CONFIG.baseUrl}/${resource}?_count=5`;
    }
    const res = await request('GET', url, { headers: authHeader });
    let count = '';
    let sampleFields = '';
    if (res.status === 200 && res.json) {
      if (res.json.resourceType === 'Bundle') {
        count = `entries=${res.json.total ?? (res.json.entry || []).length}`;
        const first = (res.json.entry || [])[0]?.resource;
        if (first) sampleFields = Object.keys(first).slice(0, 8).join(',');
      } else {
        count = `single ${res.json.resourceType || '?'}`;
        sampleFields = Object.keys(res.json).slice(0, 8).join(',');
      }
    }
    const diag = res.json?.issue?.[0]?.diagnostics || res.json?.issue?.[0]?.details?.text || '';
    emit(`  ${resource.padEnd(22)} HTTP ${res.status}  ${count}  ${sampleFields ? '['+sampleFields+']' : ''}  ${diag ? '— '+diag.slice(0,120) : ''}`);
    results.push({
      resource,
      op: 'search',
      url,
      status: res.status,
      note: count || diag || '',
      sampleFields,
      desc,
    });
  }

  return { results, patientId: goodPatientId };
}

async function runWriteTests(token, patientId) {
  section('STEP 4: WRITE TESTS');
  if (!token) {
    emit('No access token — skipping writes (every POST without auth = 401).');
    return [];
  }
  const authHeader = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/fhir+json',
  };
  const subject = patientId ? { reference: `Patient/${patientId}` } : { reference: 'Patient/erXuFYUfucBZaryVksYEcMg3' };

  const writes = [
    {
      label: 'DocumentReference (clinical note)',
      method: 'POST',
      url: `${CONFIG.baseUrl}/DocumentReference`,
      body: {
        resourceType: 'DocumentReference',
        status: 'current',
        type: { coding: [{ system: 'http://loinc.org', code: '11506-3', display: 'Progress note' }] },
        subject,
        content: [{
          attachment: {
            contentType: 'text/plain',
            data: Buffer.from('Kairos sandbox capability test — ignore.').toString('base64'),
          },
        }],
      },
    },
    {
      label: 'Communication (MyChart message)',
      method: 'POST',
      url: `${CONFIG.baseUrl}/Communication`,
      body: {
        resourceType: 'Communication',
        status: 'completed',
        subject,
        sent: new Date().toISOString(),
        payload: [{ contentString: 'Kairos sandbox test message — ignore.' }],
      },
    },
    {
      label: 'MedicationRequest (med order)',
      method: 'POST',
      url: `${CONFIG.baseUrl}/MedicationRequest`,
      body: {
        resourceType: 'MedicationRequest',
        status: 'active',
        intent: 'order',
        subject,
        medicationCodeableConcept: {
          coding: [{ system: 'http://www.nlm.nih.gov/research/umls/rxnorm', code: '197361', display: 'Atenolol 50 MG Oral Tablet' }],
        },
      },
    },
    {
      label: 'ServiceRequest (referral)',
      method: 'POST',
      url: `${CONFIG.baseUrl}/ServiceRequest`,
      body: {
        resourceType: 'ServiceRequest',
        status: 'active',
        intent: 'order',
        category: [{ coding: [{ system: 'http://snomed.info/sct', code: '306206005', display: 'Referral to service' }] }],
        code: { coding: [{ system: 'http://snomed.info/sct', code: '103696004', display: 'Patient referral to specialist' }] },
        subject,
      },
    },
    {
      label: 'Encounter (Anticoag-Warfarin Visit type 1001)',
      method: 'POST',
      url: `${CONFIG.baseUrl}/Encounter`,
      body: {
        resourceType: 'Encounter',
        status: 'planned',
        class: { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: 'AMB', display: 'ambulatory' },
        type: [{ coding: [{ system: 'urn:oid:1.2.840.114350.1.13.0.1.7.4.737880.5020', code: '1001', display: 'Anticoagulation-Warfarin Visit' }] }],
        subject,
      },
    },
  ];

  const results = [];
  for (const w of writes) {
    const res = await request(w.method, w.url, {
      headers: authHeader,
      body: JSON.stringify(w.body),
    });
    const diag = res.json?.issue?.map(i => i.diagnostics || i.details?.text).filter(Boolean).join(' | ') || '';
    emit(`  ${w.label.padEnd(46)} HTTP ${res.status}  ${diag ? '— '+diag.slice(0,160) : ''}`);
    results.push({ label: w.label, status: res.status, note: diag, location: res.headers?.location || '' });
  }

  // PATCH on Communication (mark Done) — needs an existing id; best-effort
  emit('  Communication PATCH (status change) — skipped: needs existing message id');
  results.push({ label: 'Communication PATCH (mark done)', status: 'skipped', note: 'requires existing message id' });

  return results;
}

// ---------- REPORT ----------
function buildReport({ metadataOk, csRows, readResults, writeResults, authStatus, jwksStatus, patientId }) {
  const lines = [];
  lines.push('# Epic FHIR R4 Sandbox — Capability Report');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push(`Sandbox base: ${CONFIG.baseUrl}`);
  lines.push(`Client ID: ${CONFIG.clientId}`);
  lines.push(`JWKS URL probe: ${jwksStatus}`);
  lines.push(`Auth status: ${authStatus}`);
  lines.push(`Working test patient: ${patientId || '(none resolved)'}`);
  lines.push('');

  lines.push('## CapabilityStatement Summary');
  if (!metadataOk) {
    lines.push('> metadata endpoint did not return a parseable CapabilityStatement.');
  } else {
    lines.push('');
    lines.push('| Resource | Interactions | Search params (sample) |');
    lines.push('|---|---|---|');
    for (const r of csRows) {
      const params = r.searchParams.slice(0, 8).join(', ') + (r.searchParams.length > 8 ? `, +${r.searchParams.length - 8} more` : '');
      lines.push(`| ${r.type} | ${r.interactions.join(', ') || '—'} | ${params || '—'} |`);
    }
  }

  // Bucket results by status
  const bucket = { confirmed: [], blocked: [], notAvailable: [], unknown: [] };
  function classify(item) {
    const s = item.status;
    if (s === 200 || s === 201) bucket.confirmed.push(item);
    else if (s === 401 || s === 403) bucket.blocked.push(item);
    else if (s === 404 || s === 400 || s === 422) bucket.notAvailable.push(item);
    else bucket.unknown.push(item);
  }
  readResults.forEach((r) => classify({ kind: 'READ', label: `${r.resource} ${r.op}`, ...r }));
  writeResults.forEach((w) => classify({ kind: 'WRITE', label: w.label, ...w }));

  function dump(title, arr) {
    lines.push('');
    lines.push(`## ${title}`);
    if (!arr.length) {
      lines.push('_(none)_');
      return;
    }
    lines.push('| Kind | Operation | Status | Notes |');
    lines.push('|---|---|---|---|');
    arr.forEach((it) => {
      const note = (it.note || '').replace(/\|/g, '\\|').slice(0, 200);
      lines.push(`| ${it.kind} | ${it.label} | ${it.status} | ${note} |`);
    });
  }

  dump('CONFIRMED CAPABILITIES (200/201)', bucket.confirmed);
  dump('BLOCKED CAPABILITIES (401/403 — auth/scope required)', bucket.blocked);
  dump('NOT AVAILABLE (400/404/422)', bucket.notAvailable);
  dump('UNKNOWN (other status / network errors)', bucket.unknown);

  lines.push('');
  lines.push('## Raw run log');
  lines.push('```');
  lines.push(...log);
  lines.push('```');
  return lines.join('\n');
}

// ---------- MAIN ----------
(async () => {
  section('STEP 1: AUTH CHECK');
  // 1a. Probe JWKS endpoint
  let jwksStatus = '';
  try {
    const j = await request('GET', CONFIG.jwksUrl);
    jwksStatus = `HTTP ${j.status}` + (j.json?.keys ? ` (${j.json.keys.length} keys)` : '');
    emit(`JWKS probe ${CONFIG.jwksUrl} -> ${jwksStatus}`);
  } catch (e) {
    jwksStatus = `error: ${e.message}`;
    emit(`JWKS probe failed: ${e.message}`);
  }

  // 1b. Look for a private key locally
  let privateKeyPem = null;
  const candidates = [
    CONFIG.privateKeyPath,
    path.join(__dirname, 'private-key.pem'),
    path.join(__dirname, '..', 'secrets', 'epic-private-key.pem'),
    path.join(__dirname, '..', '.secrets', 'epic-private-key.pem'),
    path.join(process.env.USERPROFILE || process.env.HOME || '', '.epic', 'private-key.pem'),
  ].filter(Boolean);
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      privateKeyPem = fs.readFileSync(c, 'utf8');
      emit(`Found private key: ${c}`);
      break;
    }
  }
  if (!privateKeyPem) {
    emit('No local private key found. Searched:');
    candidates.forEach((c) => emit(`  - ${c}`));
    emit('Will run unauthenticated probes only.');
  }

  let token = null;
  let authStatus = 'unauthenticated (no private key locally)';
  if (privateKeyPem) {
    try {
      const tokRes = await obtainAccessToken(privateKeyPem);
      emit(`Token endpoint -> HTTP ${tokRes.status}`);
      if (tokRes.status === 200 && tokRes.json?.access_token) {
        token = tokRes.json.access_token;
        authStatus = `OK (token len=${token.length}, scope=${tokRes.json.scope || '?'}, expires_in=${tokRes.json.expires_in || '?'}s)`;
        emit(`  ${authStatus}`);
      } else {
        authStatus = `failed HTTP ${tokRes.status}: ${(tokRes.raw || '').slice(0, 240)}`;
        emit(`  ${authStatus}`);
      }
    } catch (e) {
      authStatus = `JWT/token error: ${e.message}`;
      emit(`  ${authStatus}`);
    }
  }

  // 2. Metadata
  const cs = await fetchMetadata();
  const { rows: csRows } = summarizeMetadata(cs);

  // 3. Read tests
  const { results: readResults, patientId } = await runReadTests(token);

  // 4. Write tests
  const writeResults = await runWriteTests(token, patientId);

  // 5. Report
  section('STEP 5: WRITING REPORT');
  const report = buildReport({
    metadataOk: !!cs,
    csRows,
    readResults,
    writeResults,
    authStatus,
    jwksStatus,
    patientId,
  });
  fs.writeFileSync(REPORT_PATH, report, 'utf8');
  emit(`Wrote ${REPORT_PATH}`);
})().catch((e) => {
  console.error('FATAL:', e);
  process.exit(1);
});
