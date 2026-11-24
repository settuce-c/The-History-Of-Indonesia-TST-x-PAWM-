'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const Database = require('better-sqlite3');
const { createTestContext } = require('./helpers');
const { openDatabase } = require('../src/db');

const jsonRes = (status, body) => ({ ok: status >= 200 && status < 300, status, json: async () => body });
const geminiReply = (items) => jsonRes(200, { candidates: [{ content: { parts: [{ text: JSON.stringify(items) }] } }] });
const goodItem = (n) => ({
  question: `Pertanyaan contoh nomor ${n} tentang Kerajaan Kutai?`,
  options: [`Jawaban A${n}`, `Jawaban B${n}`, `Jawaban C${n}`, `Jawaban D${n}`],
  answerIndex: 1,
  explanation: 'Pembahasan singkat yang cukup panjang.',
});

describe('Generator kuis Gemini (admin)', () => {
  const calls = [];
  let handler = () => geminiReply([goodItem(1), goodItem(2)]);
  const ctx = createTestContext({
    gemini: { apiKey: 'kunci-uji-gemini' },
    fetch: async (url, init) => {
      calls.push({ url: String(url), init });
      return handler(url, init);
    },
  });
  const adminAuth = async () => ({ Authorization: `Bearer ${await ctx.login(ctx.ACCOUNTS.admin)}` });
  const chapterId = 1;

  beforeEach(() => {
    calls.length = 0;
    handler = () => geminiReply([goodItem(1), goodItem(2)]);
  });

  test('menyimpan soal sebagai DRAF (source=ai); belum muncul di kuis sampai di-approve', async () => {
    const auth = await adminAuth();
    const student = await ctx.newStudent();
    const quizBefore = (await ctx.api().get(`/api/chapters/${chapterId}/quiz`).set({ Authorization: `Bearer ${student}` })).body;

    const res = await ctx.api().post(`/api/admin/chapters/${chapterId}/generate-quiz`).set(auth).send({ count: 2 }).expect(201);
    expect(res.body.created).toHaveLength(2);
    expect(res.body.created[0]).toMatchObject({ source: 'ai', status: 'draft', chapterId });
    expect(res.body.created[0].options).toHaveLength(4);
    expect(res.body.created[0].options[res.body.created[0].answerIndex]).toBe('Jawaban B1'); // acakan opsi menjaga kunci

    // kunci API dikirim lewat header, bukan URL
    expect(calls[0].url).not.toContain('kunci-uji-gemini');
    expect(calls[0].init.headers['x-goog-api-key']).toBe('kunci-uji-gemini');

    const quizAfter = (await ctx.api().get(`/api/chapters/${chapterId}/quiz`).set({ Authorization: `Bearer ${student}` })).body;
    expect(quizAfter.totalQuestions).toBe(quizBefore.totalQuestions);

    // admin melihat draf
    const list = (await ctx.api().get(`/api/admin/chapters/${chapterId}/questions`).set(auth)).body.data;
    expect(list.filter((q) => q.status === 'draft')).toHaveLength(2);

    // approve -> baru dipakai
    const id = res.body.created[0].id;
    const approved = await ctx.api().post(`/api/admin/questions/${id}/approve`).set(auth).expect(200);
    expect(approved.body).toMatchObject({ status: 'approved', source: 'ai' });
    const quizApproved = (await ctx.api().get(`/api/chapters/${chapterId}/quiz`).set({ Authorization: `Bearer ${student}` })).body;
    expect(quizApproved.totalQuestions).toBe(quizBefore.totalQuestions + 1);
    expect(quizApproved.questions.find((q) => q.id === id)).not.toHaveProperty('answerIndex');
  });

  test('Gemini TIDAK dipanggil saat pengguna membuka/mengerjakan kuis (hemat kuota)', async () => {
    const student = await ctx.newStudent();
    await ctx.api().get(`/api/chapters/${chapterId}/quiz`).set({ Authorization: `Bearer ${student}` }).expect(200);
    await ctx.api().get(`/api/chapters/${chapterId}`).set({ Authorization: `Bearer ${student}` }).expect(200);
    expect(calls.filter((c) => c.url.includes('generativelanguage'))).toHaveLength(0);
  });

  test('validasi keluaran: soal dengan 3 opsi / indeks di luar rentang / duplikat dibuang', async () => {
    const auth = await adminAuth();
    handler = () =>
      geminiReply([
        goodItem(10),
        { ...goodItem(11), options: ['A', 'B', 'C'] },
        { ...goodItem(12), answerIndex: 4 },
        { ...goodItem(13), options: ['sama', 'Sama', 'C', 'D'] },
        goodItem(10),
      ]);
    const res = await ctx.api().post(`/api/admin/chapters/${chapterId}/generate-quiz`).set(auth).send({ count: 5 }).expect(201);
    expect(res.body.created).toHaveLength(1);
    expect(res.body.rejected).toHaveLength(4);
  });

  test('semua soal tidak valid / JSON rusak -> 502 AI_INVALID_RESPONSE', async () => {
    const auth = await adminAuth();
    handler = () => geminiReply([{ question: 'x' }]);
    const a = await ctx.api().post(`/api/admin/chapters/${chapterId}/generate-quiz`).set(auth).send({}).expect(502);
    expect(a.body.error.code).toBe('AI_INVALID_RESPONSE');

    handler = () => jsonRes(200, { candidates: [{ content: { parts: [{ text: '{bukan json' }] } }] });
    const b = await ctx.api().post(`/api/admin/chapters/${chapterId}/generate-quiz`).set(auth).send({}).expect(502);
    expect(b.body.error.code).toBe('AI_INVALID_RESPONSE');
  });

  test('kuota habis -> 429 AI_QUOTA_EXCEEDED; timeout -> 504; jaringan -> 502; kuis biasa tetap jalan', async () => {
    const auth = await adminAuth();
    handler = () => jsonRes(429, { error: { message: 'quota' } });
    expect((await ctx.api().post(`/api/admin/chapters/${chapterId}/generate-quiz`).set(auth).send({}).expect(429)).body.error.code).toBe('AI_QUOTA_EXCEEDED');

    handler = () => {
      const e = new Error('aborted');
      e.name = 'AbortError';
      throw e;
    };
    expect((await ctx.api().post(`/api/admin/chapters/${chapterId}/generate-quiz`).set(auth).send({}).expect(504)).body.error.code).toBe('AI_TIMEOUT');

    handler = () => {
      throw new Error('ENOTFOUND');
    };
    expect((await ctx.api().post(`/api/admin/chapters/${chapterId}/generate-quiz`).set(auth).send({}).expect(502)).body.error.code).toBe('AI_UNREACHABLE');

    handler = () => jsonRes(403, { error: { message: 'API key not valid' } });
    expect((await ctx.api().post(`/api/admin/chapters/${chapterId}/generate-quiz`).set(auth).send({}).expect(502)).body.error.code).toBe('AI_AUTH_FAILED');

    const student = await ctx.newStudent();
    await ctx.api().get(`/api/chapters/${chapterId}/quiz`).set({ Authorization: `Bearer ${student}` }).expect(200);
  });

  test('hanya admin; count dibatasi 1-10; bab tidak ada -> 404; approve soal tidak ada -> 404', async () => {
    const student = await ctx.newStudent();
    await ctx.api().post(`/api/admin/chapters/${chapterId}/generate-quiz`).set({ Authorization: `Bearer ${student}` }).send({}).expect(403);
    await ctx.api().post(`/api/admin/questions/1/approve`).set({ Authorization: `Bearer ${student}` }).expect(403);
    const auth = await adminAuth();
    await ctx.api().post(`/api/admin/chapters/${chapterId}/generate-quiz`).set(auth).send({ count: 11 }).expect(400);
    await ctx.api().post(`/api/admin/chapters/${chapterId}/generate-quiz`).set(auth).send({ count: 0 }).expect(400);
    await ctx.api().post(`/api/admin/chapters/9999/generate-quiz`).set(auth).send({}).expect(404);
    await ctx.api().post(`/api/admin/questions/99999/approve`).set(auth).expect(404);
  });

  test('tanpa GEMINI_API_KEY -> 503 AI_NOT_CONFIGURED dan tidak ada panggilan jaringan', async () => {
    const bare = createTestContext({ fetch: async () => { throw new Error('tidak boleh dipanggil'); } });
    const admin = await bare.login(bare.ACCOUNTS.admin);
    const res = await bare.api().post('/api/admin/chapters/1/generate-quiz').set({ Authorization: `Bearer ${admin}` }).send({}).expect(503);
    expect(res.body.error.code).toBe('AI_NOT_CONFIGURED');
  });
});

describe('Integrasi Wikipedia + cache', () => {
  let clock = Date.parse('2026-11-24T00:00:00Z');
  const calls = [];
  let handler;
  const wikiBody = {
    type: 'standard',
    title: 'Sriwijaya',
    description: 'kedatuan bahari',
    extract: 'Sriwijaya adalah kedatuan bahari historis.',
    content_urls: { desktop: { page: 'https://id.wikipedia.org/wiki/Sriwijaya' } },
  };
  const ctx = createTestContext({
    now: () => clock,
    fetch: async (url, init) => {
      calls.push({ url: String(url), init });
      return handler(url, init);
    },
  });
  const sriwijaya = () => ctx.db.prepare("SELECT id FROM chapters WHERE slug = 'sriwijaya'").get().id;

  beforeEach(() => {
    calls.length = 0;
    handler = () => jsonRes(200, wikiBody);
    ctx.db.prepare('DELETE FROM wiki_cache').run();
  });

  const get = async (url) => {
    const t = await ctx.newStudent();
    return ctx.api().get(url).set({ Authorization: `Bearer ${t}` });
  };

  test('GET /api/chapters/:id menambahkan wikiSummary (ekstrak + tautan + atribusi) dan mengirim User-Agent jelas', async () => {
    const res = await get(`/api/chapters/${ctx.chapterIdsOfEra(1)[1]}`).then((r) => r);
    expect(res.status).toBe(200);
    expect(res.body.wikiTitle).toBe('Sriwijaya');
    expect(res.body.wikiSummary).toMatchObject({
      title: 'Sriwijaya',
      extract: wikiBody.extract,
      url: 'https://id.wikipedia.org/wiki/Sriwijaya',
      cached: false,
      source: { license: 'CC BY-SA 4.0' },
    });
    expect(calls[0].url).toBe('https://id.wikipedia.org/api/rest_v1/page/summary/Sriwijaya');
    expect(calls[0].init.headers['User-Agent']).toMatch(/TheHistoryOfIndonesia\/1\.0/);
  });

  test('cache: panggilan kedua tidak memanggil Wikipedia; kedaluwarsa setelah 7 hari', async () => {
    const id = sriwijaya();
    // Sriwijaya ada di era 1 (terbuka), jadi bisa dibuka pengguna baru
    await get(`/api/chapters/${id}`);
    const second = await get(`/api/chapters/${id}`);
    expect(second.body.wikiSummary.cached).toBe(true);
    expect(calls).toHaveLength(1);

    clock += 6 * 24 * 3600 * 1000;
    await get(`/api/chapters/${id}`);
    expect(calls).toHaveLength(1); // masih segar (6 hari)

    clock += 2 * 24 * 3600 * 1000; // total 8 hari
    await get(`/api/chapters/${id}`);
    expect(calls).toHaveLength(2);
  });

  test('Wikipedia gagal: materi tetap tampil tanpa wikiSummary (tidak error)', async () => {
    handler = () => {
      throw new Error('timeout');
    };
    const res = await get(`/api/chapters/${sriwijaya()}`);
    expect(res.status).toBe(200);
    expect(res.body.wikiSummary).toBeNull();
    expect(res.body.title).toMatch(/^Sriwijaya/);
  });

  test('cache kedaluwarsa + Wikipedia gagal: memakai cache lama', async () => {
    const id = sriwijaya();
    await get(`/api/chapters/${id}`);
    clock += 30 * 24 * 3600 * 1000;
    handler = () => jsonRes(503, {});
    const res = await get(`/api/chapters/${id}`);
    expect(res.body.wikiSummary).toMatchObject({ extract: wikiBody.extract, cached: true });
  });

  test('artikel tidak ditemukan (404) dan halaman disambiguasi -> null', async () => {
    handler = () => jsonRes(404, {});
    expect((await get(`/api/chapters/${sriwijaya()}`)).body.wikiSummary).toBeNull();
    ctx.db.prepare('DELETE FROM wiki_cache').run();
    handler = () => jsonRes(200, { ...wikiBody, type: 'disambiguation' });
    expect((await get(`/api/chapters/${sriwijaya()}`)).body.wikiSummary).toBeNull();
  });

  test('bab tanpa wiki_title: wikiSummary null dan Wikipedia tidak dipanggil', async () => {
    ctx.db.prepare("UPDATE chapters SET wiki_title = NULL WHERE slug = 'sriwijaya'").run();
    const res = await get(`/api/chapters/${sriwijaya()}`);
    expect(res.body.wikiSummary).toBeNull();
    expect(calls).toHaveLength(0);
    ctx.db.prepare("UPDATE chapters SET wiki_title = 'Sriwijaya' WHERE slug = 'sriwijaya'").run();
  });

  test('GET /api/items/:id: detail tokoh + wikiSummary; id tidak ada -> 404', async () => {
    const item = ctx.db.prepare("SELECT id FROM historical_items WHERE name = 'Mulawarman'").get();
    handler = () => jsonRes(200, { ...wikiBody, title: 'Mulawarman', extract: 'Maharaja Mulawarman adalah raja Kutai.' });
    const res = await get(`/api/items/${item.id}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ name: 'Mulawarman', wikiTitle: 'Mulawarman', kind: 'figure' });
    expect(res.body.wikiSummary.extract).toMatch(/Mulawarman/);
    expect((await get('/api/items/99999')).status).toBe(404);
  });

  test('admin: wikiTitle bab bisa diubah; wiki-draft menghasilkan draf tanpa menyimpan', async () => {
    const admin = { Authorization: `Bearer ${await ctx.login(ctx.ACCOUNTS.admin)}` };
    const id = sriwijaya();
    const before = ctx.db.prepare('SELECT summary FROM chapters WHERE id = ?').get(id).summary;

    const draft = await ctx.api().post(`/api/admin/chapters/${id}/wiki-draft`).set(admin).send({}).expect(200);
    expect(draft.body).toMatchObject({ wikiTitle: 'Sriwijaya', draftSummary: wikiBody.extract, sourceUrl: wikiBody.content_urls.desktop.page });
    expect(ctx.db.prepare('SELECT summary FROM chapters WHERE id = ?').get(id).summary).toBe(before);

    await ctx.api().put(`/api/admin/chapters/${id}`).set(admin).send({ wikiTitle: 'Kedatuan Sriwijaya' }).expect(200);
    const c = await ctx.api().post(`/api/admin/chapters/${id}/wiki-draft`).set(admin).send({ wikiTitle: 'Majapahit' }).expect(200);
    expect(c.body.wikiTitle).toBe('Majapahit');
    await ctx.api().put(`/api/admin/chapters/${id}`).set(admin).send({ wikiTitle: 'Sriwijaya' }).expect(200);

    handler = () => jsonRes(404, {});
    const gone = await ctx.api().post(`/api/admin/chapters/${id}/wiki-draft`).set(admin).send({ wikiTitle: 'Tidak Ada Artikel Ini' }).expect(502);
    expect(gone.body.error.code).toBe('WIKI_UNAVAILABLE');

    const student = await ctx.newStudent();
    await ctx.api().post(`/api/admin/chapters/${id}/wiki-draft`).set({ Authorization: `Bearer ${student}` }).send({}).expect(403);
  });

  test('published language kelompok lain (/public/events) tidak berubah bentuk', async () => {
    const res = await ctx.api().get('/api/public/events?limit=1').set('X-API-Key', ctx.API_KEYS.classroom).expect(200);
    expect(res.body.data[0]).not.toHaveProperty('wikiTitle');
  });
});

describe('Migrasi database lama', () => {
  test('kolom baru ditambahkan ke database yang dibuat sebelum revisi, data lama aman', () => {
    const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'thid-')), 'old.db');
    const old = new Database(file);
    old.exec(`CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL,
      name TEXT NOT NULL, avatar_url TEXT, role TEXT NOT NULL DEFAULT 'student', created_at TEXT NOT NULL DEFAULT 'x');
      CREATE TABLE eras (id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT NOT NULL UNIQUE, title TEXT NOT NULL, description TEXT, start_year INTEGER, end_year INTEGER, order_index INTEGER NOT NULL);
      CREATE TABLE chapters (id INTEGER PRIMARY KEY AUTOINCREMENT, era_id INTEGER NOT NULL, slug TEXT NOT NULL UNIQUE, title TEXT NOT NULL, order_index INTEGER NOT NULL, video_url TEXT NOT NULL, summary TEXT NOT NULL, topic_tags TEXT NOT NULL DEFAULT '');
      CREATE TABLE questions (id INTEGER PRIMARY KEY AUTOINCREMENT, chapter_id INTEGER NOT NULL, question TEXT NOT NULL, options TEXT NOT NULL, answer_index INTEGER NOT NULL, explanation TEXT NOT NULL DEFAULT '', order_index INTEGER NOT NULL DEFAULT 0);
      CREATE TABLE chapter_progress (user_id INTEGER NOT NULL, chapter_id INTEGER NOT NULL, watched_at TEXT, best_score INTEGER, passed_at TEXT, PRIMARY KEY (user_id, chapter_id));
      INSERT INTO users (email, password_hash, name) VALUES ('lama@test.id', 'h', 'Lama');
      INSERT INTO questions (chapter_id, question, options, answer_index) VALUES (1, 'Soal lama?', '["a","b"]', 0);`);
    old.close();

    const db = openDatabase(file);
    const cols = (t) => db.prepare(`PRAGMA table_info(${t})`).all().map((c) => c.name);
    expect(cols('users')).toContain('avatar_id');
    expect(cols('chapters')).toContain('wiki_title');
    expect(cols('chapter_progress')).toEqual(expect.arrayContaining(['skipped_at', 'skip_source']));
    // soal lama otomatis berstatus approved + source manual, jadi kuis lama tetap jalan
    expect(db.prepare('SELECT source, status FROM questions').get()).toMatchObject({ source: 'manual', status: 'approved' });
    expect(db.prepare('SELECT name FROM users').get().name).toBe('Lama');
    db.close();
    expect(() => openDatabase(file).close()).not.toThrow(); // idempoten
  });
});
