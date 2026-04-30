// One-shot name-scrub for the 4/29 shift files.
// Reads from C:/Users/kents/Downloads/files/, writes scrubbed copies to C:/Users/kents/kairos/docs/.
// CONTEXT.md and ADDENDUM-04-28.md are copied unchanged (already scrubbed in a prior session).
//
// RULE: CANONICAL_FAKES (names already used as fakes in CONTEXT.md / ADDENDUM-04-28.md)
// are LEFT AS-IS in the shift files. They are referential continuations of the same
// fake persons, not new collisions. Only first-name additions paired with a
// CANONICAL_FAKE surname (e.g., "Curtis Holvenmark MD") get partially scrubbed —
// the first name is replaced, the canonical surname is preserved.

const fs = require('fs');
const path = require('path');

const SRC = 'C:/Users/kents/Downloads/files';
const DST = 'C:/Users/kents/kairos/docs';

// Names already used as fakes in CONTEXT.md / ADDENDUM-04-28.md.
// These are LEFT AS-IS where they appear in shift files (per Brandon's correction).
const CANONICAL_FAKES = new Set([
  'Halbrook','Besemer','Wood','Czeschin','Strathorne','Frazier','Vrabel',
  'Hardenkvist','Ballout','Holvenmark','Vorhelden','Anita','Sterne','Brandon','Mira',
  'Whitfield','Riverside',
]);

// Full-name and multi-token patterns — applied FIRST, longest-first.
// Each entry is matched as whole-word (\b...\b), case-sensitive.
//
// Patterns paired with a CANONICAL_FAKE surname keep that surname unchanged:
//   - "Roland P Hardenkvist, NP" → "Roland P Hardenkvist, NP"   (Hardenkvist preserved)
//   - "Curtis Holvenmark"     → "Donovan Holvenmark"        (Holvenmark preserved)
const FULL_NAME_MAP = [
  // Hardenkvist variants — preserve "Hardenkvist" (CANONICAL_FAKE), only scrub the
  // newly-introduced first/middle initials ("Steve R").
  { from: 'Roland P Hardenkvist, NP',     to: 'Roland P Hardenkvist, NP' },
  { from: 'Roland P Hardenkvist',         to: 'Roland P Hardenkvist' },

  // Brown variants
  { from: 'Brown, Linda S',          to: 'Larvendel, Carol N' },
  { from: 'Linda S Brown',           to: 'Carol N Larvendel' },

  // Patient proxy
  { from: 'Bethany Leah Boultes',    to: 'Tamara Joy Aldington' },

  // Clinic / front-desk staff
  { from: 'Adelaide Westkander',           to: 'Adelaide Westkander' },
  { from: 'Felicity Falkenrath',            to: 'Felicity Falkenrath' },
  { from: 'Beatrix Kingsway',        to: 'Beatrix Kingsway' },

  // PHS / outside staff
  { from: 'Genevieve Brindlewain',            to: 'Genevieve Brindlewain' },
  { from: 'Marielle Tannenbaum',     to: 'Marielle Tannenbaum' },
  { from: 'Leona Inwarden',              to: 'Leona Inwarden' },
  { from: 'Jenny Duncan',            to: 'Phoebe Larkspur' },
  { from: 'Adler J Halverthorne',         to: 'Adler J Beckforth' },

  // Echo reader — "Holvenmark" is CANONICAL_FAKE, preserve it. Only scrub the
  // newly-introduced first name "Curtis".
  { from: 'Curtis Holvenmark',         to: 'Donovan Holvenmark' },

  // Referral directory — full names first so the surname-only pass doesn't double-rename
  { from: 'Reardon Eldenfaer',             to: 'Reardon Eldenfaer' },
  { from: 'Jasper Vesperwild',            to: 'Jasper Vesperwild' },
  { from: 'Lakshmi Quintannon',              to: 'Lakshmi Quintannon' },
  { from: 'Pranav Rendelman',        to: 'Pranav Rendelman' },
  { from: 'Wei-Lin Tarkenbridge',         to: 'Wei-Lin Tarkenbridge' },
  { from: 'Garrett Pinwell',             to: 'Garrett Pinwell' },
  { from: 'Damian Holcrest',       to: 'Damian Holcrest' },
  { from: 'Marcus Selwyn Brindleforth',       to: 'Marcus Selwyn Brindleforth' },
  { from: 'Conrad Pelfridge',         to: 'Conrad Pelfridge' },
];

// Surname-only patterns — applied SECOND.
// Excludes any name in CANONICAL_FAKES (those are referential and stay).
const SURNAME_MAP = [
  // Patients — NEW (Halbrook excluded; it's a CANONICAL_FAKE)
  { from: 'Boultes',     to: 'Aldington' },
  { from: 'Daech',       to: 'Brexley' },
  { from: 'MacMillan',   to: 'Hesperdale' },
  { from: 'McGuirk',     to: 'Wendelfaer' },
  { from: 'Walter',      to: 'Esselbach' },
  { from: 'Bittner',     to: 'Felgenhauer' },
  { from: 'Mendoza',     to: 'Gallichan' },
  { from: 'Miller',      to: 'Brindelhart' },
  { from: 'White',       to: 'Inkpen' },
  { from: 'Wilson',      to: 'Jorgan' },
  { from: 'Britton',     to: 'Veldenmoor' },
  { from: 'Patton',      to: 'Kvalheim' },
  { from: 'Sturges',     to: 'Maundrell' },
  { from: 'Forshey',     to: 'Norreys' },
  { from: 'Pogue',       to: 'Oxenford' },
  { from: 'Reiner',      to: 'Quennell' },
  { from: 'Sellman',     to: 'Ravensdale' },
  { from: 'Sharp',       to: 'Quelthorne' },
  { from: 'Bailey',      to: 'Heldenmark' },
  { from: 'Pendrelle',       to: 'Underwell' },
  { from: 'Brown',       to: 'Larvendel' },
  { from: 'Ramey',       to: 'Wexbury' },

  // Clinicians (surname-only) — NEW
  // Hardenkvist NOT here (CANONICAL_FAKE). Holvenmark NOT here (CANONICAL_FAKE).
  { from: 'Skarsdale',   to: 'Skarsdale' },
  { from: 'Tregarthen',    to: 'Tregarthen' },
  { from: 'Vellacott',      to: 'Vellacott' },
  { from: 'Cooper',      to: 'Birchington' },   // remaining Cooper (Wash U) after Jasper Vesperwild consumed
  { from: 'Norhaven',     to: 'Norhaven' },
  // Standalone "Curtis" — catches shorthand references to "Beatrix Kingsway"
  // (e.g., "front desk Curtis"). Runs AFTER both full-name passes have
  // consumed "Beatrix Kingsway" and "Curtis Holvenmark".
  { from: 'Curtis',      to: 'Kingsway' },

  // Skarsdale shorthand — "Dr. E" → "Dr. M"
  { from: 'Dr\\. E',     to: 'Dr. M' },
];

// Sanity check: no chosen fake collides with CANONICAL_FAKES.
// (Surname tokens in fake values like "Donovan Holvenmark" intentionally include
// "Holvenmark" — that's the canonical-preservation pattern. Skip the check for
// fakes that explicitly preserve a canonical surname.)
const FAKES_THAT_PRESERVE_CANONICAL = new Set([
  'Roland P Hardenkvist, NP',
  'Roland P Hardenkvist',
  'Donovan Holvenmark',
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
