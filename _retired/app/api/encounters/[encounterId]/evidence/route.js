import { NextResponse } from "next/server";
import {
  getEvidenceForEncounterServer,
  addEvidenceServer,
} from "@/lib/state/evidence";

export async function GET(_request, { params }) {
  try {
    const { encounterId } = await params;
    const data = await getEvidenceForEncounterServer(encounterId);
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const { encounterId } = await params;
    const item = await request.json();
    if (!item?.questionText || !item?.answer || !item?.source) {
      return NextResponse.json(
        { error: "questionText, answer, and source are required" },
        { status: 400 },
      );
    }
    const saved = await addEvidenceServer(encounterId, item);
    return NextResponse.json(saved, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
