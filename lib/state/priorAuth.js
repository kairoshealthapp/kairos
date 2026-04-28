// In-memory prior-auth store. Loads seeds from data/priorAuth/*.json on
// first access. Supabase swap point: only this file changes.

import fs from "node:fs";
import path from "node:path";
import { advanceStage } from "../types/priorAuth.js";

const SEED_FILES = ["castellanos_repatha.json"];

let _records = null;

function dayMs() {
  return 1000 * 60 * 60 * 24;
}

function resolveTimeToken(value) {
  if (typeof value !== "string") return value;
  const now = Date.now();
  const days = value.match(/^<(\d+)\s+days?\s+ago>$/i);
  if (days) return new Date(now - Number(days[1]) * dayMs()).toISOString();
  const hours = value.match(/^<(\d+)\s+hours?\s+ago>$/i);
  if (hours) return new Date(now - Number(hours[1]) * 60 * 60 * 1000).toISOString();
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
  const dir = path.join(process.cwd(), "data", "priorAuth");
  const out = [];
  for (const file of SEED_FILES) {
    const fp = path.join(dir, file);
    if (!fs.existsSync(fp)) continue;
    out.push(resolveTokensDeep(JSON.parse(fs.readFileSync(fp, "utf8"))));
  }
  // Recompute lastUpdatedAt from the latest entry after token resolution.
  for (const pa of out) {
    if (pa.stageHistory?.length) {
      const last = [...pa.stageHistory]
        .map((e) => e.enteredAt)
        .filter(Boolean)
        .sort()
        .pop();
      if (last) pa.lastUpdatedAt = last;
    }
  }
  return out;
}

function ensureLoaded() {
  if (_records === null) _records = loadSeeds();
  return _records;
}

export function getPriorAuths() {
  return ensureLoaded();
}

export function getPriorAuthRequest(id) {
  return ensureLoaded().find((p) => p.id === id) || null;
}

export function setPriorAuthRequest(pa) {
  ensureLoaded();
  const i = _records.findIndex((p) => p.id === pa.id);
  if (i >= 0) _records[i] = pa;
  else _records.push(pa);
  return pa;
}

export function advancePriorAuthStage(id, transition) {
  const pa = getPriorAuthRequest(id);
  if (!pa) return null;
  const next = advanceStage(pa, transition);
  setPriorAuthRequest(next);
  return next;
}
