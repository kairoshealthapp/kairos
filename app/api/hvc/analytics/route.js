import { getSupabase } from "@/lib/hvc/supabase";

export async function GET() {
  try {
    var missingEnv = [];
    if (!process.env.SUPABASE_URL) missingEnv.push('SUPABASE_URL');
    if (!process.env.SUPABASE_SERVICE_KEY) missingEnv.push('SUPABASE_SERVICE_KEY');
    if (missingEnv.length > 0) {
      return Response.json({ error: 'Missing required env var: ' + missingEnv.join(', ') }, { status: 500 });
    }

    const db = getSupabase();

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    // Start of this week (Sunday)
    const dayOfWeek = now.getDay();
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek).toISOString();

    // Start of this month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // Start of 7 days ago
    const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6).toISOString();

    // Fetch all encounters from this month (covers today, week, and month)
    const { data: monthData, error: monthErr } = await db
      .from("encounters")
      .select("id, workflow, created_at")
      .gte("created_at", startOfMonth)
      .order("created_at", { ascending: true });

    if (monthErr) {
      return Response.json({ error: monthErr.message }, { status: 500 });
    }

    // Total count (all time)
    const { count: totalCount, error: countErr } = await db
      .from("encounters")
      .select("id", { count: "exact", head: true });

    if (countErr) {
      return Response.json({ error: countErr.message }, { status: 500 });
    }

    const encounters = monthData || [];

    // Today
    const todayCount = encounters.filter((e) => e.created_at >= startOfToday).length;

    // This week
    const weekCount = encounters.filter((e) => e.created_at >= startOfWeek).length;

    // This month
    const monthCount = encounters.length;

    // Workflow breakdown (all time would require another query, so use month)
    // Actually let's get all-time workflow breakdown
    const { data: allData, error: allErr } = await db
      .from("encounters")
      .select("workflow");

    if (allErr) {
      return Response.json({ error: allErr.message }, { status: 500 });
    }

    const byWorkflow = {};
    for (const e of allData || []) {
      const w = e.workflow || "Unknown";
      byWorkflow[w] = (byWorkflow[w] || 0) + 1;
    }

    // Last 7 days breakdown
    const last7 = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dayStart = d.toISOString();
      const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).toISOString();
      const dayLabel = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
      const count = encounters.filter((e) => e.created_at >= dayStart && e.created_at < dayEnd).length;
      last7.push({ label: dayLabel, count });
    }

    return Response.json({
      today: todayCount,
      week: weekCount,
      month: monthCount,
      total: totalCount || 0,
      byWorkflow,
      last7,
    });
  } catch (err) {
    console.error("Analytics API Error:", err);
    return Response.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
