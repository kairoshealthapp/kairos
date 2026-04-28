// PA status update generator — given a PriorAuthRequest and the patient's
// latest message, produces a dual output: warm patient-facing MyChart reply
// + clinical internal note for record-keeping.
//
// Same dual-output primitive as lib/prompts/dualOutput.js but specialized
// for prior-auth status communication. Inputs: PA stage history (the source
// of truth) + patient's frustration/concern (the human context).

import { createMessage, KAIROS_OPUS_MODEL } from "../claude/client.js";

const SYSTEM_PROMPT = `You are a clinical communications assistant for a cardiology RN. The patient has sent a MyChart message about a prior authorization (PA) that has been moving through insurance review for several days. Your job is to draft TWO outputs simultaneously:

1. **MyChart message to the patient** — warm, empathetic, plain-language (5th-grade reading level). Acknowledge the frustration, explain the current PA stage in human terms (no insurance jargon), tell them what's actively happening + what comes next, and give an honest expectation about timing.
2. **Internal nurse note (clinical record-keeping)** — clinical density, references the PA stage history verbatim, captures what the patient was told, and flags any open clinical questions with [verify: ...] markers.

Rules:
- Both outputs are derived from the PA stage history. Same facts, two audiences.
- Patient message: NO insurance/clinical jargon. "Prior authorization" → "the approval from your insurance for the new medication." "PCSK9 inhibitor" → the medication's brand name. Don't promise a specific date the medication will arrive — give realistic ranges.
- Nurse Note: full clinical density. Cite stage transitions, dates (relative), pending items.
- Never invent a stage or artifact that isn't in the input.
- Output JSON only: { "mychartMessage": { "subject": "...", "body": "..." }, "nurseNote": { "sections": [{ "heading": "...", "body": "..." }] }, "verifyFlags": ["..."] }. No prose outside the JSON.`;

function summarizePA(pa) {
  const lines = [];
  lines.push(`Medication: ${pa.medicationName}`);
  lines.push(`Indication: ${pa.indication}`);
  lines.push(`Prescribing provider: ${pa.prescribingProvider}`);
  lines.push(`Insurance: ${pa.insurancePlan}`);
  lines.push(`Pharmacy: ${pa.pharmacy}`);
  lines.push(`Current stage: ${pa.currentStage}`);
  lines.push(`Created: ${pa.createdAt}`);
  lines.push(`Last updated: ${pa.lastUpdatedAt}`);
  lines.push("");
  lines.push("Stage history:");
  for (const s of pa.stageHistory || []) {
    lines.push(`- [${s.stage}] ${s.enteredAt} (actor: ${s.actor})`);
    if (s.note) lines.push(`  ${s.note}`);
    for (const a of s.artifacts || []) {
      lines.push(`  · artifact: ${a.type} — ${a.summary}`);
    }
  }
  return lines.join("\n");
}

function summarizePatientMessage(comm) {
  if (!comm) return "(no recent patient message)";
  return [
    `Direction: ${comm.direction}`,
    `Received: ${comm.receivedAt}`,
    "",
    comm.body,
  ].join("\n");
}

function buildUserMessage({ priorAuth, chartContext }) {
  const sections = [
    "## Prior Authorization",
    summarizePA(priorAuth),
    "",
    "## Latest patient message",
    summarizePatientMessage(priorAuth.latestPatientCommunication),
  ];
  if (chartContext?.patient) {
    sections.push("");
    sections.push("## Patient");
    sections.push(
      `${chartContext.patient.name}, ${chartContext.patient.gender} ${chartContext.patient.age}y`
    );
  }
  sections.push("");
  sections.push(
    "Generate the JSON now. The MyChart message must directly address the patient's frustration and clearly explain the current PA stage. Output JSON only."
  );
  return sections.join("\n");
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

export async function generatePAStatusUpdate({ priorAuth, chartContext }) {
  const userMessage = buildUserMessage({ priorAuth, chartContext });
  const response = await createMessage({
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
    maxTokens: 3500,
  });
  const text = response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");
  let parsed;
  try {
    parsed = extractJSON(text);
  } catch (err) {
    const e = new Error(`PA status update JSON parse failed: ${err.message}`);
    e.rawResponse = text;
    throw e;
  }
  if (!parsed.mychartMessage?.body || !parsed.nurseNote?.sections) {
    const e = new Error("PA status update JSON missing required fields");
    e.rawResponse = text;
    e.parsed = parsed;
    throw e;
  }
  return {
    mychartMessage: {
      subject: parsed.mychartMessage.subject || "",
      body: parsed.mychartMessage.body,
    },
    nurseNote: { sections: parsed.nurseNote.sections },
    verifyFlags: Array.isArray(parsed.verifyFlags) ? parsed.verifyFlags : [],
    generatedAt: new Date().toISOString(),
    model: KAIROS_OPUS_MODEL,
  };
}
