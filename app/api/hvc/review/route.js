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

    // Get start of today in UTC
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    const { data, error } = await db
      .from("encounters")
      .select("*")
      .gte("created_at", startOfDay)
      .order("created_at", { ascending: true });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ encounters: data || [] });
  } catch (err) {
    console.error("Review API Error:", err);
    return Response.json({ error: "Failed to fetch today's encounters" }, { status: 500 });
  }
}
