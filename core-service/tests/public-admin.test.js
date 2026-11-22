'use strict';
const { createTestContext } = require('./helpers');

describe('Open Host Service (X-API-Key)', () => {
  const ctx = createTestContext();
  const key = { 'X-API-Key': ctx.API_KEYS.tourism };

  test('GET /api/public/eras', async () => {
    const res = await ctx.api().get('/api/public/eras').set(key).expect(200);
    expect(res.body.data).toHaveLength(3);
    expect(res.body.data[0]).toMatchObject({ title: 'Kerajaan Hindu-Buddha', chapterCount: 3, order: 1 });
  });

  test('GET /api/public/learning-path berurutan era lalu bab', async () => {
    const res = await ctx.api().get('/api/public/learning-path').set(key).expect(200);
    expect(res.body).toMatchObject({ totalEras: 3, totalChapters: 9 });
    const steps = res.body.data.flatMap((e) => e.chapters.map((c) => c.step));
    expect(steps).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  test('GET /api/public/quiz?topic=majapahit menyertakan kunci jawaban', async () => {
    const res = await ctx.api().get('/api/public/quiz?topic=majapahit&limit=3').set(key).expect(200);
    expect(res.body.count).toBe(3);
    for (const q of res.body.data) {
      expect(q.chapterTitle).toBe('Majapahit');
      expect(q.answer).toBe(q.options[q.answerIndex]);
      expect(q.explanation).toEqual(expect.any(String));
    }
    await ctx.api().get('/api/public/quiz?limit=100').set(key).expect(400);
    const empty = await ctx.api().get('/api/public/quiz?topic=atlantis').set(key).expect(200);
    expect(empty.body.count).toBe(0);
  });

  test('GET /api/public/events?keyword= mencari peristiwa & tokoh', async () => {
    const res = await ctx.api().get('/api/public/events?keyword=Gajah Mada').set(key).expect(200);
    const names = res.body.data.map((d) => d.name);
    expect(names).toEqual(expect.arrayContaining(['Gajah Mada', 'Sumpah Palapa']));
    expect(res.body.data[0]).toEqual(
      expect.objectContaining({ year: expect.any(Number), location: expect.any(String), chapters: expect.any(Array) })
    );
    const figures = await ctx.api().get('/api/public/events?kind=figure&limit=50').set(key).expect(200);
    expect(figures.body.data.every((d) => d.kind === 'figure')).toBe(true);
  });

  test('GET /api/public/recommendations?chapterId= memberi bab lanjutan', async () => {
    const res = await ctx.api().get('/api/public/recommendations?chapterId=2').set(key).expect(200);
    expect(res.body.data.map((d) => d.id)).toEqual([3, 4, 5]);
    expect(res.body.data[0].reason).toMatch(/era yang sama/);
    expect(res.body.data[1].reason).toMatch(/era berikutnya/);
    await ctx.api().get('/api/public/recommendations').set(key).expect(400);
    await ctx.api().get('/api/public/recommendations?chapterId=999').set(key).expect(404);
  });
});

describe('Admin CRUD era, bab, soal', () => {
  const ctx = createTestContext();
  let auth;
  beforeAll(async () => {
    auth = { Authorization: `Bearer ${await ctx.login(ctx.ACCOUNTS.admin)}` };
  });

  test('CRUD lengkap era -> bab -> soal', async () => {
    const era = await ctx.api().post('/api/admin/eras').set(auth).send({ title: 'Masa Kemerdekaan', startYear: 1945 }).expect(201);
    expect(era.body).toMatchObject({ slug: 'masa-kemerdekaan', order: 4 });

    const chapter = await ctx
      .api()
      .post('/api/admin/chapters')
      .set(auth)
      .send({
        eraId: era.body.id,
        title: 'Proklamasi',
        videoUrl: 'https://youtu.be/abc123',
        summary: 'Proklamasi kemerdekaan 17 Agustus 1945.',
        topicTags: ['proklamasi'],
      })
      .expect(201);
    expect(chapter.body).toMatchObject({ order: 1, topicTags: ['proklamasi'] });

    const question = await ctx
      .api()
      .post(`/api/admin/chapters/${chapter.body.id}/questions`)
      .set(auth)
      .send({ question: 'Kapan proklamasi dibacakan?', options: ['17 Agustus 1945', '1 Juni 1945'], answerIndex: 0 })
      .expect(201);
    expect(question.body.answerIndex).toBe(0);

    await ctx.api().put(`/api/admin/questions/${question.body.id}`).set(auth).send({ answerIndex: 5 }).expect(400);
    const updated = await ctx
      .api()
      .put(`/api/admin/questions/${question.body.id}`)
      .set(auth)
      .send({ explanation: 'Dibacakan Soekarno-Hatta.' })
      .expect(200);
    expect(updated.body.explanation).toBe('Dibacakan Soekarno-Hatta.');

    await ctx.api().put(`/api/admin/chapters/${chapter.body.id}`).set(auth).send({ videoUrl: 'https://youtu.be/xyz789' }).expect(200);
    await ctx.api().put(`/api/admin/eras/${era.body.id}`).set(auth).send({ endYear: 1949 }).expect(200);

    const list = await ctx.api().get(`/api/admin/chapters/${chapter.body.id}/questions`).set(auth).expect(200);
    expect(list.body.data).toHaveLength(1);

    await ctx.api().delete(`/api/admin/questions/${question.body.id}`).set(auth).expect(204);
    await ctx.api().delete(`/api/admin/chapters/${chapter.body.id}`).set(auth).expect(204);
    await ctx.api().delete(`/api/admin/eras/${era.body.id}`).set(auth).expect(204);
    await ctx.api().delete(`/api/admin/eras/${era.body.id}`).set(auth).expect(404);
  });

  test('validasi admin: hanya tautan YouTube, slug unik, answerIndex dalam rentang', async () => {
    const bad = await ctx
      .api()
      .post('/api/admin/chapters')
      .set(auth)
      .send({ eraId: 1, title: 'Bab Vimeo', videoUrl: 'https://vimeo.com/123', summary: 'Ringkasan cukup panjang.' })
      .expect(400);
    expect(bad.body.error.details[0].field).toBe('videoUrl');

    await ctx.api().post('/api/admin/eras').set(auth).send({ title: 'Duplikat', slug: 'kerajaan-islam' }).expect(409);
    await ctx
      .api()
      .post('/api/admin/chapters/1/questions')
      .set(auth)
      .send({ question: 'Soal tidak valid?', options: ['a', 'b'], answerIndex: 2 })
      .expect(400);
    await ctx.api().post('/api/admin/chapters').set(auth).send({ eraId: 999, title: 'Tanpa era', videoUrl: 'https://youtu.be/a1', summary: 'Ringkasan cukup panjang.' }).expect(404);
  });
});
