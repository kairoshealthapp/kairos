import {
  getPreVisitTask,
  updateDiscrepancyResolution,
} from "@/lib/state/preVisitTasks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { taskId, discrepancyId, action, actor, actorRole, reason } = body || {};
  if (!taskId || !discrepancyId || !action) {
    return Response.json(
      { error: "taskId, discrepancyId and action are required" },
      { status: 400 }
    );
  }
  if (!["dismissed", "escalated", "updated"].includes(action)) {
    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  }
  const task = getPreVisitTask(taskId);
  if (!task) {
    return Response.json({ error: `No task ${taskId}` }, { status: 404 });
  }

  const resolution = {
    action,
    actor: actor || "ma_demo",
    actorRole: actorRole || "MA",
    reason: reason || "",
    timestamp: new Date().toISOString(),
  };
  updateDiscrepancyResolution(taskId, discrepancyId, resolution);

  return Response.json({ resolution });
}
