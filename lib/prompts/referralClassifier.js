// Referral message classifier. Uses Sonnet (not Opus) — high-volume routine
// classification, not clinical reasoning. Per the v6 build doc this choice
// is per-route, not global; clinical generation routes still use Opus.

import { createMessage, KAIROS_SONNET_MODEL } from "../claude/client.js";

const SYSTEM_PROMPT = `You are classifying inbound referral messages from outside providers/clinics for a cardiology RN's inbox. Your job is to suppress informational noise and surface actionable items.

Categories:
- informational_ack: receipt confirmation, no action needed
- informational_appointment_confirmation: patient was seen / next appointment scheduled, informational
- informational_records_received: records / labs / imaging received, no action
- actionable_scheduling: outside provider needs help scheduling / coordinating
- actionable_clinical_question: outside provider asking a clinical question that needs an answer
- actionable_info_request: outside provider requesting additional info from this clinic
- actionable_referral_response_pending: this clinic needs to respond about whether they accept the referral
- unable_to_classify: ambiguous, send to human review

Rules:
- Default to suppression. Most messages are informational. When in doubt between informational and actionable, choose actionable.
- Soft clinical mentions ("patient said X last week") that don't include explicit ask = unable_to_classify, NOT informational.
- Confidence 0.0-1.0. Reserve >0.95 for unambiguous cases.
- Output JSON only: { "category": "...", "confidence": 0.0, "reasoning": "...", "suggestedAction": "..." | null, "routeTo": "patient_call_basket" | "pt_advice_request" | "rx_request" | "scheduling" | "provider_review" | null }. No prose outside the JSON.`;

export function buildClassifierPrompt(message) {
  const user = [
    `Sender: ${message.senderName} (${message.senderOrg})`,
    `Subject: ${message.subject}`,
    "",
    "Body:",
    message.body,
    "",
    "Classify this message. Output JSON only.",
  ].join("\n");
  return { system: SYSTEM_PROMPT, user };
}

function extractJSON(text) {
  if (!text) throw new Error("Empty response from model");
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  const candidate = fenceMatch ? fenceMatch[1] : trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error(`No JSON object found in classifier response: ${candidate.slice(0, 200)}`);
  }
  return JSON.parse(candidate.slice(start, end + 1));
}

const VALID_CATEGORIES = new Set([
  "informational_ack",
  "informational_appointment_confirmation",
  "informational_records_received",
  "actionable_scheduling",
  "actionable_clinical_question",
  "actionable_info_request",
  "actionable_referral_response_pending",
  "unable_to_classify",
]);

const VALID_ROUTES = new Set([
  "patient_call_basket",
  "pt_advice_request",
  "rx_request",
  "scheduling",
  "provider_review",
]);

export async function classifyReferralMessage(message) {
  const { system, user } = buildClassifierPrompt(message);
  const response = await createMessage({
    system,
    messages: [{ role: "user", content: user }],
    maxTokens: 1000,
    model: KAIROS_SONNET_MODEL,
  });
  const text = response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");
  let parsed;
  try {
    parsed = extractJSON(text);
  } catch (err) {
    const e = new Error(`Classifier JSON parse failed: ${err.message}`);
    e.rawResponse = text;
    throw e;
  }
  if (!parsed.category || !VALID_CATEGORIES.has(parsed.category)) {
    const e = new Error(`Classifier returned invalid category: ${parsed.category}`);
    e.rawResponse = text;
    e.parsed = parsed;
    throw e;
  }
  const confidence = typeof parsed.confidence === "number" ? parsed.confidence : 0.5;
  const routeTo = parsed.routeTo && VALID_ROUTES.has(parsed.routeTo) ? parsed.routeTo : null;
  return {
    category: parsed.category,
    confidence: Math.max(0, Math.min(1, confidence)),
    reasoning: String(parsed.reasoning || ""),
    suggestedAction: parsed.suggestedAction || null,
    routeTo,
    classifiedAt: new Date().toISOString(),
    classifierModel: KAIROS_SONNET_MODEL,
    humanOverridden: false,
    humanOverrideNote: null,
  };
}

// Sequential batch with concurrency 3. Don't blast the API.
export async function classifyBatch(messages) {
  const results = new Array(messages.length);
  let cursor = 0;
  async function worker() {
    while (cursor < messages.length) {
      const i = cursor++;
      try {
        results[i] = await classifyReferralMessage(messages[i]);
      } catch (err) {
        results[i] = { error: err.message, messageId: messages[i].id };
      }
    }
  }
  const workers = [];
  const concurrency = Math.min(3, messages.length);
  for (let n = 0; n < concurrency; n++) workers.push(worker());
  await Promise.all(workers);
  return results;
}
