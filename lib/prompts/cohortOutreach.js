// Cohort outreach generator. Drafts a patient-facing MyChart message and a
// short internal note for proactive surveillance contact. The patient hasn't
// done anything wrong — the system noticed a care gap. Tone is "caring
// concierge," not "compliance officer."

import { createMessage, KAIROS_OPUS_MODEL } from "../claude/client.js";

const SYSTEM_PROMPT = `You are a clinical documentation assistant generating proactive patient outreach for a cardiology RN. The patient is in a surveillance cohort because their care has fallen behind a recommended cadence.

Generate two outputs:
1. **MyChart message** — warm, plain-language, gentle nudge framed as care continuity ("we want to make sure you're still on track"), not scolding ("you missed your appointment"). Specific ask: when can you come in for the lab draw?
2. **Nurse internal note** — clinical summary suitable for Epic addendum, includes priority score, flag rationale, and what action was being taken (drafting outreach).

Calibrated language. The patient hasn't done anything wrong — the system noticed a care gap. Tone is "caring concierge," not "compliance officer."

Output JSON only: { "mychartMessage": { "subject": "...", "body": "..." }, "internalNote": { "summary": "...", "action": "..." } }. No prose outside the JSON.`;

function summarizeMember(cohortMember) {
  const k = cohortMember.keyData || {};
  const lines = [];
  lines.push(
    `Patient: ${cohortMember.patientName} (${cohortMember.ageSex}) — ${k.indication || "warfarin patient"}`
  );
  lines.push(`Current dose: ${k.currentDose || "unknown"}`);
  lines.push(`Goal INR: ${k.goalRange || "unknown"}`);
  lines.push(`Last INR: ${k.lastINR} on ${k.lastINRDate?.slice(0, 10)}`);
  if (k.last3Trend?.length) {
    lines.push(`Last 3 INRs (oldest → newest): ${k.last3Trend.join(" → ")}`);
  }
  if (k.daysOverdue > 0) lines.push(`Days overdue for recheck: ${k.daysOverdue}`);
  if (k.daysSinceClinicContact)
    lines.push(`Days since clinic contact: ${k.daysSinceClinicContact}`);
  if (k.note) lines.push(`Note: ${k.note}`);
  return lines.join("\n");
}

function buildUserMessage({ cohortMember, cohortDefinition }) {
  return [
    "## Cohort context",
    `Cohort: ${cohortDefinition?.name || "unknown"}`,
    cohortDefinition?.clinicalRationale || "",
    "",
    "## Why this patient is in the cohort right now",
    `Flags: ${(cohortMember.flags || []).join(", ") || "none"}`,
    `Priority score: ${cohortMember.priorityScore}`,
    "",
    "## Patient summary",
    summarizeMember(cohortMember),
    "",
    "Generate the JSON now. MyChart message in plain language with caring-concierge tone, internal note clinically dense. Output JSON only.",
  ]
    .filter(Boolean)
    .join("\n");
}

function extractJSON(text) {
  if (!text) throw new Error("Empty response from model");
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  const candidate = fenceMatch ? fenceMatch[1] : trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error(`No JSON object found in model response: ${candidate.slice(0, 200)}`);
  }
  return JSON.parse(candidate.slice(start, end + 1));
}

export async function generateCohortOutreach({ cohortMember, cohortDefinition }) {
  const userMessage = buildUserMessage({ cohortMember, cohortDefinition });
  const response = await createMessage({
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
    maxTokens: 2000,
  });
  const text = response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");
  let parsed;
  try {
    parsed = extractJSON(text);
  } catch (err) {
    const e = new Error(`Cohort-outreach JSON parse failed: ${err.message}`);
    e.rawResponse = text;
    throw e;
  }
  if (!parsed.mychartMessage?.body || !parsed.internalNote?.summary) {
    const e = new Error("Cohort-outreach JSON missing required fields");
    e.rawResponse = text;
    e.parsed = parsed;
    throw e;
  }
  return {
    mychartMessage: {
      subject: parsed.mychartMessage.subject || "",
      body: parsed.mychartMessage.body,
    },
    internalNote: {
      summary: parsed.internalNote.summary,
      action: parsed.internalNote.action || "",
    },
    generatedAt: new Date().toISOString(),
    model: KAIROS_OPUS_MODEL,
  };
}
