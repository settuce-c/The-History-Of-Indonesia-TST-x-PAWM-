-- Skema database Learning Path Service (SQLite).
-- Dikelompokkan per bounded context. Semua CREATE memakai IF NOT EXISTS
-- sehingga aman dijalankan setiap kali service start.

-- ===== Identity & Access =====
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT    NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT    NOT NULL,
  name          TEXT    NOT NULL,
  avatar_url    TEXT,
  role          TEXT    NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  created_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- API key kelompok lain. Yang disimpan hanya hash SHA-256, bukan key aslinya.
CREATE TABLE IF NOT EXISTS api_keys (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  client_name  TEXT NOT NULL UNIQUE,
  key_hash     TEXT NOT NULL UNIQUE,
  key_prefix   TEXT NOT NULL,
  created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  last_used_at TEXT,
  revoked_at   TEXT
);

-- ===== Curriculum =====
CREATE TABLE IF NOT EXISTS eras (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  slug        TEXT    NOT NULL UNIQUE,
  title       TEXT    NOT NULL,
  description TEXT,
  start_year  INTEGER,
  end_year    INTEGER,
  order_index INTEGER NOT NULL
);

-- Bab = unit materi: satu video YouTube + ringkasan + kuis.
CREATE TABLE IF NOT EXISTS chapters (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  era_id      INTEGER NOT NULL REFERENCES eras(id) ON DELETE CASCADE,
  slug        TEXT    NOT NULL UNIQUE,
  title       TEXT    NOT NULL,
  order_index INTEGER NOT NULL,
  video_url   TEXT    NOT NULL,
  summary     TEXT    NOT NULL,
  topic_tags  TEXT    NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_chapters_era ON chapters(era_id, order_index);

-- ===== Historical Knowledge =====
CREATE TABLE IF NOT EXISTS historical_items (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  kind        TEXT    NOT NULL CHECK (kind IN ('event', 'figure')),
  name        TEXT    NOT NULL UNIQUE,
  year        INTEGER,
  year_end    INTEGER,
  location    TEXT,
  region      TEXT,
  latitude    REAL,
  longitude   REAL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS chapter_items (
  chapter_id INTEGER NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  item_id    INTEGER NOT NULL REFERENCES historical_items(id) ON DELETE CASCADE,
  PRIMARY KEY (chapter_id, item_id)
);

-- ===== Assessment =====
CREATE TABLE IF NOT EXISTS questions (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  chapter_id   INTEGER NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  question     TEXT    NOT NULL,
  options      TEXT    NOT NULL,          -- array JSON berisi pilihan jawaban
  answer_index INTEGER NOT NULL,          -- KUNCI JAWABAN: tidak pernah dikirim sebelum submit
  explanation  TEXT    NOT NULL DEFAULT '',
  order_index  INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_questions_chapter ON questions(chapter_id, order_index);

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  chapter_id   INTEGER NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  score        INTEGER NOT NULL,
  passed       INTEGER NOT NULL,
  answers      TEXT    NOT NULL,
  submitted_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_attempts_user ON quiz_attempts(user_id, chapter_id);

-- ===== Learning Progress =====
CREATE TABLE IF NOT EXISTS chapter_progress (
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  chapter_id INTEGER NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  watched_at TEXT,
  best_score INTEGER,
  passed_at  TEXT,
  PRIMARY KEY (user_id, chapter_id)
);

CREATE TABLE IF NOT EXISTS era_badges (
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  era_id        INTEGER NOT NULL REFERENCES eras(id) ON DELETE CASCADE,
  average_score REAL    NOT NULL,
  awarded_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  PRIMARY KEY (user_id, era_id)
);
