-- Kairos v7 — initial persistence schema
-- All tables are kairos_* prefixed; this DB is multi-tenant (shared with SupperMates et al).
-- See "Known Migration Debt" in docs/CONTEXT.md for the eventual move to a dedicated project.
-- RLS is enabled on every table; no policies are defined, so the anon key has no access.
-- All reads/writes go through API routes using the service role key (which bypasses RLS).

-- Investigations (multi-day, multi-source clinical threads)
CREATE TABLE kairos_investigations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id TEXT NOT NULL,
  title TEXT NOT NULL,
  clinical_concern TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'pending_patient', 'pending_provider', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_kairos_investigations_patient ON kairos_investigations(patient_id);
CREATE INDEX idx_kairos_investigations_status ON kairos_investigations(status);
ALTER TABLE kairos_investigations ENABLE ROW LEVEL SECURITY;

-- Investigation touchpoints (chronological events within an investigation)
CREATE TABLE kairos_investigation_touchpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investigation_id UUID NOT NULL REFERENCES kairos_investigations(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('encounter', 'evidence', 'sbar', 'secure_chat', 'mychart_outbound', 'mychart_inbound', 'result_note', 'lab_result')),
  bucket TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  summary TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  source_actor TEXT NOT NULL,
  source_detail TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_kairos_touchpoints_investigation ON kairos_investigation_touchpoints(investigation_id);
CREATE INDEX idx_kairos_touchpoints_occurred ON kairos_investigation_touchpoints(occurred_at DESC);
ALTER TABLE kairos_investigation_touchpoints ENABLE ROW LEVEL SECURITY;

-- Evidence (captured during encounters)
CREATE TABLE kairos_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  encounter_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  question_text TEXT NOT NULL,
  answer TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('patient', 'family', 'outside_clinician', 'chart', 'nurse_observation')),
  source_detail TEXT,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_kairos_evidence_encounter ON kairos_evidence(encounter_id);
ALTER TABLE kairos_evidence ENABLE ROW LEVEL SECURITY;

-- SBAR versions (versioned regeneratable artifacts)
CREATE TABLE kairos_sbar_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  encounter_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  situation TEXT NOT NULL,
  background TEXT NOT NULL,
  assessment TEXT NOT NULL,
  recommendation TEXT NOT NULL,
  evidence_hash TEXT NOT NULL,
  evidence_count INTEGER NOT NULL,
  model TEXT NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (encounter_id, version)
);
CREATE INDEX idx_kairos_sbar_encounter ON kairos_sbar_versions(encounter_id);
ALTER TABLE kairos_sbar_versions ENABLE ROW LEVEL SECURITY;

-- Pre-visit tasks (must come before attestation_log because attestations FK could point here later)
CREATE TABLE kairos_pre_visit_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id TEXT NOT NULL,
  appointment_date TIMESTAMPTZ NOT NULL,
  capture_method TEXT NOT NULL CHECK (capture_method IN ('mychart_form', 'kiosk_tablet', 'paper_ocr', 'phone_intake')),
  captured_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('pending', 'submitted', 'reviewed_by_ma', 'flagged_to_nurse', 'closed')),
  patient_reported_meds JSONB NOT NULL DEFAULT '[]',
  patient_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_kairos_pvt_patient ON kairos_pre_visit_tasks(patient_id);
ALTER TABLE kairos_pre_visit_tasks ENABLE ROW LEVEL SECURITY;

-- Attestation log (documentation integrity primitive)
CREATE TABLE kairos_attestation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pre_visit_task_id UUID NOT NULL,
  actor_id TEXT NOT NULL,
  actor_role TEXT NOT NULL CHECK (actor_role IN ('MA', 'RN', 'MD', 'DO', 'NP', 'PA')),
  click_type TEXT NOT NULL,
  earned BOOLEAN NOT NULL,
  discrepancy_count INTEGER NOT NULL,
  unresolved_count INTEGER NOT NULL,
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_kairos_attestation_actor ON kairos_attestation_log(actor_id, clicked_at DESC);
CREATE INDEX idx_kairos_attestation_task ON kairos_attestation_log(pre_visit_task_id);
ALTER TABLE kairos_attestation_log ENABLE ROW LEVEL SECURITY;

-- Discrepancy resolutions (audit trail of what the MA/nurse actually did)
CREATE TABLE kairos_discrepancy_resolutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pre_visit_task_id UUID NOT NULL REFERENCES kairos_pre_visit_tasks(id) ON DELETE CASCADE,
  discrepancy_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('dismissed', 'updated', 'escalated')),
  actor_id TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  reason TEXT NOT NULL,
  resolved_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_kairos_resolutions_task ON kairos_discrepancy_resolutions(pre_visit_task_id);
ALTER TABLE kairos_discrepancy_resolutions ENABLE ROW LEVEL SECURITY;

-- Trigger: any new touchpoint bumps the parent investigation's last_activity_at
CREATE OR REPLACE FUNCTION kairos_touch_last_activity() RETURNS TRIGGER AS $$
BEGIN
  UPDATE kairos_investigations
    SET last_activity_at = NOW()
    WHERE id = NEW.investigation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER kairos_touchpoint_updates_investigation
  AFTER INSERT ON kairos_investigation_touchpoints
  FOR EACH ROW EXECUTE FUNCTION kairos_touch_last_activity();
