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
    const { data, error } = await db
      .from("app_settings")
      .select("value, updated_at")
      .eq("key", "system_prompt")
      .single();

    if (error && error.code !== "PGRST116") {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({
      prompt: data?.value || "",
      lastUpdated: data?.updated_at || null,
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    var missingEnv = [];
    if (!process.env.SUPABASE_URL) missingEnv.push('SUPABASE_URL');
    if (!process.env.SUPABASE_SERVICE_KEY) missingEnv.push('SUPABASE_SERVICE_KEY');
    if (missingEnv.length > 0) {
      return Response.json({ error: 'Missing required env var: ' + missingEnv.join(', ') }, { status: 500 });
    }

    const db = getSupabase();
    const { prompt } = await request.json();

    if (!prompt || !prompt.trim()) {
      return Response.json({ error: "Prompt cannot be empty" }, { status: 400 });
    }

    const { error } = await db
      .from("app_settings")
      .upsert({
        key: "system_prompt",
        value: prompt.trim(),
        updated_at: new Date().toISOString(),
      });

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
