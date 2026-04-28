// In-memory pre-visit task + attestation log store. Loads seeds from
// data/preVisitTasks/*.json on first access, then holds them mutable for the
// process lifetime. Same swap-point pattern as cohorts/investigations: the
// Supabase migration replaces only this file.
//
// IMPORTANT: the attestation log is a personal cognitive aid, never an
// aggregated management surface. The list interface returns the current
// user's entries only. v5 mocks "current user" as the seed actor since
// there's no auth layer yet.

import fs from "node:fs";
import path from "node:path";

const SEED_FILES = ["cosgrove_001.json"];

let _tasks = null;
let _attestationLog = [];

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
  const future = value.match(/^<in\s+(\d+)\s+days?>$/i);
  if (future) return new Date(now + Number(future[1]) * dayMs()).toISOString();
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
  const dir = path.join(process.cwd(), "data", "preVisitTasks");
  const out = [];
  for (const file of SEED_FILES) {
    const fp = path.join(dir, file);
    if (!fs.existsSync(fp)) continue;
    const raw = fs.readFileSync(fp, "utf8");
    out.push(resolveTokensDeep(JSON.parse(raw)));
  }
  return out;
}

function ensureLoaded() {
  if (_tasks === null) _tasks = loadSeeds();
  return _tasks;
}

export function getPreVisitTasks() {
  return ensureLoaded();
}

export function getPreVisitTask(id) {
  return ensureLoaded().find((t) => t.id === id) || null;
}

export function getPreVisitTaskForPatient(patientId) {
  return ensureLoaded().find((t) => t.patientId === patientId) || null;
}

export function setPreVisitTask(task) {
  ensureLoaded();
  const i = _tasks.findIndex((t) => t.id === task.id);
  if (i >= 0) _tasks[i] = task;
  else _tasks.push(task);
  return task;
}

// Attestation log — personal, append-only.
export function getAttestationLog(taskId) {
  if (!taskId) return [..._attestationLog];
  return _attestationLog.filter((e) => e.taskId === taskId);
}

export function appendAttestationLog(entry) {
  _attestationLog.push(entry);
  return entry;
}

export function updateDiscrepancyResolution(taskId, discrepancyId, resolution) {
  const task = getPreVisitTask(taskId);
  if (!task) return null;
  const next = {
    ...task,
    // Discrepancies are computed (engine output), but for v5 we persist the
    // resolution map per task so panel state survives re-renders. The panel
    // owns recomputation; this store records resolutions only.
    discrepancyResolutions: {
      ...(task.discrepancyResolutions || {}),
      [discrepancyId]: resolution,
    },
  };
  setPreVisitTask(next);
  return next;
}
