// One-shot inventory of narration text in lib/tourScript.js. Pass C Phase 1.
// Reports per-card char/word counts and total estimated narration time.
const fs = require("fs");
const path = require("path");

const src = fs.readFileSync(path.join(__dirname, "..", "lib", "tourScript.js"), "utf8");

function countLiteralChars(literalSegment) {
  let total = 0;
  const strRe = /"((?:\\.|[^"\\])*)"/g;
  let sm;
  while ((sm = strRe.exec(literalSegment)) !== null) {
    const piece = sm[1].replace(/\\n/g, "\n").replace(/\\"/g, '"').replace(/\\\\/g, "\\");
    total += piece.length;
  }
  return total;
}

function findAll(re, src) {
  const out = [];
  let m;
  re.lastIndex = 0;
  while ((m = re.exec(src)) !== null) out.push({ idx: m.index, name: m[1] });
  return out;
}

const fxStarts = findAll(/fixtureId:\s*"([^"]+)"/g, src);
const rows = [];
for (let i = 0; i < fxStarts.length; i++) {
  const start = fxStarts[i].idx;
  const end = i + 1 < fxStarts.length ? fxStarts[i + 1].idx : src.length;
  const block = src.slice(start, end);
  const fid = fxStarts[i].name;

  let qChars = 0, dChars = 0;
  // Find quickVoiceText / deepVoiceText fields and accumulate their string literal contents.
  const fieldRe = /(quickVoiceText|deepVoiceText):\s*([\s\S]*?),\s*\n/g;
  let fm;
  while ((fm = fieldRe.exec(block)) !== null) {
    const chars = countLiteralChars(fm[2]);
    if (fm[1] === "quickVoiceText") qChars += chars;
    else dChars += chars;
  }
  rows.push({ fid, qChars, dChars });
}

console.log("Per-card narration char counts:");
console.log("fixtureId                     | Quick chars | Deep chars | Quick min (15.5 cps) | Deep min (15.5 cps)");
let totalQ = 0, totalD = 0;
for (const r of rows) {
  totalQ += r.qChars;
  totalD += r.dChars;
  console.log(
    r.fid.padEnd(29) + " | " +
    String(r.qChars).padStart(6) + " | " +
    String(r.dChars).padStart(6) + " | " +
    (r.qChars / 15.5 / 60).toFixed(2).padStart(5) + " min          | " +
    (r.dChars / 15.5 / 60).toFixed(2).padStart(5) + " min"
  );
}
console.log("--");
console.log("TOTAL Quick chars: " + totalQ + " | ~" + (totalQ / 15.5 / 60).toFixed(2) + " min of audio @ 15.5 cps");
console.log("TOTAL Deep chars : " + totalD + " | ~" + (totalD / 15.5 / 60).toFixed(2) + " min of audio @ 15.5 cps");
console.log("");
console.log("Targets:");
console.log("  Quick: 12-14 min total tour. Narration alone needs ~" + (12 * 60 * 15.5).toLocaleString() + "-" + (14 * 60 * 15.5).toLocaleString() + " chars.");
console.log("  Deep : 22-25 min total tour. Narration alone needs ~" + (22 * 60 * 15.5).toLocaleString() + "-" + (25 * 60 * 15.5).toLocaleString() + " chars.");
console.log("");
const overheadMin = 4; // visual card durations + transitions, est
console.log("Subtract ~" + overheadMin + " min visual overhead per tour:");
console.log("  Quick narration target: ~" + ((12 - overheadMin) * 60 * 15.5).toLocaleString() + "-" + ((14 - overheadMin) * 60 * 15.5).toLocaleString() + " chars");
console.log("  Deep narration target : ~" + ((22 - overheadMin) * 60 * 15.5).toLocaleString() + "-" + ((25 - overheadMin) * 60 * 15.5).toLocaleString() + " chars");
console.log("");
const quickReduction = ((totalQ - (10 * 60 * 15.5)) / totalQ * 100);
const deepReduction = ((totalD - (20 * 60 * 15.5)) / totalD * 100);
console.log("Implied narration reduction needed (mid-target):");
console.log("  Quick: ~" + Math.max(0, quickReduction).toFixed(0) + "% of current chars");
console.log("  Deep : ~" + Math.max(0, deepReduction).toFixed(0) + "% of current chars");
