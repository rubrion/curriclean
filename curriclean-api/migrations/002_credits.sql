-- Prepaid credits (Stripe packs), daily free runs, tailored CV storage.

-- Credit balance per user (created lazily on first top-up or spend).
CREATE TABLE IF NOT EXISTS wallets (
  user_id     TEXT    PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  credits     INTEGER NOT NULL DEFAULT 0 CHECK (credits >= 0),
  updated_at  TEXT    NOT NULL
);

-- One row per Stripe Checkout session opened; credited once by the webhook.
CREATE TABLE IF NOT EXISTS payments (
  id          TEXT    PRIMARY KEY,               -- pay_<hex>, our own ref
  user_id     TEXT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pack        TEXT    NOT NULL,                  -- USD amount: '5' | '10' | '25'
  credits     INTEGER NOT NULL,
  status      TEXT    NOT NULL DEFAULT 'open' CHECK (status IN ('open','paid')),
  created_at  TEXT    NOT NULL,
  paid_at     TEXT
);

CREATE INDEX IF NOT EXISTS ix_payments_user_id ON payments (user_id);

-- Every credit movement. The primary key makes each top-up, refund and spend apply once.
CREATE TABLE IF NOT EXISTS ledger (
  ref         TEXT    PRIMARY KEY,
  user_id     TEXT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  credits     INTEGER NOT NULL,                  -- positive: top-up, negative: refund/spend
  kind        TEXT    NOT NULL CHECK (kind IN ('topup','refund','spend')),
  note        TEXT,
  created_at  TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS ix_ledger_user_id ON ledger (user_id, created_at);

-- AI runs (analysis or tailoring) per user per day, for the free allowance.
ALTER TABLE token_usage ADD COLUMN runs INTEGER NOT NULL DEFAULT 0;

-- Tailored CV suggestions (JSON) and the hash they were generated from.
ALTER TABLE applications ADD COLUMN tailored TEXT;
ALTER TABLE applications ADD COLUMN tailored_hash TEXT;
ALTER TABLE applications ADD COLUMN tailored_updated_at TEXT;
