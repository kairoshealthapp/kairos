// scripts/scrub-names.js
// Single-use: replace real patient/clinician/clinic surnames in working
// tree with fictional substitutes. Deleted after the run.
const fs = require("fs");
const path = require("path");

const SUBSTITUTIONS = [
  // Patients (longest matches first to avoid partial-match collisions)
  ["Diane Hartwell", "Diane Hartwell"],
  ["Sharon Halberg", "Sharon Halberg"],
  ["Jean Castellanos", "Jean Castellanos"],
  ["Riverbend Health", "Riverbend Health"],
  ["Riverbend", "Riverbend"],
  ["Marbury", "Marbury"],
  ["Linnehan", "Linnehan"],
  ["Trahan", "Trahan"],
  ["Skarsdale", "Skarsdale"],
  ["Marston", "Marston"],
  ["Whitfield", "Whitfield"], // safety pin — no-op if already done
  ["Okafor", "Okafor"],
  ["Pemberton", "Pemberton"],
  ["Norquist", "Norquist"],
  ["Tysander", "Tysander"],
  ["Castellanos", "Castellanos"],
  ["Ballinger", "Ballinger"],
  ["Marston", "Marston"],
  ["Renee", "Renee"],
  ["Bramwell", "Bramwell"],
  ["Sutherland", "Sutherland"],
  ["Diane", "Diane"],
  ["Hartwell", "Hartwell"],
  ["Caldwell", "Caldwell"],
  ["Devereaux", "Devereaux"],
  ["Whitfield", "Whitfield"],
  ["Halberg", "Halberg"],
];

function expandCases(pairs) {
  const out = [];
  for (const [from, to] of pairs) {
    out.push([from, to]);
    out.push([from.toLowerCase(), to.toLowerCase()]);
    out.push([from.toUpperCase(), to.toUpperCase()]);
  }
  return out;
}

const ALL_SUBS = expandCases(SUBSTITUTIONS);

const SKIP_DIRS = new Set(["node_modules", ".next", ".git", "dist", "build"]);
const TEXT_EXT = new Set([
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".json",
  ".md",
  ".txt",
  ".html",
  ".css",
]);

function scrubFile(filepath) {
  const ext = path.extname(filepath);
  if (!TEXT_EXT.has(ext)) return false;
  let content = fs.readFileSync(filepath, "utf8");
  let changed = false;
  for (const [from, to] of ALL_SUBS) {
    if (from === to) continue;
    if (content.includes(from)) {
      content = content.split(from).join(to);
      changed = true;
    }
  }
  if (changed) fs.writeFileSync(filepath, content, "utf8");
  return changed;
}

function walk(dir) {
  let modified = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) modified += walk(full);
    else if (entry.isFile()) if (scrubFile(full)) modified++;
  }
  return modified;
}

const count = walk(process.cwd());
console.log(`Scrubbed ${count} files.`);
