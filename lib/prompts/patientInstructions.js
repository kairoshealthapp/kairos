// Pre-procedure patient instructions generator. Audience: patient at home, no
// clinical training. Tone: clear, calm, specific. Translates the protocol
// applier's per-medication schedule into plain language with explicit
// timing, grouped hold/continue lists, emergency contact, and a copyable
// version suitable for MyChart paste-in.

import { createMessage, KAIROS_OPUS_MODEL } from "../claude/client.js";

const SYSTEM_PROMPT = `Generate plain-language patient instructions for pre-procedure medication management. Audience: patient at home, no clinical training. Tone: clear, calm, specific.

Rules:
- Use the medication's brand/common name + dose, not just generic.
- Specify exact timing in patient terms ("the morning of your test, do not take..." not "24h pre-procedure").
- Group "hold" meds and "continue" meds separately for clarity.
- End with: emergency contact info, what to do if confused, when to resume.
- No clinical jargon. "Beta blocker" → "blood pressure / heart rate medicine."

Output JSON only: { "headerSummary": "...", "holdMedications": [{ "name": "...", "holdInstruction": "...", "resumeInstruction": "..." }], "continueMedications": [{ "name": "...", "instruction": "..." }], "emergencyGuidance": "...", "copyableText": "..." }. No prose outside the JSON.`;

function summarizeSchedule(scheduleResult) {
  const lines = [];
  if (scheduleResult.protocolName) lines.push(`Protocol: ${scheduleResult.protocolName}`);
  if (scheduleResult.procedureType) lines.push(`Procedure: ${scheduleResult.procedureType}`);
  if (scheduleResult.scheduledDate) lines.push(`Scheduled: ${scheduleResult.scheduledDate}`);
  lines.push("");
  lines.push("HOLD:");
  scheduleResult.schedule
    .filter((s) => s.action === "hold")
    .forEach((s) => {
      lines.push(`- ${s.medication} — ${s.timing}; resume ${s.resume}. Rationale: ${s.rationale}`);
    });
  lines.push("");
  lines.push("CONTINUE:");
  scheduleResult.schedule
    .filter((s) => s.action === "continue")
    .forEach((s) => {
      lines.push(`- ${s.medication} — ${s.timing}. Rationale: ${s.rationale}`);
    });
  if (scheduleResult.warnings?.length) {
    lines.push("");
    lines.push("CLINICAL WARNINGS (for nurse — do not include verbatim in patient text):");
    scheduleResult.warnings.forEach((w) => lines.push(`- ${w}`));
  }
  if (scheduleResult.unmatched?.length) {
    lines.push("");
    lines.push("UNMATCHED MEDS (manual review):");
    scheduleResult.unmatched.forEach((u) => lines.push(`- ${u.medication}: ${u.reason}`));
  }
  return lines.join("\n");
}

function buildUserMessage({ patient, scheduleResult }) {
  return [
    "## Patient",
    `${patient?.name || "Patient"}, ${patient?.gender || ""} ${patient?.age || ""}y`,
    "",
    "## Pre-procedure schedule (from protocol applier)",
    summarizeSchedule(scheduleResult),
    "",
    "Generate the JSON now. Patient-facing language only in the output. Output JSON only.",
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

export async function generatePatientInstructions({ patient, scheduleResult }) {
  const userMessage = buildUserMessage({ patient, scheduleResult });
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
    const e = new Error(`Patient-instructions JSON parse failed: ${err.message}`);
    e.rawResponse = text;
    throw e;
  }
  return {
    headerSummary: parsed.headerSummary || "",
    holdMedications: Array.isArray(parsed.holdMedications) ? parsed.holdMedications : [],
    continueMedications: Array.isArray(parsed.continueMedications)
      ? parsed.continueMedications
      : [],
    emergencyGuidance: parsed.emergencyGuidance || "",
    copyableText: parsed.copyableText || "",
    generatedAt: new Date().toISOString(),
    model: KAIROS_OPUS_MODEL,
  };
}
