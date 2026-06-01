-- SpecFit D1 SQLite schema
-- Converted from PostgreSQL schema_dump.sql
-- Types: uuid→TEXT, timestamptz→TEXT (ISO8601), date→TEXT (YYYY-MM-DD),
--        jsonb→TEXT, numeric→REAL, enums→TEXT CHECK

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id              TEXT    PRIMARY KEY,
  email           TEXT    NOT NULL,
  email_verified  TEXT,
  password_hash   TEXT,
  name            TEXT,
  image           TEXT,
  created_at      TEXT    NOT NULL,
  updated_at      TEXT    NOT NULL,
  CONSTRAINT uq_users_email UNIQUE (email)
);

CREATE INDEX IF NOT EXISTS ix_users_email ON users (email);

CREATE TABLE IF NOT EXISTS applications (
  id                              TEXT    PRIMARY KEY,
  user_id                         TEXT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company                         TEXT    NOT NULL,
  title                           TEXT    NOT NULL,
  description                     TEXT    NOT NULL,
  applied_at                      TEXT    NOT NULL,
  status                          TEXT    NOT NULL
    CHECK (status IN ('saved','applied','interviewing','offer','rejected','withdrawn')),
  analysis                        TEXT,
  analysis_hash                   TEXT,
  analysis_updated_at             TEXT,
  suggested_profiles              TEXT,
  suggested_profiles_updated_at   TEXT,
  created_at                      TEXT    NOT NULL,
  updated_at                      TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS ix_applications_user_id     ON applications (user_id);
CREATE INDEX IF NOT EXISTS ix_applications_company     ON applications (company);
CREATE INDEX IF NOT EXISTS ix_applications_status      ON applications (status);
CREATE INDEX IF NOT EXISTS ix_applications_analysis_hash ON applications (analysis_hash);

CREATE TABLE IF NOT EXISTS token_usage (
  id          TEXT    PRIMARY KEY,
  user_id     TEXT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day         TEXT    NOT NULL,
  tokens_in   INTEGER NOT NULL DEFAULT 0,
  tokens_out  INTEGER NOT NULL DEFAULT 0,
  cost_usd    REAL    NOT NULL DEFAULT 0,
  created_at  TEXT    NOT NULL,
  updated_at  TEXT    NOT NULL,
  CONSTRAINT uq_token_usage_user_day UNIQUE (user_id, day)
);

CREATE INDEX IF NOT EXISTS ix_token_usage_user_id ON token_usage (user_id);
CREATE INDEX IF NOT EXISTS ix_token_usage_day     ON token_usage (day);

CREATE TABLE IF NOT EXISTS verification_tokens (
  identifier  TEXT  NOT NULL,
  token       TEXT  NOT NULL,
  expires     TEXT  NOT NULL,
  PRIMARY KEY (identifier, token)
);
