import { NextResponse } from "next/server";
import {
  getInvestigationsServer,
  createInvestigationServer,
} from "@/lib/state/investigations";

export async function GET() {
  try {
    const data = await getInvestigationsServer();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    if (!body?.id || !body?.patientId || !body?.title) {
      return NextResponse.json(
        { error: "id, patientId, and title are required" },
        { status: 400 },
      );
    }
    const created = await createInvestigationServer(body);
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
