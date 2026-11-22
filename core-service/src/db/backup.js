'use strict';
/**
 * Backup database SQLite secara aman saat service berjalan (memakai SQLite online backup API).
 * Pemakaian di STB:
 *   docker compose exec core-service node src/db/backup.js
 *   -> menghasilkan /data/backup-YYYYMMDD-HHMMSS.db di dalam volume
 */
const path = require('path');
const config = require('../config');
const { openDatabase } = require('./index');

const stamp = new Date().toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15);
const target = process.argv[2] || path.join(path.dirname(config.dbPath), `backup-${stamp}.db`);

const db = openDatabase(config.dbPath);
db.backup(target)
  .then(() => {
    console.log(`[backup] tersimpan: ${target}`);
    db.close();
  })
  .catch((err) => {
    console.error('[backup] gagal:', err.message);
    process.exit(1);
  });
