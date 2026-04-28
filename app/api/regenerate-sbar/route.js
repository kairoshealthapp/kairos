import { regenerateSBAR } from "@/lib/prompts/sbarRegenerator";
import { appendSBARVersionServer } from "@/lib/state/sbarVersions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { chartContext, evidence, encounterContext, encounterId } = body || {};
  if (!chartContext?.patient) {
    return Response.json(
      { error: "chartContext.patient is required" },
      { status: 400 }
    );
  }
  if (!Array.isArray(evidence)) {
    return Response.json(
      { error: "evidence must be an array" },
      { status: 400 }
    );
  }
  if (!encounterId) {
    return Response.json(
      { error: "encounterId is required" },
      { status: 400 }
    );
  }

  try {
    const generated = await regenerateSBAR({ chartContext, evidence, encounterContext });
    const persisted = await appendSBARVersionServer(encounterId, generated);
    return Response.json({ sbar: persisted });
  } catch (err) {
    return Response.json(
      {
        error: "SBAR generation failed",
        message: err.message,
        rawResponse: err.rawResponse,
        parsed: err.parsed,
      },
      { status: 500 }
    );
  }
}
