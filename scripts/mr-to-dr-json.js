const fs = require("fs");
const path = require("path");

const PROVIDERS = [
  "Loxley", "Marchetti", "Tregarthen", "Vellacott", "Birchington",
  "Hennessey", "Wexford", "Pelletier", "Quayle", "Vance", "Tandon", "Tao",
  "Pinwell", "Holcrest", "Trent", "Pelham", "Townsend", "Ashbrook",
  "Strathmore", "Tannenbaum", "Petrov", "Larkspur", "Kingsway", "Crowley",
  "Ballard", "Ballout", "Morrison", "Virk",
];

const re = new RegExp(`Mr\\. (${PROVIDERS.join("|")})\\b`, "g");

const dir = "data/mock-encounters";
let total = 0;
let files = 0;
for (const fn of fs.readdirSync(dir)) {
  if (!/\.json$/.test(fn)) continue;
  const full = path.join(dir, fn);
  let t = fs.readFileSync(full, "utf8");
  let count = 0;
  t = t.replace(re, (_, n) => {
    count++;
    return `Dr. ${n}`;
  });
  if (count > 0) {
    fs.writeFileSync(full, t, "utf8");
    console.log(`${fn}: ${count}`);
    total += count;
    files++;
  }
}
console.log("---");
console.log(`total: ${total} across ${files} files`);
