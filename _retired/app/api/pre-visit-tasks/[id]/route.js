import { NextResponse } from "next/server";
import { getPreVisitTaskServer } from "@/lib/state/preVisitTasks";

export async function GET(_request, { params }) {
  try {
    const { id } = await params;
    const task = await getPreVisitTaskServer(id);
    if (!task) {
      return NextResponse.json({ error: "task not found" }, { status: 404 });
    }
    return NextResponse.json(task);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
