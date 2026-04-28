// In-memory cohort store. Loads cohort definitions and snapshots from
// data/cohorts/*.json on first access, then holds them mutable for the
// process lifetime. Time tokens in seed data are resolved at load time so
// "19 days ago" reads as fresh regardless of when the dev server started.
//
// Supabase migration: replace this file only.

import fs from "node:fs";
import path from "node:path";
import { computeINRReminderSnapshot } from "../clinical/cohortCompute.js";

let _definitions = null;
const _snapshots = new Map();

function dayMs() {
  return 1000 * 60 * 60 * 24;
}

function resolveTimeToken(value) {
  if (typeof value !== "string") return value;
  const now = Date.now();
  const m1 = value.match(/^<(\d+)\s+days?\s+ago>$/i);
  if (m1) return new Date(now - Number(m1[1]) * dayMs()).toISOString();
  const m2 = value.match(/^<(\d+)\s+hours?\s+ago>$/i);
  if (m2) return new Date(now - Number(m2[1]) * 60 * 60 * 1000).toISOString();
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

function loadDefinitions() {
  const fp = path.join(process.cwd(), "data", "cohorts", "definitions.json");
  if (!fs.existsSync(fp)) return [];
  return JSON.parse(fs.readFileSync(fp, "utf8"));
}

function loadINRReminderSeed() {
  const fp = path.join(process.cwd(), "data", "cohorts", "inr_reminder_seed.json");
  if (!fs.existsSync(fp)) return [];
  const raw = JSON.parse(fs.readFileSync(fp, "utf8"));
  return resolveTokensDeep(raw);
}

function ensureLoaded() {
  if (_definitions === null) {
    _definitions = loadDefinitions();
    // Seed snapshots
    const inrSeed = loadINRReminderSeed();
    if (inrSeed.length) {
      _snapshots.set("inr_reminder", computeINRReminderSnapshot(inrSeed));
    }
  }
}

export function getCohortDefinitions() {
  ensureLoaded();
  return _definitions;
}

export function getCohortDefinition(id) {
  ensureLoaded();
  return _definitions.find((d) => d.id === id) || null;
}

export function getCohortSnapshot(definitionId) {
  ensureLoaded();
  return _snapshots.get(definitionId) || null;
}

export function setCohortSnapshot(snapshot) {
  ensureLoaded();
  _snapshots.set(snapshot.definitionId, snapshot);
}
