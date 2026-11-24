'use strict';
const config = require('./config');
const { openDatabase } = require('./db');
const { createApp } = require('./app');
const { seedContent, seedAccounts, backfillWikiTitles } = require('./db/seed');

const db = openDatabase(config.dbPath);

if (config.seedOnStart) {
  // Konten hanya diisi jika database masih kosong; akun & API key hanya dibuat jika belum ada.
  if (seedContent(db)) console.log('[seed] konten kurikulum awal dimasukkan');
  backfillWikiTitles(db); // database lama: isi wiki_title yang masih kosong
  seedAccounts(db);
}

const app = createApp(db);
const server = app.listen(config.port, () => {
  console.log(`[core-service] ${config.env} listening on :${config.port} (db: ${config.dbPath})`);
});

function shutdown(signal) {
  console.log(`[core-service] ${signal} diterima, menutup server...`);
  server.close(() => {
    db.close();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
