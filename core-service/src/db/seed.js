'use strict';
const config = require('../config');
const data = require('./seed-data');
const { createIdentityService } = require('../identity/service');

/**
 * Masukkan konten kurikulum (era, bab, soal, peristiwa/tokoh).
 * Hanya berjalan jika tabel eras kosong, kecuali reset=true
 * (reset menghapus konten DAN progres belajar semua user, tetapi tidak menghapus akun).
 */
function seedContent(db, { reset = false } = {}) {
  const hasContent = db.prepare('SELECT COUNT(*) AS n FROM eras').get().n > 0;
  if (hasContent && !reset) return false;

  db.transaction(() => {
    if (reset) {
      db.exec(`DELETE FROM era_badges; DELETE FROM chapter_progress; DELETE FROM quiz_attempts;
               DELETE FROM chapter_items; DELETE FROM questions; DELETE FROM chapters;
               DELETE FROM eras; DELETE FROM historical_items;`);
    }
    const insertItem = db.prepare(
      `INSERT INTO historical_items (kind, name, year, year_end, location, region, latitude, longitude, description, wiki_title)
       VALUES (@kind, @name, @year, @yearEnd, @location, @region, @lat, @lng, @description, @wikiTitle)`
    );
    const insertEra = db.prepare(
      'INSERT INTO eras (slug, title, description, start_year, end_year, order_index) VALUES (?, ?, ?, ?, ?, ?)'
    );
    const insertChapter = db.prepare(
      `INSERT INTO chapters (era_id, slug, title, order_index, video_url, summary, topic_tags, wiki_title)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const insertQuestion = db.prepare(
      `INSERT INTO questions (chapter_id, question, options, answer_index, explanation, order_index)
       VALUES (?, ?, ?, ?, ?, ?)`
    );
    const linkItem = db.prepare('INSERT INTO chapter_items (chapter_id, item_id) VALUES (?, ?)');

    const itemIds = {};
    for (const [key, item] of Object.entries(data.items)) {
      itemIds[key] = insertItem.run({ yearEnd: null, wikiTitle: null, ...item }).lastInsertRowid;
    }

    data.eras.forEach((era, ei) => {
      const eraId = insertEra.run(era.slug, era.title, era.description, era.startYear, era.endYear, ei + 1).lastInsertRowid;
      era.chapters.forEach((ch, ci) => {
        const chapterId = insertChapter.run(
          eraId, ch.slug, ch.title, ci + 1, ch.videoUrl, ch.summary, ch.topicTags.join(','), ch.wikiTitle ?? null
        ).lastInsertRowid;
        ch.questions.forEach((qs, qi) => {
          if (qs.answer < 0 || qs.answer >= qs.options.length) throw new Error(`Kunci jawaban tidak valid: ${qs.question}`);
          insertQuestion.run(chapterId, qs.question, JSON.stringify(qs.options), qs.answer, qs.explanation, qi + 1);
        });
        for (const key of ch.items) {
          if (!itemIds[key]) throw new Error(`Item "${key}" tidak ada di seed-data`);
          linkItem.run(chapterId, itemIds[key]);
        }
      });
    });
  })();
  return true;
}

/**
 * Database lama (sebelum revisi Wikipedia) belum punya wiki_title. Isi hanya yang masih kosong,
 * sehingga judul yang sudah disunting admin tidak tertimpa. Aman dijalankan berulang.
 */
function backfillWikiTitles(db) {
  const setChapter = db.prepare('UPDATE chapters SET wiki_title = ? WHERE slug = ? AND wiki_title IS NULL');
  const setItem = db.prepare('UPDATE historical_items SET wiki_title = ? WHERE name = ? AND wiki_title IS NULL');
  db.transaction(() => {
    for (const era of data.eras) for (const ch of era.chapters) if (ch.wikiTitle) setChapter.run(ch.wikiTitle, ch.slug);
    for (const item of Object.values(data.items)) if (item.wikiTitle) setItem.run(item.wikiTitle, item.name);
  })();
}

/** Akun uji & API key mitra dari .env. Hanya dibuat jika belum ada (idempoten). */
function seedAccounts(db, seed = config.seed, logger = console) {
  const identity = createIdentityService(db);
  for (const account of [seed.admin, seed.student]) {
    if (!account.password) {
      logger.warn(`[seed] password untuk ${account.email} kosong di .env, akun dilewati`);
      continue;
    }
    if (identity.ensureUser(account)) logger.log(`[seed] akun ${account.role} dibuat: ${account.email}`);
  }
  for (const { client, key } of seed.apiKeys) {
    if (!key) {
      logger.warn(`[seed] API key untuk ${client} kosong di .env, dilewati`);
      continue;
    }
    if (identity.ensureApiKey(client, key)) logger.log(`[seed] API key dibuat untuk ${client}`);
  }
}

module.exports = { seedContent, seedAccounts, backfillWikiTitles };

// CLI: npm run seed  /  npm run seed:reset
if (require.main === module) {
  const { openDatabase } = require('./index');
  const reset = process.argv.includes('--reset');
  const db = openDatabase(config.dbPath);
  const inserted = seedContent(db, { reset });
  backfillWikiTitles(db);
  console.log(inserted ? `[seed] konten dimasukkan${reset ? ' (reset)' : ''}` : '[seed] konten sudah ada, dilewati (pakai --reset untuk mengulang)');
  seedAccounts(db);
  const count = (t) => db.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get().n;
  console.log(
    `[seed] eras=${count('eras')} chapters=${count('chapters')} questions=${count('questions')} items=${count('historical_items')} users=${count('users')} api_keys=${count('api_keys')}`
  );
  db.close();
}
