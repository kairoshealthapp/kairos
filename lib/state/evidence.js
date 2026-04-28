// Supabase-backed evidence store. Evidence items are captured during a triage
// encounter (TriageWorkspace + EvidenceCapture). Persisted in kairos_evidence,
// keyed by encounter_id.

import { getServerClient } from "../supabase/client";

export async function getEvidenceForEncounterServer(encounterId) {
  const supabase = getServerClient();
  const { data, error } = await supabase
    .from("kairos_evidence")
    .select("*")
    .eq("encounter_id", encounterId)
    .order("captured_at", { ascending: true });
  if (error) throw error;
  return data.map(toClientShape);
}

export async function addEvidenceServer(encounterId, item) {
  const supabase = getServerClient();
  const row = {
    id: item.id,
    encounter_id: encounterId,
    question_id: item.questionId,
    question_text: item.questionText,
    answer: item.answer,
    source: item.source,
    source_detail: item.sourceDetail ?? null,
    captured_at: item.capturedAt,
  };
  const { data, error } = await supabase
    .from("kairos_evidence")
    .insert(row)
    .select()
    .single();
  if (error) throw error;
  return toClientShape(data);
}

export async function removeEvidenceServer(encounterId, evidenceId) {
  const supabase = getServerClient();
  const { error } = await supabase
    .from("kairos_evidence")
    .delete()
    .eq("encounter_id", encounterId)
    .eq("id", evidenceId);
  if (error) throw error;
}

function toClientShape(row) {
  return {
    id: row.id,
    questionId: row.question_id,
    questionText: row.question_text,
    answer: row.answer,
    source: row.source,
    sourceDetail: row.source_detail || "",
    capturedAt: row.captured_at,
  };
}
