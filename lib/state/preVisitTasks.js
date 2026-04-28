// Supabase-backed pre-visit task store.
//
// Discrepancy resolutions are appended (one row per click) for an audit trail.
// When reconstructing the task's discrepancyResolutions map for the panel, we
// keep only the most recent row per discrepancy_id (latest write wins).
//
// Discrepancy *detection* still happens in-memory each session — only the
// MA/nurse's resolution decisions persist.

import { getServerClient } from "../supabase/client";

export async function getPreVisitTaskServer(id) {
  const supabase = getServerClient();
  const { data: task, error } = await supabase
    .from("kairos_pre_visit_tasks")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!task) return null;

  const { data: resolutionRows, error: resErr } = await supabase
    .from("kairos_discrepancy_resolutions")
    .select("*")
    .eq("pre_visit_task_id", id)
    .order("resolved_at", { ascending: false });
  if (resErr) throw resErr;

  const latestPerDiscrepancy = {};
  for (const r of resolutionRows) {
    if (!latestPerDiscrepancy[r.discrepancy_id]) {
      latestPerDiscrepancy[r.discrepancy_id] = toResolutionClientShape(r);
    }
  }

  return {
    ...toTaskClientShape(task),
    discrepancyResolutions: latestPerDiscrepancy,
  };
}

export async function getPreVisitTaskForPatientServer(patientId) {
  const supabase = getServerClient();
  const { data, error } = await supabase
    .from("kairos_pre_visit_tasks")
    .select("id")
    .eq("patient_id", patientId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return getPreVisitTaskServer(data.id);
}

export async function appendDiscrepancyResolutionServer(
  taskId,
  discrepancyId,
  resolution,
) {
  const supabase = getServerClient();
  const row = {
    pre_visit_task_id: taskId,
    discrepancy_id: discrepancyId,
    action: resolution.action,
    actor_id: resolution.actor,
    actor_role: resolution.actorRole,
    reason: resolution.reason ?? "",
    resolved_at: resolution.timestamp ?? new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from("kairos_discrepancy_resolutions")
    .insert(row)
    .select()
    .single();
  if (error) throw error;
  return toResolutionClientShape(data);
}

export async function createPreVisitTaskServer(task, { force = false } = {}) {
  const supabase = getServerClient();
  if (force) {
    const { error: delErr } = await supabase
      .from("kairos_pre_visit_tasks")
      .delete()
      .eq("id", task.id);
    if (delErr) throw delErr;
  }
  const { error } = await supabase.from("kairos_pre_visit_tasks").insert({
    id: task.id,
    patient_id: task.patientId,
    appointment_date: task.appointmentDate,
    capture_method: task.captureMethod,
    captured_at: task.capturedAt,
    status: task.status ?? "submitted",
    patient_reported_meds: task.patientReportedMeds ?? [],
    patient_notes: task.patientNotes ?? null,
  });
  if (error) throw error;
}

function toTaskClientShape(row) {
  return {
    id: row.id,
    patientId: row.patient_id,
    appointmentDate: row.appointment_date,
    captureMethod: row.capture_method,
    capturedAt: row.captured_at,
    status: row.status,
    patientReportedMeds: row.patient_reported_meds || [],
    patientNotes: row.patient_notes || "",
  };
}

function toResolutionClientShape(row) {
  return {
    action: row.action,
    actor: row.actor_id,
    actorRole: row.actor_role,
    reason: row.reason || "",
    timestamp: row.resolved_at,
  };
}
