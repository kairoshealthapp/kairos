// Injects an explicit `panels: [...]` declaration into each encounter
// fixture, immediately before the `initialPaneContent: {` line. Skips
// fixtures that already declare panels.

import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const FIX_DIR = path.join(process.cwd(), "data", "fixtures", "encounters");
const TARGET_TO_KEY = {
  "nurse-note": "rnNote",
  mychart: "myChart",
  "phone-script": "callScript",
  "order-pad": "orderPad",
};

function derive(fixture) {
  const out = { rnNote: "", myChart: "", callScript: "", orderPad: { orders: [] } };
  const scripts = fixture && fixture.actionScripts;
  if (scripts) {
    for (const key of Object.keys(scripts)) {
      const events = scripts[key];
      if (!Array.isArray(events)) continue;
      for (const ev of events) {
        if (!ev || ev.type !== "pane-update") continue;
        const k = TARGET_TO_KEY[ev.target];
        if (!k) continue;
        if (k === "orderPad") out.orderPad = ev.content || out.orderPad;
        else if (ev.mode === "append") out[k] = (out[k] || "") + (ev.content || "");
        else out[k] = ev.content || "";
      }
    }
  }
  const fss = fixture && fixture.finalSignedState;
  if (fss) {
    if (!out.rnNote && fss.nurseNote && fss.nurseNote !== "[As drafted above]") out.rnNote = fss.nurseNote;
    if (!out.myChart && fss.mychartMessage && fss.mychartMessage !== "[As drafted above]") out.myChart = fss.mychartMessage;
    if (!out.callScript && fss.phoneScript && fss.phoneScript !== "[As drafted above]") out.callScript = fss.phoneScript;
  }
  return out;
}

function infer(fixture) {
  const c = derive(fixture);
  const out = [];
  if (c.rnNote) out.push("rnNote");
  if (c.myChart) out.push("myChart");
  if (c.orderPad && Array.isArray(c.orderPad.orders) && c.orderPad.orders.length > 0) out.push("orderPad");
  if (c.callScript) out.push("callScript");
  return out.length > 0 ? out : ["rnNote"];
}

const files = (await readdir(FIX_DIR))
  .filter((f) => f.endsWith(".js") && f !== "index.js")
  .sort();

let changed = 0;
for (const f of files) {
  const fp = path.join(FIX_DIR, f);
  const url = pathToFileURL(fp).href + `?v=${Date.now()}`;
  const mod = await import(url);
  const fixture = mod.default;
  const panels = infer(fixture);
  const src = await readFile(fp, "utf8");
  if (/\n\s*panels:\s*\[/.test(src)) {
    console.log(`skip (already has panels): ${f}`);
    continue;
  }
  const insertion = `  // v3.0 — conditional panel declaration. Auto-inferred from\n  // actionScripts / finalSignedState; override here if needed.\n  panels: [${panels.map((p) => `"${p}"`).join(", ")}],\n`;
  // Insert immediately before the `initialPaneContent: {` line.
  const re = /^(\s*)initialPaneContent:\s*\{/m;
  if (!re.test(src)) {
    console.log(`SKIP (no initialPaneContent anchor): ${f}`);
    continue;
  }
  const next = src.replace(re, (m, indent) => `${insertion}${indent}initialPaneContent: {`);
  await writeFile(fp, next, "utf8");
  console.log(`updated: ${f} → [${panels.join(", ")}]`);
  changed++;
}
console.log(`\nDone. ${changed} files updated.`);
