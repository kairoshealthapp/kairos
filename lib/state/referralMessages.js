// In-memory referral message store. Loads seed from
// data/referralMessages/seed.json on first access. Same swap-point pattern
// as cohorts/investigations/preVisitTasks: Supabase replaces only this file.

import fs from "node:fs";
import path from "node:path";

const SEED_FILE = "seed.json";

let _messages = null;

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
  const fp = path.join(process.cwd(), "data", "referralMessages", SEED_FILE);
  if (!fs.existsSync(fp)) return [];
  const raw = fs.readFileSync(fp, "utf8");
  return resolveTokensDeep(JSON.parse(raw));
}

function ensureLoaded() {
  if (_messages === null) _messages = loadSeeds();
  return _messages;
}

export function getReferralMessages() {
  return ensureLoaded();
}

export function getReferralMessage(id) {
  return ensureLoaded().find((m) => m.id === id) || null;
}

export function getMessagesByCategory(category) {
  return ensureLoaded().filter(
    (m) => m.classification && m.classification.category === category
  );
}

export function getMessagesByStatus(status) {
  return ensureLoaded().filter((m) => m.status === status);
}

export function setClassification(messageId, classification) {
  ensureLoaded();
  const i = _messages.findIndex((m) => m.id === messageId);
  if (i < 0) return null;
  _messages[i] = {
    ..._messages[i],
    classification,
    status: "classified",
  };
  return _messages[i];
}

export function appendOverride(messageId, { newCategory, newRouteTo, overrideNote }) {
  ensureLoaded();
  const i = _messages.findIndex((m) => m.id === messageId);
  if (i < 0) return null;
  const prev = _messages[i];
  if (!prev.classification) return null;
  _messages[i] = {
    ...prev,
    classification: {
      ...prev.classification,
      category: newCategory,
      routeTo: newRouteTo ?? prev.classification.routeTo,
      humanOverridden: true,
      humanOverrideNote: overrideNote || "",
      classifiedAt: new Date().toISOString(),
    },
  };
  return _messages[i];
}

export function markStatus(messageId, status) {
  ensureLoaded();
  const i = _messages.findIndex((m) => m.id === messageId);
  if (i < 0) return null;
  _messages[i] = { ..._messages[i], status };
  return _messages[i];
}

export function markManyStatus(messageIds, status) {
  const ids = new Set(messageIds);
  ensureLoaded();
  const updated = [];
  for (let i = 0; i < _messages.length; i++) {
    if (ids.has(_messages[i].id)) {
      _messages[i] = { ..._messages[i], status };
      updated.push(_messages[i]);
    }
  }
  return updated;
}
