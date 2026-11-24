'use strict';
const { createTestContext } = require('./helpers');

describe('Tes awal (placement), tes lompat, dan status bab "skipped"', () => {
  const ctx = createTestContext();
  const auth = (t) => ({ Authorization: `Bearer ${t}` });

  /** Jawab soal sesi: era di `correctEras` dijawab benar, sisanya sengaja salah. */
  function answerFor(questions, correctEras) {
    return questions.map((qs) => {
      const row = ctx.db.prepare('SELECT answer_index, options FROM questions WHERE id = ?').get(qs.id);
      const n = JSON.parse(row.options).length;
      const right = correctEras === 'all' || (qs.eraId !== undefined && correctEras.includes(qs.eraId));
      return { questionId: qs.id, selectedIndex: right ? row.answer_index : (row.answer_index + 1) % n };
    });
  }
  const eras = async (t) => (await ctx.api().get('/api/eras').set(auth(t)).expect(200)).body.data;
  const chaptersOf = async (t, eraId) =>
    (await ctx.api().get(`/api/eras/${eraId}/chapters`).set(auth(t)).expect(200)).body;

  test('GET /api/placement: ±2 soal per era, tanpa kunci jawaban & tanpa pembahasan', async () => {
    const t = await ctx.newStudent();
    const res = await ctx.api().get('/api/placement').set(auth(t)).expect(200);
    const eraIds = [...new Set(res.body.questions.map((q) => q.eraId))];
    expect(eraIds).toHaveLength(3);
    for (const id of eraIds) expect(res.body.questions.filter((q) => q.eraId === id)).toHaveLength(2);
    expect(res.body.totalQuestions).toBe(6);
    expect(res.body.masteryScore).toBe(80);
    for (const q of res.body.questions) {
      expect(q).not.toHaveProperty('answerIndex');
      expect(q).not.toHaveProperty('explanation');
      expect(q.options.length).toBeGreaterThanOrEqual(2);
    }
  });

  test('semua benar: semua era dikuasai, bab "skipped", tanpa lencana, tidak ada era mulai', async () => {
    const t = await ctx.newStudent();
    const { body } = await ctx.api().get('/api/placement').set(auth(t)).expect(200);
    const res = await ctx
      .api()
      .post('/api/placement/submit')
      .set(auth(t))
      .send({ answers: answerFor(body.questions, 'all') })
      .expect(200);
    expect(res.body.masteredEras).toHaveLength(3);
    expect(res.body.allMastered).toBe(true);
    expect(res.body.startEra).toBeNull();
    expect(res.body.skippedChapters).toBe(9);

    const e = await eras(t);
    expect(e.every((x) => x.status === 'completed' && x.skippedChapters === x.chapterCount)).toBe(true);
    const ch = await chaptersOf(t, e[0].id);
    expect(ch.data.every((c) => c.status === 'skipped')).toBe(true);

    const progress = (await ctx.api().get('/api/me/progress').set(auth(t)).expect(200)).body;
    expect(progress.badges).toHaveLength(0); // dilewati tidak memberi lencana
    expect(progress.summary).toMatchObject({ completedChapters: 9, skippedChapters: 9, badgeCount: 0 });
  });

  test('hanya era 1 dikuasai: era 2 terbuka & jadi era mulai, era 3 tetap terkunci', async () => {
    const t = await ctx.newStudent();
    const { body } = await ctx.api().get('/api/placement').set(auth(t)).expect(200);
    const era1 = body.questions[0].eraId;
    const res = await ctx
      .api()
      .post('/api/placement/submit')
      .set(auth(t))
      .send({ answers: answerFor(body.questions, [era1]) })
      .expect(200);
    expect(res.body.masteredEras.map((x) => x.id)).toEqual([era1]);
    expect(res.body.startEra.title).toBe('Kerajaan Islam');
    expect(res.body.eras.find((x) => x.eraId === era1)).toMatchObject({ score: 100, mastered: true });

    const e = await eras(t);
    expect(e.map((x) => x.status)).toEqual(['completed', 'unlocked', 'locked']);
  });

  test('skor di bawah 80 (1 dari 2 benar = 50) tidak menguasai era; soal tak dijawab dihitung salah', async () => {
    const t = await ctx.newStudent();
    const { body } = await ctx.api().get('/api/placement').set(auth(t)).expect(200);
    const all = answerFor(body.questions, 'all');
    const half = all.slice(0, 1); // hanya 1 soal dijawab (benar), sisanya kosong
    const res = await ctx.api().post('/api/placement/submit').set(auth(t)).send({ answers: half }).expect(200);
    expect(res.body.masteredEras).toHaveLength(0);
    expect(res.body.eras[0]).toMatchObject({ score: 50, correct: 1, total: 2, mastered: false });
    expect(res.body.startEra.title).toBe('Kerajaan Hindu-Buddha');
  });

  test('hanya sekali: GET/POST kedua -> 409; boleh diulang dengan retake dan hasil lama diganti', async () => {
    const t = await ctx.newStudent();
    const first = await ctx.api().get('/api/placement').set(auth(t)).expect(200);
    await ctx.api().post('/api/placement/submit').set(auth(t)).send({ answers: answerFor(first.body.questions, 'all') }).expect(200);

    const again = await ctx.api().get('/api/placement').set(auth(t)).expect(409);
    expect(again.body.error.code).toBe('PLACEMENT_ALREADY_TAKEN');
    const status = (await ctx.api().get('/api/me/placement').set(auth(t)).expect(200)).body;
    expect(status).toMatchObject({ taken: true });
    expect(status.masteredEras).toHaveLength(3);

    // Mengulang: semua salah -> lompatan lama dibuang, semua bab kembali tersedia
    const retake = await ctx.api().get('/api/placement?retake=true').set(auth(t)).expect(200);
    await ctx
      .api()
      .post('/api/placement/submit')
      .set(auth(t))
      .send({ retake: true, answers: answerFor(retake.body.questions, []) })
      .expect(200);
    const e = await eras(t);
    expect(e.map((x) => x.status)).toEqual(['unlocked', 'locked', 'locked']);
    expect(e[0].skippedChapters).toBe(0);
  });

  test('pengguna baru: /me/placement taken=false; submit tanpa mengambil soal -> 400', async () => {
    const t = await ctx.newStudent();
    expect((await ctx.api().get('/api/me/placement').set(auth(t)).expect(200)).body).toEqual({ taken: false });
    const res = await ctx.api().post('/api/placement/submit').set(auth(t)).send({ answers: [] }).expect(400);
    expect(res.body.error.code).toBe('TEST_NOT_STARTED');
  });

  test('menjawab soal di luar sesi ditolak (tidak bisa memilih soal sendiri)', async () => {
    const t = await ctx.newStudent();
    const { body } = await ctx.api().get('/api/placement').set(auth(t)).expect(200);
    const issued = new Set(body.questions.map((q) => q.id));
    const other = ctx.db.prepare('SELECT id FROM questions').all().find((r) => !issued.has(r.id));
    const res = await ctx
      .api()
      .post('/api/placement/submit')
      .set(auth(t))
      .send({ answers: [{ questionId: other.id, selectedIndex: 0 }] })
      .expect(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('tes lompat: era terkunci bisa dites; lulus >= 80 membuka era & melewati babnya', async () => {
    const t = await ctx.newStudent();
    const e = await eras(t);
    const era3 = e[2];
    expect(era3.status).toBe('locked');
    expect(era3.lock).toMatchObject({ reason: 'PREVIOUS_ERA_INCOMPLETE', testOutAvailable: true });
    expect(era3.lock.previousEra.title).toBe('Kerajaan Islam');

    // era terkunci: isi bab tetap ditolak sebelum tes lompat
    const chapterOfEra3 = ctx.chapterIdsOfEra(3)[0];
    await ctx.api().get(`/api/chapters/${chapterOfEra3}`).set(auth(t)).expect(403);

    const quiz = await ctx.api().get(`/api/eras/${era3.id}/test-out`).set(auth(t)).expect(200);
    expect(quiz.body.totalQuestions).toBe(6); // 3 bab x 2 soal
    expect(quiz.body.questions[0]).not.toHaveProperty('answerIndex');
    const res = await ctx
      .api()
      .post(`/api/eras/${era3.id}/test-out`)
      .set(auth(t))
      .send({ answers: answerFor(quiz.body.questions, 'all') })
      .expect(200);
    expect(res.body).toMatchObject({ passed: true, score: 100, skippedChapters: 3 });
    expect(res.body.unlockedEras.map((x) => x.id)).toContain(era3.id);
    expect(res.body.results[0]).toHaveProperty('correctIndex'); // kunci baru terlihat setelah submit

    const after = await eras(t);
    expect(after.map((x) => x.status)).toEqual(['unlocked', 'locked', 'completed']); // era 2 tidak ikut terbuka
    await ctx.api().get(`/api/chapters/${chapterOfEra3}`).set(auth(t)).expect(200);

    const progress = (await ctx.api().get('/api/me/progress').set(auth(t))).body;
    expect(progress.badges).toHaveLength(0);

    // era yang sudah selesai tidak perlu tes lompat lagi
    const done = await ctx.api().get(`/api/eras/${era3.id}/test-out`).set(auth(t)).expect(409);
    expect(done.body.error.code).toBe('ERA_ALREADY_DONE');
  });

  test('tes lompat gagal (< 80): tidak ada yang berubah dan boleh dicoba lagi', async () => {
    const t = await ctx.newStudent();
    const era2 = (await eras(t))[1];
    const quiz = await ctx.api().get(`/api/eras/${era2.id}/test-out`).set(auth(t)).expect(200);
    const res = await ctx
      .api()
      .post(`/api/eras/${era2.id}/test-out`)
      .set(auth(t))
      .send({ answers: answerFor(quiz.body.questions, []) })
      .expect(200);
    expect(res.body).toMatchObject({ passed: false, score: 0, skippedChapters: 0, unlockedEras: [] });
    expect((await eras(t))[1].status).toBe('locked');
    await ctx.api().get(`/api/eras/${era2.id}/test-out`).set(auth(t)).expect(200); // coba lagi
  });

  test('bab yang dilewati lalu dikerjakan sungguhan menjadi "completed"; lencana tetap bisa diraih', async () => {
    const t = await ctx.newStudent();
    const era1 = (await eras(t))[0];
    const quiz = await ctx.api().get(`/api/eras/${era1.id}/test-out`).set(auth(t)).expect(200);
    await ctx.api().post(`/api/eras/${era1.id}/test-out`).set(auth(t)).send({ answers: answerFor(quiz.body.questions, 'all') }).expect(200);
    expect((await chaptersOf(t, era1.id)).data.every((c) => c.status === 'skipped')).toBe(true);

    for (const id of ctx.chapterIdsOfEra(1)) await ctx.completeChapter(t, id, 5);
    const ch = await chaptersOf(t, era1.id);
    expect(ch.data.every((c) => c.status === 'completed')).toBe(true);
    const progress = (await ctx.api().get('/api/me/progress').set(auth(t))).body;
    expect(progress.badges).toHaveLength(1); // era diselesaikan lewat kuis bab, rata-rata 100
  });

  test('era dengan sebagian bab dilewati tidak memberi lencana walau sisanya nilai 100', async () => {
    const t = await ctx.newStudent();
    const [first, ...rest] = ctx.chapterIdsOfEra(1);
    // lewati hanya bab pertama lewat tes lompat lalu gagalkan: simulasikan dengan skip langsung
    ctx.db
      .prepare("INSERT INTO chapter_progress (user_id, chapter_id, skipped_at, skip_source) VALUES (?, ?, '2026-01-01T00:00:00Z', 'test_out')")
      .run(ctx.db.prepare('SELECT id FROM users ORDER BY id DESC LIMIT 1').get().id, first);
    for (const id of rest) await ctx.completeChapter(t, id, 5);
    const e = await eras(t);
    expect(e[0].status).toBe('completed');
    expect((await ctx.api().get('/api/me/progress').set(auth(t))).body.badges).toHaveLength(0);
  });
});
