-- "Connect": profile pages become digital business cards, plus a contact inbox,
-- a public directory and opportunities (jobs, internships, partnerships, fundraising).
ALTER TABLE bio_pages ADD COLUMN kind TEXT NOT NULL DEFAULT 'person';
ALTER TABLE bio_pages ADD COLUMN headline TEXT NOT NULL DEFAULT '';
ALTER TABLE bio_pages ADD COLUMN location TEXT NOT NULL DEFAULT '';
ALTER TABLE bio_pages ADD COLUMN industry TEXT NOT NULL DEFAULT '';
ALTER TABLE bio_pages ADD COLUMN skills TEXT NOT NULL DEFAULT '[]';
ALTER TABLE bio_pages ADD COLUMN open_to TEXT NOT NULL DEFAULT '[]';
ALTER TABLE bio_pages ADD COLUMN discoverable INTEGER NOT NULL DEFAULT 0;
ALTER TABLE bio_pages ADD COLUMN card TEXT NOT NULL DEFAULT '{}';
CREATE INDEX idx_bio_discover ON bio_pages(discoverable, kind, updated_at DESC);

CREATE TABLE opportunities (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  page_id     TEXT NOT NULL REFERENCES bio_pages(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  title       TEXT NOT NULL,
  location    TEXT NOT NULL DEFAULT '',
  remote      INTEGER NOT NULL DEFAULT 0,
  description TEXT NOT NULL,
  tags        TEXT NOT NULL DEFAULT '[]',
  status      TEXT NOT NULL DEFAULT 'open',
  views       INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);
CREATE INDEX idx_opp_status ON opportunities(status, created_at DESC);
CREATE INDEX idx_opp_user ON opportunities(user_id, created_at DESC);

CREATE TABLE contact_requests (
  id             TEXT PRIMARY KEY,
  user_id        TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  page_id        TEXT NOT NULL REFERENCES bio_pages(id) ON DELETE CASCADE,
  opportunity_id TEXT REFERENCES opportunities(id) ON DELETE SET NULL,
  intent         TEXT NOT NULL,
  from_name      TEXT NOT NULL,
  from_email     TEXT NOT NULL,
  from_company   TEXT,
  from_profile   TEXT,
  message        TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'new',
  created_at     TEXT NOT NULL
);
CREATE INDEX idx_contact_user ON contact_requests(user_id, created_at DESC);
