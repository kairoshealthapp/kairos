import { appendAttestationLog } from "@/lib/state/preVisitTasks";

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

  const entry = {
    id: `att_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
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
  };
  appendAttestationLog(entry);
  return Response.json({ entry });
}
