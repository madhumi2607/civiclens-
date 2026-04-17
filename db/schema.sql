-- ============================================================
-- CivicLens Database Schema
-- Requires: PostgreSQL 15+ with PostGIS 3.3+
-- ============================================================

-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Enumerations ──────────────────────────────────────────────────────────────

CREATE TYPE report_status AS ENUM (
  'open',
  'acknowledged',
  'in_progress',
  'resolved',
  'closed'
);

CREATE TYPE report_category AS ENUM (
  'road',
  'water',
  'electricity',
  'sewage',
  'garbage',
  'streetlight',
  'park',
  'other'
);

CREATE TYPE severity AS ENUM ('low', 'medium', 'high', 'critical');

CREATE TYPE infra_type AS ENUM (
  'road',
  'water_main',
  'sewer_line',
  'power_line',
  'streetlight',
  'park',
  'public_building'
);

-- ── Cities ────────────────────────────────────────────────────────────────────

CREATE TABLE cities (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL,
  state      TEXT NOT NULL,
  country    TEXT NOT NULL DEFAULT 'India',
  centroid   GEOGRAPHY(POINT, 4326) NOT NULL,
  boundary   GEOGRAPHY(MULTIPOLYGON, 4326),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed Chennai
INSERT INTO cities (name, state, centroid)
VALUES (
  'Chennai',
  'Tamil Nadu',
  ST_SetSRID(ST_MakePoint(80.2707, 13.0827), 4326)::geography
);

-- ── Users ─────────────────────────────────────────────────────────────────────
-- Designed to work alongside Supabase Auth (auth.users).
-- Store only app-level profile data here.

CREATE TABLE profiles (
  id           UUID PRIMARY KEY,           -- matches auth.users.id in Supabase
  display_name TEXT,
  city_id      UUID REFERENCES cities(id),
  role         TEXT NOT NULL DEFAULT 'citizen', -- citizen | moderator | admin
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Civic Reports ─────────────────────────────────────────────────────────────

CREATE TABLE reports (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city_id      UUID NOT NULL REFERENCES cities(id),
  reporter_id  UUID REFERENCES profiles(id),
  category     report_category NOT NULL,
  severity     severity NOT NULL DEFAULT 'medium',
  status       report_status NOT NULL DEFAULT 'open',
  title        TEXT NOT NULL,
  description  TEXT,
  location     GEOGRAPHY(POINT, 4326) NOT NULL,
  address      TEXT,
  media_urls   TEXT[],
  ai_summary   TEXT,        -- populated by AI after submission
  upvotes      INT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at  TIMESTAMPTZ
);

CREATE INDEX reports_location_idx ON reports USING GIST (location);
CREATE INDEX reports_city_status_idx ON reports (city_id, status);
CREATE INDEX reports_created_idx ON reports (created_at DESC);

-- ── Infrastructure Assets ─────────────────────────────────────────────────────

CREATE TABLE infrastructure (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city_id      UUID NOT NULL REFERENCES cities(id),
  type         infra_type NOT NULL,
  name         TEXT,
  geom         GEOGRAPHY(GEOMETRY, 4326) NOT NULL, -- point, line, or polygon
  attributes   JSONB NOT NULL DEFAULT '{}',
  installed_at DATE,
  last_maintained_at DATE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX infrastructure_geom_idx ON infrastructure USING GIST (geom);
CREATE INDEX infrastructure_city_type_idx ON infrastructure (city_id, type);

-- ── Report Status History ─────────────────────────────────────────────────────

CREATE TABLE report_status_history (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id   UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  changed_by  UUID REFERENCES profiles(id),
  old_status  report_status,
  new_status  report_status NOT NULL,
  note        TEXT,
  changed_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Auto-update updated_at ────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reports_updated_at
  BEFORE UPDATE ON reports
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER infrastructure_updated_at
  BEFORE UPDATE ON infrastructure
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
