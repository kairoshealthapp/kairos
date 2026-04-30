// One-shot replace "Mr. {ProviderSurname}" → "Dr. {ProviderSurname}" across
// fixtures + tour script. Patient surnames untouched. Run: node scripts/mr-to-dr.js
const fs = require("fs");
const path = require("path");

const PROVIDERS = [
  // shift-file scrub fakes (provider clinicians)
  "Beckweldon", "Skarsdale", "Tregarthen", "Vellacott", "Birchington",
  "Vesperwild", "Eldenfaer", "Norhaven", "Pelfridge", "Quintannon", "Rendelman", "Tarkenbridge",
  "Pinwell", "Holcrest", "Brindleforth", "Pelham", "Beckforth", "Falkenrath",
  "Brindlewain", "Tannenbaum", "Inwarden", "Larkspur", "Kingsway", "Westkander",
  // CONTEXT/ADDENDUM canonical-fake providers — include in case any
  // fixture authoring used these directly instead of the shift-fake.
  "Hardenkvist", "Ballout", "Holvenmark", "Vorhelden",
];

const FILES = [
  "lib/tourScript.js",
  "data/fixtures/encounters/aldington-tte.js",
  "data/fixtures/encounters/brexley-statin.js",
  "data/fixtures/encounters/hesperdale-crestor.js",
  "data/fixtures/encounters/wendelfaer-pcp.js",
  "data/fixtures/encounters/esselbach-urgent.js",
  "data/fixtures/encounters/kvalheim-coordination.js",
  "data/fixtures/encounters/maundrell-contradiction.js",
  "data/fixtures/encounters/norreys-transactional.js",
  "data/fixtures/encounters/halbrook-lab-review.js",
  "data/fixtures/encounters/halbrook-dme-pa.js",
  "data/fixtures/encounters/reiner-multilab.js",
  "data/fixtures/encounters/ravensdale-cpap.js",
  "data/fixtures/encounters/quelthorne-async.js",
  "data/fixtures/encounters/heldenmark-securechat.js",
  "data/fixtures/encounters/underwell-full-lifecycle.js",
  "data/fixtures/encounters/quennell-scope.js",
  "data/fixtures/encounters/larvendel-denial-cascade.js",
  "data/fixtures/encounters/wexbury-phone.js",
  "data/fixtures/encounters/strathorne-doe.js",
  "data/fixtures/encounters/frazier-handoff.js",
  "data/fixtures/encounters/wood-lipid.js",
  "data/fixtures/encounters/czeschin-bp.js",
  "data/fixtures/encounters/besemer-bnp.js",
  "data/fixtures/encounters/vrabel-referral.js",
];

const ROOT = "C:/Users/kents/kairos";
const ALT = PROVIDERS.join("|");
// Note: no leading `\b` because some occurrences appear immediately after
// a `\n` string-escape (the literal byte before `M` is the letter `n`),
// which suppresses the word-boundary anchor.
const RE = new RegExp(`Mr\\. (${ALT})\\b`, "g");

let totalReplacements = 0;
let filesChanged = 0;

for (const rel of FILES) {
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(full)) continue;
  const before = fs.readFileSync(full, "utf8");
  let count = 0;
  const after = before.replace(RE, (_, name) => {
    count++;
    return `Dr. ${name}`;
  });
  if (count > 0) {
    fs.writeFileSync(full, after, "utf8");
    console.log(`${rel}: ${count} replacement(s)`);
    totalReplacements += count;
    filesChanged++;
  }
}

console.log(`---`);
console.log(`total: ${totalReplacements} replacements across ${filesChanged} files`);
