import { generateDualOutput } from "@/lib/prompts/dualOutput";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { chartContext, resultNote, evidence } = body || {};
  if (!chartContext?.patient) {
    return Response.json({ error: "chartContext.patient is required" }, { status: 400 });
  }
  if (!resultNote?.body) {
    return Response.json({ error: "resultNote.body is required" }, { status: 400 });
  }

  try {
    const draft = await generateDualOutput({ chartContext, resultNote, evidence: evidence || [] });
    return Response.json({ draft });
  } catch (err) {
    return Response.json(
      {
        error: "Dual-output generation failed",
        message: err.message,
        rawResponse: err.rawResponse,
        parsed: err.parsed,
      },
      { status: 500 }
    );
  }
}
