-- Pre-visit task seeds use string IDs ("pre_visit_cosgrove_001") and the
-- existing attestation flow records encounter_id, patient_id, and patient_name
-- alongside the standard fields. Adjust schema to match.

ALTER TABLE kairos_discrepancy_resolutions
  DROP CONSTRAINT kairos_discrepancy_resolutions_pre_visit_task_id_fkey;

ALTER TABLE kairos_pre_visit_tasks
  ALTER COLUMN id DROP DEFAULT,
  ALTER COLUMN id TYPE TEXT;

ALTER TABLE kairos_attestation_log
  ALTER COLUMN pre_visit_task_id TYPE TEXT;

ALTER TABLE kairos_discrepancy_resolutions
  ALTER COLUMN pre_visit_task_id TYPE TEXT;

ALTER TABLE kairos_discrepancy_resolutions
  ADD CONSTRAINT kairos_discrepancy_resolutions_pre_visit_task_id_fkey
  FOREIGN KEY (pre_visit_task_id) REFERENCES kairos_pre_visit_tasks(id) ON DELETE CASCADE;

ALTER TABLE kairos_attestation_log
  ADD COLUMN encounter_id TEXT,
  ADD COLUMN patient_id TEXT,
  ADD COLUMN patient_name TEXT;
