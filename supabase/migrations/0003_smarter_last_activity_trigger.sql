-- The original trigger bumped kairos_investigations.last_activity_at to NOW()
-- on every touchpoint insert. That overrode seeded historical values during
-- demo seeding (e.g. a 5-day-old touchpoint would push last_activity_at to now).
--
-- New semantics: last_activity_at = GREATEST(current, NEW.occurred_at). Live
-- additions still advance the timestamp; historical seeds keep their
-- already-newer last_activity_at intact.

CREATE OR REPLACE FUNCTION kairos_touch_last_activity() RETURNS TRIGGER AS $$
BEGIN
  UPDATE kairos_investigations
    SET last_activity_at = GREATEST(last_activity_at, NEW.occurred_at)
    WHERE id = NEW.investigation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
