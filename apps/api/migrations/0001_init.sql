-- WRX v3 schema. Timestamps are ISO-8601 strings, except click.ts (epoch ms) which is range-scanned.
CREATE TABLE users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  plan          TEXT NOT NULL DEFAULT 'free',
  is_demo       INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL
);

CREATE TABLE links (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slug          TEXT NOT NULL UNIQUE,
  url           TEXT NOT NULL,
  title         TEXT,
  tags          TEXT NOT NULL DEFAULT '[]',
  expires_at    TEXT,
  max_clicks    INTEGER,
  password_hash TEXT,
  utm           TEXT,
  rules         TEXT NOT NULL DEFAULT '[]',
  variants      TEXT NOT NULL DEFAULT '[]',
  archived      INTEGER NOT NULL DEFAULT 0,
  clicks        INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);
CREATE INDEX idx_links_user ON links(user_id, created_at DESC);

CREATE TABLE clicks (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  link_id   TEXT NOT NULL REFERENCES links(id) ON DELETE CASCADE,
  user_id   TEXT NOT NULL,
  ts        INTEGER NOT NULL,
  country   TEXT,
  city      TEXT,
  device    TEXT NOT NULL,
  os        TEXT NOT NULL,
  browser   TEXT NOT NULL,
  referrer  TEXT,
  source    TEXT NOT NULL DEFAULT 'direct',
  visitor   TEXT
);
CREATE INDEX idx_clicks_user_ts ON clicks(user_id, ts);
CREATE INDEX idx_clicks_link_ts ON clicks(link_id, ts);

CREATE TABLE qr_codes (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  link_id    TEXT NOT NULL REFERENCES links(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  design     TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_qr_user ON qr_codes(user_id, created_at DESC);

CREATE TABLE bio_pages (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  handle     TEXT NOT NULL UNIQUE,
  title      TEXT NOT NULL,
  bio        TEXT NOT NULL DEFAULT '',
  avatar     TEXT,
  theme      TEXT NOT NULL DEFAULT 'ink',
  links      TEXT NOT NULL DEFAULT '[]',
  views      INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE api_keys (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  prefix       TEXT NOT NULL,
  key_hash     TEXT NOT NULL UNIQUE,
  created_at   TEXT NOT NULL,
  last_used_at TEXT
);
