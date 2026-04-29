import { generateCohortOutreach } from "@/lib/prompts/cohortOutreach";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { cohortMember, cohortDefinition } = body || {};
  if (!cohortMember?.patientId) {
    return Response.json({ error: "cohortMember.patientId is required" }, { status: 400 });
  }

  try {
    const draft = await generateCohortOutreach({ cohortMember, cohortDefinition });
    return Response.json({ draft });
  } catch (err) {
    return Response.json(
      {
        error: "Cohort-outreach generation failed",
        message: err.message,
        rawResponse: err.rawResponse,
        parsed: err.parsed,
      },
      { status: 500 }
    );
  }
}
