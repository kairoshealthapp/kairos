import { generatePAStatusUpdate } from "@/lib/prompts/paStatusUpdate";
import { getPriorAuthRequest } from "@/lib/state/priorAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { priorAuthId, chartContext } = body || {};
  if (!priorAuthId) {
    return Response.json({ error: "priorAuthId is required" }, { status: 400 });
  }
  const pa = getPriorAuthRequest(priorAuthId);
  if (!pa) {
    return Response.json({ error: `No PA ${priorAuthId}` }, { status: 404 });
  }

  try {
    const draft = await generatePAStatusUpdate({ priorAuth: pa, chartContext });
    return Response.json({ draft });
  } catch (err) {
    return Response.json(
      {
        error: "PA status update generation failed",
        message: err.message,
        rawResponse: err.rawResponse,
        parsed: err.parsed,
      },
      { status: 500 }
    );
  }
}
