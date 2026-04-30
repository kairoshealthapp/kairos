// One-shot name-scrub for the 4/29 shift files.
// Reads from C:/Users/kents/Downloads/files/, writes scrubbed copies to C:/Users/kents/kairos/docs/.
// CONTEXT.md and ADDENDUM-04-28.md are copied unchanged (already scrubbed in a prior session).
//
// RULE: CANONICAL_FAKES (names already used as fakes in CONTEXT.md / ADDENDUM-04-28.md)
// are LEFT AS-IS in the shift files. They are referential continuations of the same
// fake persons, not new collisions. Only first-name additions paired with a
// CANONICAL_FAKE surname (e.g., "Curtis Morrison MD") get partially scrubbed —
// the first name is replaced, the canonical surname is preserved.

const fs = require('fs');
const path = require('path');

const SRC = 'C:/Users/kents/Downloads/files';
const DST = 'C:/Users/kents/kairos/docs';

// Names already used as fakes in CONTEXT.md / ADDENDUM-04-28.md.
// These are LEFT AS-IS where they appear in shift files (per Brandon's correction).
const CANONICAL_FAKES = new Set([
  'Halbrook','Besemer','Wood','Czeschin','Phillips','Frazier','Vrabel',
  'Ballard','Ballout','Morrison','Virk','Anita','Sterne','Brandon','Mira',
  'Whitfield','Sinks',
]);

// Full-name and multi-token patterns — applied FIRST, longest-first.
// Each entry is matched as whole-word (\b...\b), case-sensitive.
//
// Patterns paired with a CANONICAL_FAKE surname keep that surname unchanged:
//   - "Steve R Ballard, NP" → "Roland P Ballard, NP"   (Ballard preserved)
//   - "Curtis Morrison"     → "Donovan Morrison"        (Morrison preserved)
const FULL_NAME_MAP = [
  // Ballard variants — preserve "Ballard" (CANONICAL_FAKE), only scrub the
  // newly-introduced first/middle initials ("Steve R").
  { from: 'Steve R Ballard, NP',     to: 'Roland P Ballard, NP' },
  { from: 'Steve R Ballard',         to: 'Roland P Ballard' },

  // Brown variants
  { from: 'Brown, Linda S',          to: 'Vanstone, Carol N' },
  { from: 'Linda S Brown',           to: 'Carol N Vanstone' },

  // Patient proxy
  { from: 'Bethany Leah Boultes',    to: 'Tamara Joy Aldington' },

  // Clinic / front-desk staff
  { from: 'Tracy Durrell',           to: 'Adelaide Crowley' },
  { from: 'Maureen Rise',            to: 'Felicity Ashbrook' },
  { from: 'Elizabeth Curtis',        to: 'Beatrix Kingsway' },

  // PHS / outside staff
  { from: 'Lauren Neece',            to: 'Genevieve Strathmore' },
  { from: 'Elizabeth Oyadomari',     to: 'Marielle Tannenbaum' },
  { from: 'Tami Smith',              to: 'Leona Petrov' },
  { from: 'Jenny Duncan',            to: 'Phoebe Larkspur' },
  { from: 'Jordan M Priest',         to: 'Adler J Townsend' },

  // Echo reader — "Morrison" is CANONICAL_FAKE, preserve it. Only scrub the
  // newly-introduced first name "Curtis".
  { from: 'Curtis Morrison',         to: 'Donovan Morrison' },

  // Referral directory — full names first so the surname-only pass doesn't double-rename
  { from: 'Moore Glenn',             to: 'Reardon Wexford' },
  { from: 'Jonas Cooper',            to: 'Jasper Hennessey' },
  { from: 'Patel Saba',              to: 'Lakshmi Vance' },
  { from: 'Indrajeet Mahata',        to: 'Pranav Tandon' },
  { from: 'Shang-Chiun Lee',         to: 'Wei-Lin Tao' },
  { from: 'Brian Seeck',             to: 'Garrett Pinwell' },
  { from: 'Christopher Bauer',       to: 'Damian Holcrest' },
  { from: 'John Brian Garner',       to: 'Marcus Selwyn Trent' },
  { from: 'Michael Shapiro',         to: 'Conrad Quayle' },
];

// Surname-only patterns — applied SECOND.
// Excludes any name in CANONICAL_FAKES (those are referential and stay).
const SURNAME_MAP = [
  // Patients — NEW (Halbrook excluded; it's a CANONICAL_FAKE)
  { from: 'Boultes',     to: 'Aldington' },
  { from: 'Daech',       to: 'Brexley' },
  { from: 'MacMillan',   to: 'Calderwood' },
  { from: 'McGuirk',     to: 'Drennan' },
  { from: 'Walter',      to: 'Esselbach' },
  { from: 'Bittner',     to: 'Felgenhauer' },
  { from: 'Mendoza',     to: 'Gallichan' },
  { from: 'Miller',      to: 'Holcombe' },
  { from: 'White',       to: 'Inkpen' },
  { from: 'Wilson',      to: 'Jorgan' },
  { from: 'Britton',     to: 'Karstens' },
  { from: 'Patton',      to: 'Lyttleton' },
  { from: 'Sturges',     to: 'Maundrell' },
  { from: 'Forshey',     to: 'Norreys' },
  { from: 'Pogue',       to: 'Oxenford' },
  { from: 'Reiner',      to: 'Quennell' },
  { from: 'Sellman',     to: 'Ravensdale' },
  { from: 'Sharp',       to: 'Stockbridge' },
  { from: 'Bailey',      to: 'Trumble' },
  { from: 'Davis',       to: 'Underwell' },
  { from: 'Brown',       to: 'Vanstone' },
  { from: 'Ramey',       to: 'Wexbury' },

  // Clinicians (surname-only) — NEW
  // Ballard NOT here (CANONICAL_FAKE). Morrison NOT here (CANONICAL_FAKE).
  { from: 'Eftheriou',   to: 'Marchetti' },
  { from: 'Cuculich',    to: 'Tregarthen' },
  { from: 'Faddis',      to: 'Vellacott' },
  { from: 'Cooper',      to: 'Birchington' },   // remaining Cooper (Wash U) after Jonas Cooper consumed
  { from: 'Sanchez',     to: 'Pelletier' },
  // Standalone "Curtis" — catches shorthand references to "Elizabeth Curtis"
  // (e.g., "front desk Curtis"). Runs AFTER both full-name passes have
  // consumed "Elizabeth Curtis" and "Curtis Morrison".
  { from: 'Curtis',      to: 'Kingsway' },

  // Eftheriou shorthand — "Dr. E" → "Dr. M"
  { from: 'Dr\\. E',     to: 'Dr. M' },
];

// Sanity check: no chosen fake collides with CANONICAL_FAKES.
// (Surname tokens in fake values like "Donovan Morrison" intentionally include
// "Morrison" — that's the canonical-preservation pattern. Skip the check for
// fakes that explicitly preserve a canonical surname.)
const FAKES_THAT_PRESERVE_CANONICAL = new Set([
  'Roland P Ballard, NP',
  'Roland P Ballard',
  'Donovan Morrison',
]);

function checkFakes() {
  const all = [...FULL_NAME_MAP, ...SURNAME_MAP];
  const issues = [];
  for (const { to } of all) {
    if (FAKES_THAT_PRESERVE_CANONICAL.has(to)) continue;
    for (const tok of to.split(/[\s,.\-]+/)) {
      if (tok && CANONICAL_FAKES.has(tok)) {
        issues.push(`fake "${to}" contains CANONICAL_FAKE token "${tok}"`);
      }
    }
  }
  if (issues.length) {
    console.error('CANONICAL_FAKES collision:');
    issues.forEach(i => console.error(' -', i));
    process.exit(1);
  }
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function applyReplacements(text, mappings) {
  let out = text;
  for (const { from, to } of mappings) {
    const isRegex = /\\\./.test(from);
    const pattern = isRegex ? from : escapeRegex(from);
    const re = new RegExp(`\\b${pattern}\\b`, 'g');
    out = out.replace(re, to);
  }
  return out;
}

function scrub(text) {
  let out = applyReplacements(text, FULL_NAME_MAP);
  out = applyReplacements(out, SURNAME_MAP);
  return out;
}

function copyUnchanged(srcName, dstName) {
  fs.copyFileSync(path.join(SRC, srcName), path.join(DST, dstName));
  console.log(`copied unchanged: ${dstName}`);
}

function scrubFile(srcName, dstName) {
  const text = fs.readFileSync(path.join(SRC, srcName), 'utf8');
  const scrubbed = scrub(text);
  fs.writeFileSync(path.join(DST, dstName), scrubbed, 'utf8');
  console.log(`scrubbed: ${dstName} (${text.length} → ${scrubbed.length} bytes)`);
}

function verifyNoOriginals(dstName, originals) {
  const text = fs.readFileSync(path.join(DST, dstName), 'utf8');
  const hits = [];
  for (const o of originals) {
    const isRegex = /\\\./.test(o);
    const pattern = isRegex ? o : escapeRegex(o);
    const re = new RegExp(`\\b${pattern}\\b`, 'g');
    const matches = text.match(re);
    if (matches && matches.length) hits.push(`${o} (${matches.length})`);
  }
  return hits;
}

function main() {
  checkFakes();

  if (!fs.existsSync(DST)) fs.mkdirSync(DST, { recursive: true });

  copyUnchanged('KAIROS-CONTEXT.md',                  'KAIROS-CONTEXT.md');
  copyUnchanged('KAIROS-CONTEXT-ADDENDUM-2026-04-28.md', 'KAIROS-CONTEXT-ADDENDUM-2026-04-28.md');
  scrubFile('KAIROS-SESSION-2026-04-29.md',           'KAIROS-SESSION-2026-04-29.md');
  scrubFile('KAIROS-SESSION-2026-04-29-AFTERNOON.md', 'KAIROS-SESSION-2026-04-29-AFTERNOON.md');
  scrubFile('KAIROS-SESSION-2026-04-29-EVENING.md',   'KAIROS-SESSION-2026-04-29-EVENING.md');

  const allOriginals = [...FULL_NAME_MAP, ...SURNAME_MAP].map(m => m.from);
  const shiftFiles = [
    'KAIROS-SESSION-2026-04-29.md',
    'KAIROS-SESSION-2026-04-29-AFTERNOON.md',
    'KAIROS-SESSION-2026-04-29-EVENING.md',
  ];
  let anyHit = false;
  for (const f of shiftFiles) {
    const hits = verifyNoOriginals(f, allOriginals);
    if (hits.length) {
      anyHit = true;
      console.error(`HITS in ${f}:`, hits.join(', '));
    } else {
      console.log(`verified clean: ${f}`);
    }
  }
  if (anyHit) process.exit(2);

  console.log('scrub complete');
}

main();
