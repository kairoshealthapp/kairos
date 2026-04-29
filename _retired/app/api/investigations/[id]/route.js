import { NextResponse } from "next/server";
import { getInvestigationServer } from "@/lib/state/investigations";

export async function GET(_request, { params }) {
  try {
    const { id } = await params;
    const inv = await getInvestigationServer(id);
    if (!inv) {
      return NextResponse.json(
        { error: "investigation not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(inv);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
