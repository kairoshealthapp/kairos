// One-shot helper: infer the v3.0 `panels` array per fixture from
// existing actionScripts + finalSignedState. Output is hand-pasted into
// each fixture file (a simple manual edit avoids a programmatic
// rewrite that could disturb formatting / comments).

import { pathToFileURL } from "node:url";
import { readdir } from "node:fs/promises";
import path from "node:path";

const FIX_DIR = path.join(process.cwd(), "data", "fixtures", "encounters");
const TARGET_TO_KEY = {
  "nurse-note": "rnNote",
  mychart: "myChart",
  "phone-script": "callScript",
  "order-pad": "orderPad",
};

function emptyContent() {
  return { rnNote: "", myChart: "", callScript: "", orderPad: { orders: [] } };
}

function derive(fixture) {
  const out = emptyContent();
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

for (const f of files) {
  const url = pathToFileURL(path.join(FIX_DIR, f)).href;
  const mod = await import(url);
  const fixture = mod.default;
  const panels = infer(fixture);
  const id = (fixture && fixture.id) || f;
  console.log(`${id}: [${panels.map((p) => `"${p}"`).join(", ")}]`);
}
