// Dual-output generator — given a provider Result Note plus chart context,
// produces TWO outputs from the same source material:
//   1. MyChart message to the patient (5th-grade reading level, plain language)
//   2. Nurse Note for Epic addendum (clinical density, [verify: ...] flags)
//
// Same primitive as the SBAR regenerator: structured prompt, JSON output,
// inline source attribution, no fabrication beyond chart + Result Note + any
// captured evidence.

import { createMessage, KAIROS_OPUS_MODEL } from "../claude/client.js";

const SYSTEM_PROMPT = `You are a clinical documentation assistant for a cardiology RN. The provider has sent a Result Note with clinical questions. Your job is to draft TWO outputs simultaneously from the same source material:

1. **MyChart message to the patient** — warm, plain-language, 5th-grade reading level. Confirms what was checked, asks the provider's questions in patient-friendly language, reassures where appropriate, ends with clear next step.
2. **Nurse Note (for Epic addendum, cosign-routed to provider)** — clinical synthesis, bullet/sectioned, references chart data, tags any items requiring nurse verification with [verify: <what>] flag markers.

Rules:
- Both outputs draw from the same chart context and provider Result Note. Same facts, two audiences.
- Patient message: NO clinical jargon. "AST" becomes "liver enzyme." "LDL" becomes "bad cholesterol." Specific numbers OK if explained.
- Nurse Note: full clinical density. Cite chart values verbatim. Flag uncertainties with [verify: ...].
- If chart data conflicts with provider Result Note, surface the conflict explicitly in the Nurse Note. Never paper over.
- Output JSON only: { "mychartMessage": { "subject": "...", "body": "..." }, "nurseNote": { "sections": [{ "heading": "...", "body": "..." }] }, "verifyFlags": ["..."] }. No prose outside the JSON.`;

function summarizeChart(chartContext) {
  if (!chartContext?.patient) return "No chart context available.";
  const { patient, conditions, medications, recentLabs, recentNotes } = chartContext;
  const lines = [];
  lines.push(`Patient: ${patient.name}, ${patient.gender} ${patient.age}y (DOB ${patient.birthDate})`);
  if (conditions?.length) {
    lines.push("");
    lines.push("Active problems:");
    conditions.forEach((c) => lines.push(`- ${c.name}${c.onset ? ` (onset ${c.onset})` : ""}`));
  }
  const active = (medications || []).filter((m) => m.status === "active");
  if (active.length) {
    lines.push("");
    lines.push("Active medications:");
    active.forEach((m) => lines.push(`- ${m.name}`));
  }
  if (recentLabs?.length) {
    lines.push("");
    lines.push("Recent labs:");
    recentLabs.forEach((o) => {
      const flag = o.flag ? ` [${o.flag}]` : "";
      lines.push(`- ${o.name}: ${o.value}${flag} (${o.date?.slice(0, 10) || ""})`);
    });
  }
  if (recentNotes?.length) {
    lines.push("");
    lines.push("Recent notes:");
    recentNotes.forEach((d) => {
      lines.push(`- ${d.type} (${d.date?.slice(0, 10) || ""}${d.author ? `, ${d.author}` : ""})`);
      if (d.description) lines.push(`  ${d.description}`);
    });
  }
  return lines.join("\n");
}

function summarizeEvidence(evidence) {
  if (!evidence?.length) return "(no captured evidence yet)";
  return evidence
    .map((e, i) => {
      const sourceTag =
        e.source === "outside_clinician"
          ? `outside RN${e.sourceDetail ? `: ${e.sourceDetail}` : ""}`
          : e.source === "patient"
          ? "pt"
          : e.source === "nurse_observation"
          ? "nurse obs"
          : e.source;
      return `${i + 1}. Q: ${e.questionText}\n   A: ${e.answer}\n   Source: [${sourceTag}]`;
    })
    .join("\n\n");
}

function buildUserMessage({ chartContext, resultNote, evidence }) {
  return [
    "## Provider Result Note",
    resultNote?.subject ? `Subject: ${resultNote.subject}` : "",
    resultNote?.author ? `Author: ${resultNote.author}` : "",
    "",
    resultNote?.body || "(no body)",
    "",
    "## Chart context",
    summarizeChart(chartContext),
    "",
    "## Captured evidence (e.g. patient replies via MyChart)",
    summarizeEvidence(evidence),
    "",
    "Generate the JSON now. Patient-facing message in plain language, nurse note clinically dense with [verify: ...] flags where needed. Output JSON only.",
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

export async function generateDualOutput({ chartContext, resultNote, evidence }) {
  const userMessage = buildUserMessage({ chartContext, resultNote, evidence });
  const response = await createMessage({
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
    maxTokens: 4000,
  });
  const text = response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");
  let parsed;
  try {
    parsed = extractJSON(text);
  } catch (err) {
    const e = new Error(`Dual-output JSON parse failed: ${err.message}`);
    e.rawResponse = text;
    throw e;
  }
  if (!parsed.mychartMessage?.body || !parsed.nurseNote?.sections) {
    const e = new Error("Dual-output JSON missing required fields");
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
