// Supabase-backed investigation store.
//
// v7 migration: previous in-memory store with seed-time token resolution is
// replaced by persistent reads from kairos_investigations + kairos_investigation_touchpoints.
// Time tokens are now resolved by the seed script at insert time — see
// scripts/seed-investigations.js. Re-run that script to refresh demo timestamps.

import { getServerClient, getBrowserClient } from "../supabase/client";

const SELECT_WITH_TOUCHPOINTS =
  "*, touchpoints:kairos_investigation_touchpoints(*)";

export async function getInvestigationsServer() {
  const supabase = getServerClient();
  const { data, error } = await supabase
    .from("kairos_investigations")
    .select(SELECT_WITH_TOUCHPOINTS)
    .order("last_activity_at", { ascending: false });
  if (error) throw error;
  return data.map(toClientShape);
}

export async function getInvestigationServer(id) {
  const supabase = getServerClient();
  const { data, error } = await supabase
    .from("kairos_investigations")
    .select(SELECT_WITH_TOUCHPOINTS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return toClientShape(data);
}

export async function createInvestigationServer(investigation) {
  const supabase = getServerClient();
  const { touchpoints, ...rest } = investigation;
  const { data: inv, error } = await supabase
    .from("kairos_investigations")
    .insert(toDbShape(rest))
    .select()
    .single();
  if (error) throw error;
  if (touchpoints?.length) {
    const tpRows = touchpoints.map((tp) => ({
      ...toDbTouchpointShape(tp),
      investigation_id: inv.id,
    }));
    const { error: tpErr } = await supabase
      .from("kairos_investigation_touchpoints")
      .insert(tpRows);
    if (tpErr) throw tpErr;
  }
  return getInvestigationServer(inv.id);
}

export async function addTouchpointServer(investigationId, touchpoint) {
  const supabase = getServerClient();
  const { error } = await supabase
    .from("kairos_investigation_touchpoints")
    .insert({
      ...toDbTouchpointShape(touchpoint),
      investigation_id: investigationId,
    });
  if (error) throw error;
  return getInvestigationServer(investigationId);
}

export async function getInvestigationsBrowser() {
  const supabase = getBrowserClient();
  const { data, error } = await supabase
    .from("kairos_investigations")
    .select(SELECT_WITH_TOUCHPOINTS)
    .order("last_activity_at", { ascending: false });
  if (error) throw error;
  return data.map(toClientShape);
}

function toDbShape(inv) {
  return {
    id: inv.id,
    patient_id: inv.patientId,
    title: inv.title,
    clinical_concern: inv.clinicalConcern ?? null,
    status: inv.status ?? "open",
    created_at: inv.createdAt,
    last_activity_at: inv.lastActivityAt,
  };
}

function toDbTouchpointShape(tp) {
  return {
    id: tp.id,
    kind: tp.kind,
    bucket: tp.bucket,
    occurred_at: tp.occurredAt,
    summary: tp.summary,
    data: tp.data ?? {},
    source_actor: tp.sourceActor,
    source_detail: tp.sourceDetail ?? null,
  };
}

function toClientShape(row) {
  return {
    id: row.id,
    patientId: row.patient_id,
    title: row.title,
    clinicalConcern: row.clinical_concern,
    status: row.status,
    createdAt: row.created_at,
    lastActivityAt: row.last_activity_at,
    touchpoints: (row.touchpoints || [])
      .map(toClientTouchpointShape)
      .sort(
        (a, b) => new Date(a.occurredAt) - new Date(b.occurredAt),
      ),
  };
}

function toClientTouchpointShape(row) {
  return {
    id: row.id,
    kind: row.kind,
    bucket: row.bucket,
    occurredAt: row.occurred_at,
    summary: row.summary,
    data: row.data,
    sourceActor: row.source_actor,
    sourceDetail: row.source_detail,
  };
}
