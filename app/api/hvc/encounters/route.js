import { getSupabase } from "@/lib/hvc/supabase";

export async function GET(request) {
  try {
    var missingEnv = [];
    if (!process.env.SUPABASE_URL) missingEnv.push('SUPABASE_URL');
    if (!process.env.SUPABASE_SERVICE_KEY) missingEnv.push('SUPABASE_SERVICE_KEY');
    if (missingEnv.length > 0) {
      return Response.json({ error: 'Missing required env var: ' + missingEnv.join(', ') }, { status: 500 });
    }

    const db = getSupabase();
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

    if (code) {
      const { data, error } = await db
        .from("encounters")
        .select("*")
        .eq("patient_code", code)
        .order("created_at", { ascending: false });
      if (error) return Response.json({ error: error.message }, { status: 500 });
      return Response.json({ encounters: data || [] });
    }

    const { data, error } = await db
      .from("encounters")
      .select("patient_code, created_at")
      .order("created_at", { ascending: false });

    if (error) return Response.json({ error: error.message }, { status: 500 });

    const codeMap = {};
    for (const row of (data || [])) {
      if (!codeMap[row.patient_code]) {
        codeMap[row.patient_code] = {
          code: row.patient_code,
          lastSeen: row.created_at,
          count: 0,
        };
      }
      codeMap[row.patient_code].count++;
    }

    const codes = Object.values(codeMap).sort(
      (a, b) => new Date(b.lastSeen) - new Date(a.lastSeen)
    );

    return Response.json({ codes });
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
    const { patient_code, workflow, subtype, fields, output } = await request.json();

    const { data, error } = await db
      .from("encounters")
      .insert({
        patient_code,
        workflow,
        subtype: subtype || null,
        fields: fields || {},
        output: output || null,
      })
      .select()
      .single();

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ encounter: data });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    var missingEnv = [];
    if (!process.env.SUPABASE_URL) missingEnv.push('SUPABASE_URL');
    if (!process.env.SUPABASE_SERVICE_KEY) missingEnv.push('SUPABASE_SERVICE_KEY');
    if (missingEnv.length > 0) {
      return Response.json({ error: 'Missing required env var: ' + missingEnv.join(', ') }, { status: 500 });
    }

    const db = getSupabase();
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const id = searchParams.get("id");

    if (id) {
      const { error } = await db.from("encounters").delete().eq("id", id);
      if (error) return Response.json({ error: error.message }, { status: 500 });
      return Response.json({ deleted: true });
    }

    if (code) {
      const { error } = await db.from("encounters").delete().eq("patient_code", code);
      if (error) return Response.json({ error: error.message }, { status: 500 });
      return Response.json({ deleted: true });
    }

    return Response.json({ error: "Provide code or id" }, { status: 400 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
