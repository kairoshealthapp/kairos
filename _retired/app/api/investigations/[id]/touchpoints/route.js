import { NextResponse } from "next/server";
import { addTouchpointServer } from "@/lib/state/investigations";

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const touchpoint = await request.json();
    if (!touchpoint?.kind || !touchpoint?.occurredAt || !touchpoint?.summary) {
      return NextResponse.json(
        { error: "kind, occurredAt, and summary are required" },
        { status: 400 },
      );
    }
    const updated = await addTouchpointServer(id, touchpoint);
    return NextResponse.json(updated, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
