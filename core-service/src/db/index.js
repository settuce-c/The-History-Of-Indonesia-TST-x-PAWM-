'use strict';
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const SCHEMA = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

/**
 * Migrasi ringan untuk database yang SUDAH ada (mis. di STB): CREATE TABLE IF NOT EXISTS
 * tidak menambah kolom baru ke tabel lama, jadi kolom hasil revisi ditambahkan di sini.
 * Aman dijalankan berulang (cek dulu lewat PRAGMA table_info).
 */
const COLUMN_MIGRATIONS = [
  ['users', 'avatar_id', 'TEXT'],
  ['chapters', 'wiki_title', 'TEXT'],
  ['historical_items', 'wiki_title', 'TEXT'],
  ['questions', 'source', "TEXT NOT NULL DEFAULT 'manual'"],
  ['questions', 'status', "TEXT NOT NULL DEFAULT 'approved'"],
  ['chapter_progress', 'skipped_at', 'TEXT'],
  ['chapter_progress', 'skip_source', 'TEXT'],
];

function migrate(db) {
  for (const [table, column, ddl] of COLUMN_MIGRATIONS) {
    const exists = db.prepare(`PRAGMA table_info(${table})`).all().some((c) => c.name === column);
    if (!exists) db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${ddl}`);
  }
}

/**
 * Membuka (atau membuat) file SQLite dan memastikan skema ada.
 * Pakai ':memory:' untuk test.
 */
function openDatabase(file) {
  if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new Database(file);
  db.pragma('journal_mode = WAL'); // baca & tulis bisa bersamaan, lebih aman saat crash
  db.pragma('foreign_keys = ON');
  db.pragma('busy_timeout = 5000');
  db.exec(SCHEMA);
  migrate(db);
  return db;
}

module.exports = { openDatabase };
