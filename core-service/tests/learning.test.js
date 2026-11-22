'use strict';
const { createTestContext } = require('./helpers');

describe('Curriculum, Assessment & Learning Progress (aturan bisnis)', () => {
  const ctx = createTestContext();
  const auth = (token) => ({ Authorization: `Bearer ${token}` });
  const [era1Chapters, era2Chapters, era3Chapters] = [1, 2, 3].map((o) => ctx.chapterIdsOfEra(o));

  test('user baru: hanya era pertama terbuka (aturan 1)', async () => {
    const token = await ctx.newStudent();
    const res = await ctx.api().get('/api/eras').set(auth(token)).expect(200);
    expect(res.body.data.map((e) => e.status)).toEqual(['unlocked', 'locked', 'locked']);
    expect(res.body.data[0]).toMatchObject({ chapterCount: 3, completedChapters: 0, badgeEarned: false });
  });

  test('daftar bab era terkunci boleh dilihat tetapi berstatus locked', async () => {
    const token = await ctx.newStudent();
    const res = await ctx.api().get('/api/eras/2/chapters').set(auth(token)).expect(200);
    expect(res.body.data.every((c) => c.status === 'locked')).toBe(true);
    expect(res.body.data[0]).not.toHaveProperty('videoUrl');
    await ctx.api().get('/api/eras/999/chapters').set(auth(token)).expect(404);
  });

  test('akses bab/kuis/watched/submit di era terkunci -> 403 ERA_LOCKED (aturan 6)', async () => {
    const token = await ctx.newStudent();
    const locked = era2Chapters[0];
    for (const req of [
      ctx.api().get(`/api/chapters/${locked}`),
      ctx.api().get(`/api/chapters/${locked}/quiz`),
      ctx.api().post(`/api/chapters/${locked}/watched`),
      ctx.api().post(`/api/chapters/${locked}/quiz/submit`).send({ answers: ctx.answers(locked, 5) }),
    ]) {
      const res = await req.set(auth(token)).expect(403);
      expect(res.body.error.code).toBe('ERA_LOCKED');
    }
  });

  test('detail bab berisi video, ringkasan, peristiwa & tokoh', async () => {
    const token = await ctx.newStudent();
    const res = await ctx.api().get(`/api/chapters/${era1Chapters[0]}`).set(auth(token)).expect(200);
    expect(res.body).toMatchObject({ status: 'not_started', watched: false, quiz: { questionCount: 5, passingScore: 70 } });
    expect(res.body.videoUrl).toMatch(/youtube\.com|youtu\.be/);
    expect(res.body.summary.length).toBeGreaterThan(50);
    expect(res.body.events.length).toBeGreaterThan(0);
    expect(res.body.figures.length).toBeGreaterThan(0);
    expect(res.body.events[0]).toHaveProperty('coordinates.lat');
    expect(res.body.nextChapter).toMatchObject({ id: era1Chapters[1] });
    await ctx.api().get('/api/chapters/9999').set(auth(token)).expect(404);
    await ctx.api().get('/api/chapters/abc').set(auth(token)).expect(400);
  });

  test('soal kuis TIDAK berisi kunci jawaban maupun pembahasan (aturan 3)', async () => {
    const token = await ctx.newStudent();
    const res = await ctx.api().get(`/api/chapters/${era1Chapters[0]}/quiz`).set(auth(token)).expect(200);
    expect(res.body.questions).toHaveLength(5);
    for (const q of res.body.questions) {
      expect(Object.keys(q).sort()).toEqual(['id', 'options', 'order', 'question']);
    }
    const raw = JSON.stringify(res.body);
    expect(raw).not.toMatch(/answer|correct|explanation/i);
  });

  test('penilaian di server: skor, lulus >= 70, kunci & pembahasan setelah submit (aturan 2 & 3)', async () => {
    const token = await ctx.newStudent();
    const ch = era1Chapters[0];
    const submit = (correct) =>
      ctx.api().post(`/api/chapters/${ch}/quiz/submit`).set(auth(token)).send({ answers: ctx.answers(ch, correct) });

    const fail = await submit(3).expect(200); // 60
    expect(fail.body).toMatchObject({ score: 60, passed: false, correctCount: 3, totalQuestions: 5, attempt: 1 });
    expect(fail.body.results[0]).toEqual(
      expect.objectContaining({ correct: true, correctIndex: expect.any(Number), explanation: expect.any(String) })
    );
    expect(fail.body.results[4].correct).toBe(false);

    const pass = await submit(4).expect(200); // 80 -> lulus
    expect(pass.body).toMatchObject({ score: 80, passed: true, bestScore: 80, attempt: 2 });

    const lower = await submit(2).expect(200); // 40, nilai tertinggi tetap 80
    expect(lower.body).toMatchObject({ score: 40, passed: false, bestScore: 80, attempt: 3 });

    const detail = await ctx.api().get(`/api/chapters/${ch}`).set(auth(token)).expect(200);
    expect(detail.body).toMatchObject({ passed: true, bestScore: 80, attempts: 3 });
  });

  test('soal yang tidak dijawab dihitung salah; jawaban tidak valid ditolak 400', async () => {
    const token = await ctx.newStudent();
    const ch = era1Chapters[0];
    const [first] = ctx.answers(ch, 5);
    const partial = await ctx
      .api()
      .post(`/api/chapters/${ch}/quiz/submit`)
      .set(auth(token))
      .send({ answers: [first] })
      .expect(200);
    expect(partial.body).toMatchObject({ score: 20, passed: false });
    expect(partial.body.results[1].selectedIndex).toBeNull();

    const post = (answers) => ctx.api().post(`/api/chapters/${ch}/quiz/submit`).set(auth(token)).send({ answers });
    const otherChapterQ = ctx.answerKey(era1Chapters[1])[0].id;
    await post([{ questionId: otherChapterQ, selectedIndex: 0 }]).expect(400);
    await post([first, first]).expect(400);
    await post([{ questionId: first.questionId, selectedIndex: 9 }]).expect(400);
    await post([]).expect(400);
    await post('bukan-array').expect(400);
  });

  test('bab selesai hanya jika ditonton DAN lulus kuis (aturan 4)', async () => {
    const token = await ctx.newStudent();
    const ch = era1Chapters[0];
    const r1 = await ctx
      .api()
      .post(`/api/chapters/${ch}/quiz/submit`)
      .set(auth(token))
      .send({ answers: ctx.answers(ch, 5) })
      .expect(200);
    expect(r1.body.chapterCompleted).toBe(false);

    const status1 = await ctx.api().get('/api/eras/1/chapters').set(auth(token)).expect(200);
    expect(status1.body.data[0].status).toBe('in_progress');

    const r2 = await ctx.api().post(`/api/chapters/${ch}/watched`).set(auth(token)).expect(200);
    expect(r2.body).toMatchObject({ status: 'completed', chapterCompleted: true, watched: true });

    // menonton saja tanpa lulus tidak cukup
    const r3 = await ctx.api().post(`/api/chapters/${era1Chapters[1]}/watched`).set(auth(token)).expect(200);
    expect(r3.body).toMatchObject({ status: 'in_progress', chapterCompleted: false });
  });

  test('menuntaskan semua bab era 1 membuka era 2; rata-rata < 90 tanpa lencana', async () => {
    const token = await ctx.newStudent();
    await ctx.completeChapter(token, era1Chapters[0], 4); // 80
    await ctx.completeChapter(token, era1Chapters[1], 4); // 80
    const last = await ctx.completeChapter(token, era1Chapters[2], 5); // 100 -> rata-rata 86.7
    expect(last.body.eraUnlocked).toMatchObject({ id: 2, title: 'Kerajaan Islam' });
    expect(last.body.badgeEarned).toBeNull();

    const eras = await ctx.api().get('/api/eras').set(auth(token)).expect(200);
    expect(eras.body.data.map((e) => e.status)).toEqual(['completed', 'unlocked', 'locked']);
    expect(eras.body.data[0]).toMatchObject({ averageScore: 86.7, badgeEarned: false });
    await ctx.api().get(`/api/chapters/${era2Chapters[0]}`).set(auth(token)).expect(200);
    await ctx.api().get(`/api/chapters/${era3Chapters[0]}`).set(auth(token)).expect(403);

    // memperbaiki nilai menaikkan rata-rata -> lencana diberikan belakangan
    const improved = await ctx
      .api()
      .post(`/api/chapters/${era1Chapters[0]}/quiz/submit`)
      .set(auth(token))
      .send({ answers: ctx.answers(era1Chapters[0], 5) })
      .expect(200);
    expect(improved.body.eraUnlocked).toBeNull(); // sudah terbuka sebelumnya
    expect(improved.body.badgeEarned).toMatchObject({ eraId: 1, averageScore: 93.3 }); // (100+80+100)/3
  });

  test('lencana era diberikan jika era tuntas dengan rata-rata >= 90 (aturan 5)', async () => {
    const token = await ctx.newStudent();
    await ctx.completeChapter(token, era1Chapters[0], 5);
    await ctx.completeChapter(token, era1Chapters[1], 4);
    const last = await ctx.completeChapter(token, era1Chapters[2], 5); // (100+80+100)/3 = 93.3
    expect(last.body.badgeEarned).toMatchObject({ eraId: 1, name: 'Lencana Kerajaan Hindu-Buddha', averageScore: 93.3 });

    // lencana tidak diberikan dua kali
    const again = await ctx.completeChapter(token, era1Chapters[2], 5);
    expect(again.body.badgeEarned).toBeNull();

    const progress = await ctx.api().get('/api/me/progress').set(auth(token)).expect(200);
    expect(progress.body.summary).toMatchObject({ completedEras: 1, completedChapters: 3, badgeCount: 1, totalChapters: 9 });
    expect(progress.body.badges).toHaveLength(1);
    expect(progress.body.eras[1].status).toBe('unlocked');
  });

  test('progres antar user terpisah', async () => {
    const a = await ctx.newStudent();
    const b = await ctx.newStudent();
    for (const ch of era1Chapters) await ctx.completeChapter(a, ch, 5);
    const eraB = await ctx.api().get('/api/eras').set(auth(b)).expect(200);
    expect(eraB.body.data[1].status).toBe('locked');
  });
});
