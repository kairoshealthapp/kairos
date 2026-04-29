// In-memory incoming fax store. Loads seed from
// data/incomingFaxes/seed.json on first access. Same swap-point pattern as
// other state modules.

import fs from "node:fs";
import path from "node:path";

const SEED_FILE = "seed.json";

let _faxes = null;

function dayMs() {
  return 1000 * 60 * 60 * 24;
}

function resolveTimeToken(value) {
  if (typeof value !== "string") return value;
  const now = Date.now();
  const min = value.match(/^<(\d+)\s+min(?:ute)?s?\s+ago>$/i);
  if (min) return new Date(now - Number(min[1]) * 60 * 1000).toISOString();
  const hours = value.match(/^<(\d+)\s+hours?\s+ago>$/i);
  if (hours) return new Date(now - Number(hours[1]) * 60 * 60 * 1000).toISOString();
  const days = value.match(/^<(\d+)\s+days?\s+ago>$/i);
  if (days) return new Date(now - Number(days[1]) * dayMs()).toISOString();
  if (value === "<now>") return new Date(now).toISOString();
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
  const fp = path.join(process.cwd(), "data", "incomingFaxes", SEED_FILE);
  if (!fs.existsSync(fp)) return [];
  return resolveTokensDeep(JSON.parse(fs.readFileSync(fp, "utf8")));
}

function ensureLoaded() {
  if (_faxes === null) _faxes = loadSeeds();
  return _faxes;
}

export function getIncomingFaxes() {
  return ensureLoaded();
}

export function getIncomingFax(id) {
  return ensureLoaded().find((f) => f.id === id) || null;
}

export function getFaxesByStatus(status) {
  return ensureLoaded().filter((f) => f.status === status);
}

export function setIncomingFax(fax) {
  ensureLoaded();
  const i = _faxes.findIndex((f) => f.id === fax.id);
  if (i >= 0) _faxes[i] = fax;
  else _faxes.push(fax);
  return fax;
}

export function resolveFaxPatient(faxId, patientId, actor) {
  ensureLoaded();
  const i = _faxes.findIndex((f) => f.id === faxId);
  if (i < 0) return null;
  _faxes[i] = {
    ..._faxes[i],
    resolvedPatientId: patientId,
    status: actor === "auto" ? "auto_matched" : "human_matched",
    resolvedAt: new Date().toISOString(),
    resolvedBy: actor,
  };
  return _faxes[i];
}

export function rejectFax(faxId, actor) {
  ensureLoaded();
  const i = _faxes.findIndex((f) => f.id === faxId);
  if (i < 0) return null;
  _faxes[i] = {
    ..._faxes[i],
    status: "rejected",
    resolvedAt: new Date().toISOString(),
    resolvedBy: actor,
  };
  return _faxes[i];
}

export function markFaxProcessed(faxId, encounterId) {
  ensureLoaded();
  const i = _faxes.findIndex((f) => f.id === faxId);
  if (i < 0) return null;
  _faxes[i] = {
    ..._faxes[i],
    status: "processed",
    processedEncounterId: encounterId,
    processedAt: new Date().toISOString(),
  };
  return _faxes[i];
}
