import { assembleChartContext } from "@/lib/fhir/chartContext";
import { generateChartAwareQuestions } from "@/lib/prompts/chartAwareQuestions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { patientId, encounterId, callerContext } = body || {};
  if (!patientId) {
    return Response.json(
      { error: "patientId is required" },
      { status: 400 }
    );
  }

  const chartContext = await assembleChartContext(patientId, encounterId);
  if (!chartContext.patient) {
    return Response.json(
      { error: `No chart found for patientId=${patientId}` },
      { status: 404 }
    );
  }

  try {
    const result = await generateChartAwareQuestions(
      chartContext,
      callerContext || { callerType: "patient" }
    );
    return Response.json({
      chartContext,
      ...result,
    });
  } catch (err) {
    return Response.json(
      {
        error: "Question generation failed",
        message: err.message,
        chartContext,
      },
      { status: 500 }
    );
  }
}
