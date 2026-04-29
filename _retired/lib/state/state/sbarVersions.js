// Supabase-backed SBAR version history. Each click of "Generate SBAR" writes a
// new row with a monotonically increasing version per encounter. Old versions
// are retained for the audit trail.

import { getServerClient } from "../supabase/client";

export async function getSBARVersionsServer(encounterId) {
  const supabase = getServerClient();
  const { data, error } = await supabase
    .from("kairos_sbar_versions")
    .select("*")
    .eq("encounter_id", encounterId)
    .order("version", { ascending: true });
  if (error) throw error;
  return data.map(toClientShape);
}

export async function appendSBARVersionServer(encounterId, sbar) {
  const supabase = getServerClient();

  const { data: maxRow, error: maxErr } = await supabase
    .from("kairos_sbar_versions")
    .select("version")
    .eq("encounter_id", encounterId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (maxErr) throw maxErr;
  const nextVersion = (maxRow?.version ?? 0) + 1;

  const row = {
    encounter_id: encounterId,
    version: nextVersion,
    situation: sbar.situation,
    background: sbar.background,
    assessment: sbar.assessment,
    recommendation: sbar.recommendation,
    evidence_hash: sbar.evidenceHash,
    evidence_count: sbar.evidenceCount,
    model: sbar.model,
    generated_at: sbar.generatedAt,
  };
  const { data, error } = await supabase
    .from("kairos_sbar_versions")
    .insert(row)
    .select()
    .single();
  if (error) throw error;
  return toClientShape(data);
}

function toClientShape(row) {
  return {
    id: row.id,
    encounterId: row.encounter_id,
    version: row.version,
    situation: row.situation,
    background: row.background,
    assessment: row.assessment,
    recommendation: row.recommendation,
    evidenceHash: row.evidence_hash,
    evidenceCount: row.evidence_count,
    model: row.model,
    generatedAt: row.generated_at,
  };
}
