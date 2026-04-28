import { generatePatientInstructions } from "@/lib/prompts/patientInstructions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { patient, scheduleResult } = body || {};
  if (!scheduleResult?.schedule) {
    return Response.json({ error: "scheduleResult.schedule is required" }, { status: 400 });
  }

  try {
    const instructions = await generatePatientInstructions({ patient, scheduleResult });
    return Response.json({ instructions });
  } catch (err) {
    return Response.json(
      {
        error: "Patient-instructions generation failed",
        message: err.message,
        rawResponse: err.rawResponse,
      },
      { status: 500 }
    );
  }
}
