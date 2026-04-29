import { NextResponse } from "next/server";
import { getSBARVersionsServer } from "@/lib/state/sbarVersions";

export async function GET(_request, { params }) {
  try {
    const { encounterId } = await params;
    const data = await getSBARVersionsServer(encounterId);
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
