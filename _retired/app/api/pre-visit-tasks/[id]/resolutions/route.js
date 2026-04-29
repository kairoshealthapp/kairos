import { NextResponse } from "next/server";
import { appendDiscrepancyResolutionServer } from "@/lib/state/preVisitTasks";

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { discrepancyId, action, actor, actorRole, reason } = body || {};
    if (!discrepancyId || !action) {
      return NextResponse.json(
        { error: "discrepancyId and action are required" },
        { status: 400 },
      );
    }
    if (!["dismissed", "escalated", "updated"].includes(action)) {
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
    const resolution = await appendDiscrepancyResolutionServer(id, discrepancyId, {
      action,
      actor: actor || "ma_demo",
      actorRole: actorRole || "MA",
      reason: reason || "",
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json({ resolution });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
