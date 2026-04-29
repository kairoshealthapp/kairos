import { NextResponse } from "next/server";
import { getAttestationsForActorServer } from "@/lib/state/attestations";

// v7: actor identity is hardcoded since there's no auth layer yet. Auth lands in v8.
const CURRENT_ACTOR = "ma_demo";

export async function GET() {
  try {
    const data = await getAttestationsForActorServer(CURRENT_ACTOR);
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
