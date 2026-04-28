import { NextResponse } from "next/server";
import { removeEvidenceServer } from "@/lib/state/evidence";

export async function DELETE(_request, { params }) {
  try {
    const { encounterId, evidenceId } = await params;
    await removeEvidenceServer(encounterId, evidenceId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
