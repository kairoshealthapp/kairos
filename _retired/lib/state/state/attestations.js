// Attestation log — append-only audit of every "Mark as Reviewed" click.
// Personal cognitive aid (per the v5 design memo). Aggregation is intentionally
// not exposed; the integrity log fetches the *current actor's* entries only.

import { getServerClient } from "../supabase/client";

export async function getAttestationsForActorServer(actorId) {
  const supabase = getServerClient();
  const { data, error } = await supabase
    .from("kairos_attestation_log")
    .select("*")
    .eq("actor_id", actorId)
    .order("clicked_at", { ascending: false });
  if (error) throw error;
  return data.map(toClientShape);
}

export async function getAttestationsForTaskServer(taskId) {
  const supabase = getServerClient();
  const { data, error } = await supabase
    .from("kairos_attestation_log")
    .select("*")
    .eq("pre_visit_task_id", taskId)
    .order("clicked_at", { ascending: false });
  if (error) throw error;
  return data.map(toClientShape);
}

export async function appendAttestationServer(entry) {
  const supabase = getServerClient();
  const row = {
    pre_visit_task_id: entry.taskId,
    actor_id: entry.actor,
    actor_role: entry.actorRole,
    click_type: entry.clickType,
    earned: entry.earned,
    discrepancy_count: entry.discrepancyCount ?? 0,
    unresolved_count: entry.unresolvedCount ?? 0,
    clicked_at: entry.clickedAt ?? new Date().toISOString(),
    encounter_id: entry.encounterId ?? null,
    patient_id: entry.patientId ?? null,
    patient_name: entry.patientName ?? null,
  };
  const { data, error } = await supabase
    .from("kairos_attestation_log")
    .insert(row)
    .select()
    .single();
  if (error) throw error;
  return toClientShape(data);
}

function toClientShape(row) {
  return {
    id: row.id,
    taskId: row.pre_visit_task_id,
    actor: row.actor_id,
    actorRole: row.actor_role,
    clickType: row.click_type,
    earned: row.earned,
    discrepancyCount: row.discrepancy_count,
    unresolvedCount: row.unresolved_count,
    clickedAt: row.clicked_at,
    encounterId: row.encounter_id,
    patientId: row.patient_id,
    patientName: row.patient_name || "",
  };
}
