// /api/provider-chat — chart-grounded Q&A for the /provider briefing
// drawer. Loads the patient's 12-section briefing fixture, ships it to
// Claude Sonnet as a cacheable system block, and returns a structured
// answer + cited section numbers.
//
// Request:  { question, briefingId, specialty }
// Response: { answer, citedSections: ["06"], notFound: false }

import Anthropic from "@anthropic-ai/sdk";

import CARDIOLOGY_BRIEFINGS from "@/lib/fixtures/providerBriefings.cardiology";
import PULMONOLOGY_BRIEFINGS from "@/lib/fixtures/providerBriefings.pulmonology";
import INTERNAL_MEDICINE_BRIEFINGS from "@/lib/fixtures/providerBriefings.internalMedicine";
import { serializeBriefing } from "@/lib/provider/serializeBriefing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BRIEFINGS_BY_SPECIALTY = {
  cardiology: CARDIOLOGY_BRIEFINGS,
  pulmonology: PULMONOLOGY_BRIEFINGS,
  internalMedicine: INTERNAL_MEDICINE_BRIEFINGS,
};

const SYSTEM_PROMPT =
  "You are a clinical chart assistant for a provider reviewing a patient's record. " +
  "You answer questions ONLY from the patient chart context provided below. " +
  "You do not invent, infer, or extrapolate beyond what is explicitly documented in the context.\n\n" +
  "RULES:\n" +
  "1. Answer concisely — 1-3 sentences maximum unless the question explicitly requires a list.\n" +
  "2. ALWAYS cite the section number(s) where the answer was found, formatted as 'Section 06' at the end of your answer.\n" +
  "3. If the answer is NOT in the provided context, respond exactly: 'Not documented in chart.' Then suggest which section the provider could check or what data would need to be added. Do not guess.\n" +
  "4. Do not provide clinical advice, recommendations, or interpretations beyond what is documented. You are a retrieval tool, not a clinical decision support system.\n" +
  "5. Keep medical terminology — the audience is a physician, not a patient.\n\n" +
  "Output format: respond ONLY with valid JSON in this exact shape, no prose before or after:\n" +
  '{"answer": "<your 1-3 sentence answer ending with the cited Section reference>", "citedSections": ["06"], "notFound": false}\n' +
  "citedSections is an array of two-digit zero-padded section numbers (\"01\"-\"12\"). " +
  "Set notFound to true ONLY when the chart does not contain the answer.";

function extractJson(text) {
  if (!text) return null;
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { question, briefingId, specialty } = body || {};

  if (!question || typeof question !== "string" || question.trim().length === 0) {
    return Response.json({ error: "question is required" }, { status: 400 });
  }
  if (!briefingId || !specialty) {
    return Response.json(
      { error: "briefingId and specialty are required" },
      { status: 400 }
    );
  }

  const fixtures = BRIEFINGS_BY_SPECIALTY[specialty];
  if (!fixtures) {
    return Response.json({ error: `Unknown specialty: ${specialty}` }, { status: 400 });
  }
  const briefing = fixtures[briefingId];
  if (!briefing) {
    return Response.json(
      { error: `No chart found for briefingId=${briefingId}` },
      { status: 404 }
    );
  }

  const apiKey = process.env.KAIROS_ANTHROPIC_KEY || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "Anthropic API key not configured on server" },
      { status: 500 }
    );
  }

  const client = new Anthropic({ apiKey });

  const chartText = serializeBriefing(briefing);

  // System blocks — second block carries the chart and is cached so
  // repeated questions about the same patient hit the cache.
  const systemBlocks = [
    {
      type: "text",
      text: SYSTEM_PROMPT,
    },
    {
      type: "text",
      text:
        "PATIENT CHART CONTEXT:\n" +
        chartText +
        "\n\nEnd of chart context.",
      cache_control: { type: "ephemeral" },
    },
  ];

  try {
    const resp = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 800,
      system: systemBlocks,
      messages: [{ role: "user", content: question.trim() }],
    });

    let raw = "";
    if (resp && Array.isArray(resp.content)) {
      for (const block of resp.content) {
        if (block && block.type === "text" && block.text) raw += block.text;
      }
    }

    const parsed = extractJson(raw);
    if (parsed && typeof parsed.answer === "string") {
      const cited = Array.isArray(parsed.citedSections)
        ? parsed.citedSections
            .map((s) => String(s).padStart(2, "0"))
            .filter((s) => /^[0-1][0-9]$/.test(s))
        : [];
      return Response.json({
        answer: parsed.answer,
        citedSections: cited,
        notFound: parsed.notFound === true,
      });
    }

    // Fallback — model returned prose instead of JSON. Try to pull
    // section citations out of the text and return as-is.
    const matches = raw.match(/Section\s+(\d{2})/gi) || [];
    const cited = matches
      .map((m) => m.match(/(\d{2})/)[1])
      .filter((v, i, arr) => arr.indexOf(v) === i);
    return Response.json({
      answer: raw.trim() || "Could not retrieve answer. Please try again.",
      citedSections: cited,
      notFound: /not\s+documented\s+in\s+chart/i.test(raw),
    });
  } catch (err) {
    return Response.json(
      {
        error: "Chart chat request failed",
        message: err && err.message ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
