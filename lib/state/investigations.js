// In-memory investigation store. The seed loader pulls from
// data/investigations/*.json on first access, then the store is mutable for
// the lifetime of the Node process. Designed so that the only file that
// changes when Supabase lands is this one — callers see the same getter
// surface.
//
// Time tokens in the seed JSON (`<minutes-ago:N>`, `<hours-ago:N>`,
// `<days-ago:N hh:mm>`) are resolved at load time so the demo always reads
// "fresh" relative to when the dev server started.

import fs from "node:fs";
import path from "node:path";

const SEED_FILES = ["linnehan_001.json", "hartwell_001.json"];

let _investigations = null;

function resolveTimeToken(value) {
  if (typeof value !== "string") return value;
  const now = Date.now();
  const dayMs = 1000 * 60 * 60 * 24;
  const hourMs = 1000 * 60 * 60;
  const minMs = 1000 * 60;

  // <minutes-ago:N>
  let m = value.match(/^<minutes-ago:(\d+)>$/);
  if (m) return new Date(now - Number(m[1]) * minMs).toISOString();

  // <hours-ago:N>
  m = value.match(/^<hours-ago:(\d+)>$/);
  if (m) return new Date(now - Number(m[1]) * hourMs).toISOString();

  // <days-ago:N hh:mm> — N days ago at the given local-time hh:mm
  m = value.match(/^<days-ago:(\d+)\s+(\d{1,2}):(\d{2})>$/);
  if (m) {
    const d = new Date(now - Number(m[1]) * dayMs);
    d.setHours(Number(m[2]), Number(m[3]), 0, 0);
    return d.toISOString();
  }

  // <today hh:mm> — today at the given local-time hh:mm
  m = value.match(/^<today\s+(\d{1,2}):(\d{2})>$/);
  if (m) {
    const d = new Date();
    d.setHours(Number(m[1]), Number(m[2]), 0, 0);
    return d.toISOString();
  }

  return value;
}

function resolveTokensDeep(node) {
  if (Array.isArray(node)) return node.map(resolveTokensDeep);
  if (node && typeof node === "object") {
    const out = {};
    for (const k of Object.keys(node)) out[k] = resolveTokensDeep(node[k]);
    return out;
  }
  return resolveTimeToken(node);
}

function loadSeeds() {
  const dir = path.join(process.cwd(), "data", "investigations");
  const out = [];
  for (const file of SEED_FILES) {
    const fp = path.join(dir, file);
    if (!fs.existsSync(fp)) continue;
    const raw = fs.readFileSync(fp, "utf8");
    const parsed = JSON.parse(raw);
    out.push(resolveTokensDeep(parsed));
  }
  // Recompute lastActivityAt from the newest touchpoint after token resolution
  for (const inv of out) {
    const tps = inv.touchpoints || [];
    if (tps.length) {
      const last = tps
        .map((t) => t.occurredAt)
        .filter(Boolean)
        .sort()
        .pop();
      if (last) inv.lastActivityAt = last;
    }
  }
  return out;
}

function ensureLoaded() {
  if (_investigations === null) _investigations = loadSeeds();
  return _investigations;
}

export function getInvestigations() {
  return ensureLoaded();
}

export function getInvestigation(id) {
  const all = ensureLoaded();
  return all.find((i) => i.id === id) || null;
}

export function setInvestigations(list) {
  _investigations = list;
}
