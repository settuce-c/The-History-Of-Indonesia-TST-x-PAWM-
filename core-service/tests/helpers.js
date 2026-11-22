'use strict';
const request = require('supertest');
const { openDatabase } = require('../src/db');
const { createApp } = require('../src/app');
const { seedContent, seedAccounts } = require('../src/db/seed');

const ACCOUNTS = {
  admin: { email: 'admin@test.id', password: 'admin-pass-123', name: 'Admin Test', role: 'admin' },
  student: { email: 'siswa@test.id', password: 'siswa-pass-123', name: 'Siswa Test', role: 'student' },
};
const API_KEYS = { classroom: 'test-key-classroom', tourism: 'test-key-tourism' };
const silent = { log() {}, warn() {} };

/** App baru dengan database in-memory yang sudah berisi seed. Setiap test file terisolasi. */
function createTestContext() {
  const db = openDatabase(':memory:');
  seedContent(db);
  seedAccounts(
    db,
    {
      ...ACCOUNTS,
      apiKeys: [
        { client: 'classroom-service', key: API_KEYS.classroom },
        { client: 'tourism-language', key: API_KEYS.tourism },
      ],
    },
    silent
  );
  const app = createApp(db);
  const api = () => request(app);

  async function login(account) {
    const res = await api().post('/api/auth/login').send({ email: account.email, password: account.password });
    return res.body.token;
  }

  let counter = 0;
  async function newStudent() {
    counter += 1;
    const res = await api()
      .post('/api/auth/register')
      .send({ email: `murid${counter}@test.id`, password: 'password-123', name: `Murid ${counter}` });
    return res.body.token;
  }

  /** Kunci jawaban diambil langsung dari DB (hanya untuk test). */
  function answerKey(chapterId) {
    return db
      .prepare('SELECT id, answer_index, options FROM questions WHERE chapter_id = ? ORDER BY order_index')
      .all(chapterId)
      .map((q) => ({ id: q.id, answerIndex: q.answer_index, optionCount: JSON.parse(q.options).length }));
  }

  /** Bangun jawaban dengan `correct` soal benar, sisanya salah. */
  function answers(chapterId, correct) {
    return answerKey(chapterId).map((q, i) => ({
      questionId: q.id,
      selectedIndex: i < correct ? q.answerIndex : (q.answerIndex + 1) % q.optionCount,
    }));
  }

  const chapterIdsOfEra = (eraOrder) =>
    db
      .prepare(
        'SELECT c.id FROM chapters c JOIN eras e ON e.id = c.era_id WHERE e.order_index = ? ORDER BY c.order_index'
      )
      .all(eraOrder)
      .map((r) => r.id);

  /** Tuntaskan satu bab: tandai ditonton + kirim kuis dengan `correct` jawaban benar. */
  async function completeChapter(token, chapterId, correct = 5) {
    await api().post(`/api/chapters/${chapterId}/watched`).set('Authorization', `Bearer ${token}`).expect(200);
    return api()
      .post(`/api/chapters/${chapterId}/quiz/submit`)
      .set('Authorization', `Bearer ${token}`)
      .send({ answers: answers(chapterId, correct) })
      .expect(200);
  }

  return { db, app, api, login, newStudent, answerKey, answers, chapterIdsOfEra, completeChapter, ACCOUNTS, API_KEYS };
}

module.exports = { createTestContext };
