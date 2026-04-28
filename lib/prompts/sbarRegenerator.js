// SBAR regenerator prompt + driver. Produces a Situation / Background /
// Assessment / Recommendation note grounded in the chart context and the
// captured (source-tagged) evidence array. Versioned: each call returns a
// new SBARVersion whose evidenceHash matches the input evidence at call
// time.

import { createMessage, KAIROS_OPUS_MODEL } from "../claude/client.js";
import { hashEvidence } from "../types/evidence.js";

const SYSTEM_PROMPT = `You are a clinical documentation assistant generating SBAR notes for a cardiology RN. SBAR = Situation / Background / Assessment / Recommendation.

Rules:
- Use only information present in the chart context or the captured evidence. Do not infer, fabricate, or extrapolate.
- Every clinical claim must be traceable to either chart data or an evidence item. If something is unknown, say so explicitly ("Unable to assess pain pattern — not yet asked").
- Tag the source of each piece of information inline using brief markers: [chart], [pt], [family], [outside RN: name], [nurse obs].
- Be concise. Clinical SBARs are dense. No throat-clearing.
- Calibrate confidence. "Patient reports increasing dyspnea x3 days [pt]" not "Patient has worsening CHF."
- Assessment section is the nurse's clinical synthesis based on evidence — flag genuine concerns, distinguish confirmed findings from concerns requiring further data.
- Recommendation section proposes next actions for the prescribing clinician (NOT the nurse — the nurse is calling/messaging the provider with this SBAR). Frame as "recommend X" or "request X consideration."
- Output JSON only: { "situation": "...", "background": "...", "assessment": "...", "recommendation": "..." }. No prose outside the JSON.`;

function summarizeChart(chartContext) {
  if (!chartContext?.patient) return "No chart context available.";
  const { patient, encounter, conditions, medications, recentVitals, recentLabs, recentNotes, bpLog } =
    chartContext;
  const lines = [];
  lines.push(
    `Patient: ${patient.name}, ${patient.gender} ${patient.age}y (DOB ${patient.birthDate})`
  );
  if (encounter) {
    lines.push(`Encounter: ${encounter.type} on ${encounter.start}`);
    if (encounter.reason) lines.push(`Reason: ${encounter.reason}`);
  }
  if (conditions?.length) {
    lines.push("");
    lines.push("Active problems:");
    conditions.forEach((c) =>
      lines.push(`- ${c.name}${c.onset ? ` (onset ${c.onset})` : ""}`)
    );
  }
  const active = (medications || []).filter((m) => m.status === "active");
  const stopped = (medications || []).filter((m) => m.status === "stopped");
  if (active.length) {
    lines.push("");
    lines.push("Active medications:");
    active.forEach((m) => lines.push(`- ${m.name}`));
  }
  if (stopped.length) {
    lines.push("");
    lines.push("Recently stopped medications:");
    stopped.forEach((m) =>
      lines.push(
        `- ${m.name}${m.discontinuedDate ? ` (d/c ${m.discontinuedDate})` : ""}${
          m.statusReason ? ` — ${m.statusReason}` : ""
        }`
      )
    );
  }
  if (recentLabs?.length) {
    lines.push("");
    lines.push("Recent labs:");
    recentLabs.forEach((o) => {
      const flag = o.flag ? ` [${o.flag}]` : "";
      lines.push(`- ${o.name}: ${o.value}${flag} (${o.date?.slice(0, 10) || ""})`);
    });
  }
  if (recentVitals?.length) {
    lines.push("");
    lines.push("Recent vitals:");
    recentVitals.forEach((o) =>
      lines.push(`- ${o.name}: ${o.value} (${o.date?.slice(0, 10) || ""})`)
    );
  }
  if (recentNotes?.length) {
    lines.push("");
    lines.push("Recent notes:");
    recentNotes.forEach((d) => {
      lines.push(`- ${d.type} (${d.date?.slice(0, 10) || ""}${d.author ? `, ${d.author}` : ""})`);
      if (d.description) lines.push(`  ${d.description}`);
    });
  }
  if (bpLog?.summary) {
    const s = bpLog.summary;
    lines.push("");
    lines.push(
      `Home BP log (${bpLog.capturedFrom || "log"}, ${s.count} readings ${s.dateRange}, trend ${s.trend}):`
    );
    lines.push(
      `- Avg ${s.avgSBP}/${s.avgDBP} mmHg, max SBP ${s.maxSBP}, min SBP ${s.minSBP}`
    );
    lines.push(
      `- ${s.pctAbove140}% ≥140, ${s.pctAbove150}% ≥150, ${s.pctAbove160}% ≥160`
    );
    if (s.significantReadings?.length) {
      lines.push("- Notable readings:");
      s.significantReadings.slice(0, 8).forEach((r) => {
        lines.push(
          `  ${r.date} ${r.time} — ${r.sbp}/${r.dbp}${r.note ? ` (${r.note})` : ""} [${r.reason}]`
        );
      });
    }
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
      const detail = e.sourceDetail && e.source !== "outside_clinician" ? ` (${e.sourceDetail})` : "";
      return `${i + 1}. Q: ${e.questionText}\n   A: ${e.answer}\n   Source: [${sourceTag}]${detail}`;
    })
    .join("\n\n");
}

function buildUserMessage({ chartContext, evidence, encounterContext }) {
  const callerLine = encounterContext?.callerContext
    ? `Caller: ${encounterContext.callerContext.callerName || ""} (${
        encounterContext.callerContext.callerType || ""
      })`
    : "";
  return [
    "## Encounter context",
    encounterContext?.type ? `Type: ${encounterContext.type}` : "",
    encounterContext?.reason ? `Reason: ${encounterContext.reason}` : "",
    callerLine,
    "",
    "## Chart context",
    summarizeChart(chartContext),
    "",
    "## Captured evidence",
    summarizeEvidence(evidence),
    "",
    "Generate the SBAR JSON now. Use inline source markers ([chart], [pt], [family], [outside RN: name], [nurse obs]) on every clinical claim. Output JSON only.",
  ]
    .filter(Boolean)
    .join("\n");
}

function extractJSON(text) {
  if (!text) throw new Error("Empty response from model");
  const trimmed = text.trim();
  // Strip code fences if present
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  const candidate = fenceMatch ? fenceMatch[1] : trimmed;
  // Extract the first {...} JSON object greedily — Claude sometimes adds a
  // trailing newline or a stray sentence; we want the JSON object only.
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error(`No JSON object found in model response: ${candidate.slice(0, 200)}`);
  }
  return JSON.parse(candidate.slice(start, end + 1));
}

/**
 * Run the SBAR regeneration. Returns an SBARVersion (without the version
 * field — the caller assigns the version index based on prior history).
 *
 * @param {{
 *   chartContext: any,
 *   evidence: import('../types/evidence.js').EvidenceItem[],
 *   encounterContext: any,
 * }} params
 */
export async function regenerateSBAR({ chartContext, evidence, encounterContext }) {
  const userMessage = buildUserMessage({ chartContext, evidence, encounterContext });
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
    const e = new Error(`SBAR JSON parse failed: ${err.message}`);
    e.rawResponse = text;
    throw e;
  }
  const required = ["situation", "background", "assessment", "recommendation"];
  for (const k of required) {
    if (typeof parsed[k] !== "string") {
      const e = new Error(`SBAR JSON missing required field: ${k}`);
      e.rawResponse = text;
      e.parsed = parsed;
      throw e;
    }
  }
  return {
    situation: parsed.situation,
    background: parsed.background,
    assessment: parsed.assessment,
    recommendation: parsed.recommendation,
    evidenceHash: hashEvidence(evidence),
    evidenceCount: evidence?.length || 0,
    generatedAt: new Date().toISOString(),
    model: KAIROS_OPUS_MODEL,
  };
}
