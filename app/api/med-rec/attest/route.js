import { appendAttestationServer } from "@/lib/state/attestations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    taskId,
    encounterId,
    patientId,
    patientName,
    clickType,
    discrepancyCount,
    unresolvedCount,
    actor,
    actorRole,
  } = body || {};
  if (!taskId || !clickType) {
    return Response.json({ error: "taskId and clickType are required" }, { status: 400 });
  }

  try {
    const entry = await appendAttestationServer({
      taskId,
      encounterId: encounterId || null,
      patientId: patientId || null,
      patientName: patientName || "",
      actor: actor || "ma_demo",
      actorRole: actorRole || "MA",
      clickType,
      clickedAt: new Date().toISOString(),
      earned: (unresolvedCount ?? 0) === 0,
      discrepancyCount: discrepancyCount ?? 0,
      unresolvedCount: unresolvedCount ?? 0,
    });
    return Response.json({ entry });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
