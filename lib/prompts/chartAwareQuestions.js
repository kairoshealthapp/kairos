// Chart-aware triage question generator. Given a patient's chart context and
// the caller context (patient/family/outside_clinician), generates a structured
// JSON list of triage questions weighted by the patient's specific comorbidities
// and recent clinical events.
//
// Reliability principles (binding):
//   - Never assert "patient has X" — always frame as "based on chart, consider Y"
//   - Every question carries an explicit rationale tied to a chart finding
//   - Caller context shifts framing: outside-clinician inbound is peer handoff,
//     patient/family inbound is symptom interview
//   - Confidence is calibrated; uncertainty in source data is named, not hidden

import { createMessage } from "../claude/client.js";
import { hashChartContext } from "../fhir/chartContext.js";

const SYSTEM_PROMPT = `You are a clinical triage question generator for outpatient cardiology nurses.

Your job: given a patient's chart context and the identity of the inbound caller, produce a structured set of triage questions weighted toward the patient's specific clinical risks.

Binding rules:
1. Never assert findings about the patient. Always frame as "based on chart, consider..." or "given history of X, ask about Y".
2. Every question must carry an explicit rationale tying it to a specific chart finding (a condition, a medication change, a recent lab, a recent note).
3. Calibrate confidence. If a chart datum is uncertain, stale, or conflicting, say so in the rationale rather than treating it as fact.
4. Caller context changes framing:
   - patient or family: symptom interview, plain language, capture lay descriptions
   - outside_clinician (e.g., visiting nurse, PCP nurse): peer-to-peer handoff, accept clinical shorthand, cross-check what the outside clinician already assessed
5. Organize questions by organ system or clinical theme (respiratory, cardiac, volume status, medication-related, functional, prior-procedure history, red flags).
6. Prioritize questions that distinguish between competing differentials suggested by the chart.
7. Respect prior patient experience documented in notes (e.g., procedures the patient tolerated poorly).
8. Output strict JSON matching the schema below. No prose, no markdown fences, no commentary outside the JSON.

Output JSON schema:
{
  "questions": [
    {
      "id": "q_001",
      "category": "<organ system or theme>",
      "rationale": "<which chart finding this addresses; flag uncertainty if relevant>",
      "question": "<the question to ask>",
      "answerType": "<scale_with_comparison | yes_no | open_text | numeric | categorical>",
      "expectedRange": "<short hint about expected answer shape>"
    }
  ],
  "metadata": {
    "questionCount": <integer>,
    "generatedAt": "<ISO 8601 timestamp>",
    "chartContextHash": "<hash provided in input>"
  }
}`;

function buildUserMessage(chartContext, callerContext, contextHash) {
  return `CHART CONTEXT (FHIR-derived summary):
${JSON.stringify(chartContext, null, 2)}

CALLER CONTEXT:
${JSON.stringify(callerContext, null, 2)}

CHART CONTEXT HASH (echo this back in metadata.chartContextHash):
${contextHash}

Generate the triage question set as JSON per the schema. Aim for ~25-35 questions covering the chart's clinical priorities. The exact count is a clinical judgment — generate as many as the chart actually warrants, no padding, no padding-down. Echo the chartContextHash in metadata. Use the current ISO timestamp for generatedAt.`;
}

function extractJson(text) {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  const candidate = fenceMatch ? fenceMatch[1] : trimmed;
  return JSON.parse(candidate);
}

export async function generateChartAwareQuestions(chartContext, callerContext) {
  const contextHash = hashChartContext(chartContext);
  const userMessage = buildUserMessage(chartContext, callerContext, contextHash);

  const response = await createMessage({
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
    maxTokens: 16000,
  });

  const text = response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");

  const parsed = extractJson(text);

  if (!parsed.metadata) parsed.metadata = {};
  parsed.metadata.chartContextHash = contextHash;
  if (!parsed.metadata.generatedAt) {
    parsed.metadata.generatedAt = new Date().toISOString();
  }
  if (!parsed.metadata.questionCount) {
    parsed.metadata.questionCount = parsed.questions?.length ?? 0;
  }

  return parsed;
}
