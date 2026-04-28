-- Convert investigation + touchpoint primary keys to TEXT.
-- Reason: existing demo seeds (data/investigations/*.json) use stable string IDs
-- like "investigation_linnehan_001" that are baked into URLs (/investigation/[id]).
-- Switching to UUIDs would break URL stability across reseeds. Demo IDs are stable
-- domain identifiers, not user-generated, so TEXT PKs are the right shape.

ALTER TABLE kairos_investigation_touchpoints
  DROP CONSTRAINT kairos_investigation_touchpoints_investigation_id_fkey;

ALTER TABLE kairos_investigations
  ALTER COLUMN id DROP DEFAULT,
  ALTER COLUMN id TYPE TEXT;

ALTER TABLE kairos_investigation_touchpoints
  ALTER COLUMN id DROP DEFAULT,
  ALTER COLUMN id TYPE TEXT,
  ALTER COLUMN investigation_id TYPE TEXT;

ALTER TABLE kairos_investigation_touchpoints
  ADD CONSTRAINT kairos_investigation_touchpoints_investigation_id_fkey
  FOREIGN KEY (investigation_id) REFERENCES kairos_investigations(id) ON DELETE CASCADE;
