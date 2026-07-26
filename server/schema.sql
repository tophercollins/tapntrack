-- Tap N Track — self-hosted (single-user) schema for local Postgres on the VPS.
--
-- Adapted from supabase/schema.sql. Deliberate deviations, so a future "graduation" to Supabase
-- is a known, small migration rather than a surprise:
--   1. id / activity_id / parent_id are TEXT, not UUID. The app seeds activities with string ids
--      ('vitamins','bouldering',...) AND generates crypto.randomUUID() for user-created ones; TEXT
--      accepts both. (Supabase used UUID and would reject the string seeds — the latent sync bug.)
--   2. No auth.users FK and no Row Level Security. There is exactly one user (you); the API's shared
--      secret is the gate. user_id is kept (defaulted) only to preserve the row shape for graduation.
-- To graduate to Supabase later: re-point columns to UUID, restore the auth.users FK + the RLS
-- policies from supabase/schema.sql, and map user_id to auth.uid().

CREATE TABLE IF NOT EXISTS activities (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL DEFAULT 'local',
  name          TEXT NOT NULL,
  emoji         TEXT NOT NULL,
  color         TEXT NOT NULL,
  tracking_type TEXT NOT NULL CHECK (tracking_type IN ('tap','number','duration','custom')),
  unit          TEXT,
  daily_target  INTEGER,
  dimensions    JSONB,
  value_formula TEXT CHECK (value_formula IN ('multiply','add') OR value_formula IS NULL),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sort_order    INTEGER NOT NULL DEFAULT 0,
  is_base       BOOLEAN NOT NULL DEFAULT true,
  parent_id     TEXT REFERENCES activities(id) ON DELETE SET NULL,
  deleted_at    TIMESTAMPTZ,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS events (
  id               TEXT PRIMARY KEY,
  user_id          TEXT NOT NULL DEFAULT 'local',
  activity_id      TEXT NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  value            NUMERIC,
  duration         INTEGER, -- seconds
  dimension_values JSONB,
  timestamp        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  note             TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sync_metadata (
  user_id      TEXT PRIMARY KEY DEFAULT 'local',
  last_sync_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  device_id    TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_activities_updated_at ON activities(updated_at);
CREATE INDEX IF NOT EXISTS idx_activities_parent_id  ON activities(parent_id);
CREATE INDEX IF NOT EXISTS idx_events_activity_id     ON events(activity_id);
CREATE INDEX IF NOT EXISTS idx_events_timestamp       ON events(timestamp);
CREATE INDEX IF NOT EXISTS idx_events_updated_at      ON events(updated_at);

-- Auto-maintain updated_at on UPDATE
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_activities_updated_at ON activities;
CREATE TRIGGER update_activities_updated_at
  BEFORE UPDATE ON activities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
