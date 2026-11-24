'use strict';
const config = require('../config');
const { errors } = require('../shared/errors');

const parseOptions = (r) => JSON.parse(r.options);

/** Bentuk soal untuk pengguna: tanpa answer_index dan tanpa pembahasan. */
const toStudentQuestion = (r) => ({ id: r.id, order: r.order_index, question: r.question, options: parseOptions(r) });

/** Bentuk soal lengkap (admin & kelompok mitra): termasuk kunci & pembahasan. */
const toFullQuestion = (r) => ({
  id: r.id,
  chapterId: r.chapter_id,
  order: r.order_index,
  question: r.question,
  options: parseOptions(r),
  answerIndex: r.answer_index,
  explanation: r.explanation,
  source: r.source, // 'manual' | 'ai'
  status: r.status, // 'draft' | 'approved'
});

/**
 * Bounded context Assessment: soal pilihan ganda, penilaian di server, riwayat percobaan.
 * Hanya soal berstatus 'approved' yang sampai ke pengguna; draf AI menunggu persetujuan admin.
 */
function createAssessmentService(db) {
  const q = {
    questions: db.prepare(
      "SELECT * FROM questions WHERE chapter_id = ? AND status = 'approved' ORDER BY order_index, id"
    ),
    allQuestions: db.prepare('SELECT * FROM questions WHERE chapter_id = ? ORDER BY order_index, id'),
    sampleOfChapter: db.prepare(
      "SELECT * FROM questions WHERE chapter_id = ? AND status = 'approved' ORDER BY RANDOM() LIMIT ?"
    ),
    sampleOfEra: db.prepare(
      `SELECT q.* FROM questions q JOIN chapters c ON c.id = q.chapter_id
       WHERE c.era_id = ? AND q.status = 'approved' ORDER BY RANDOM() LIMIT ?`
    ),
    countByEra: db.prepare(
      `SELECT c.era_id AS era_id, COUNT(*) AS n FROM questions q JOIN chapters c ON c.id = q.chapter_id
       WHERE q.status = 'approved' GROUP BY c.era_id`
    ),
    question: db.prepare('SELECT * FROM questions WHERE id = ?'),
    count: db.prepare("SELECT COUNT(*) AS n FROM questions WHERE chapter_id = ? AND status = 'approved'"),
    maxOrder: db.prepare('SELECT COALESCE(MAX(order_index), 0) AS m FROM questions WHERE chapter_id = ?'),
    insertAttempt: db.prepare(
      'INSERT INTO quiz_attempts (user_id, chapter_id, score, passed, answers) VALUES (?, ?, ?, ?, ?)'
    ),
    attemptCount: db.prepare('SELECT COUNT(*) AS n FROM quiz_attempts WHERE user_id = ? AND chapter_id = ?'),
  };

  const countQuestions = (chapterId) => q.count.get(chapterId).n;

  function studentQuiz(chapterId) {
    return q.questions.all(chapterId).map(toStudentQuestion);
  }

  /**
   * Penilaian di server terhadap sekumpulan soal. answers = [{ questionId, selectedIndex }].
   * Soal yang tidak dijawab dihitung salah. Skor = persentase benar (0-100, dibulatkan).
   */
  function gradeRows(questions, answers) {
    const byId = new Map(questions.map((row) => [row.id, row]));
    const selected = new Map();
    for (const a of answers) {
      const row = byId.get(a.questionId);
      if (!row) throw errors.validation(`Soal ${a.questionId} bukan bagian dari kuis ini`);
      if (selected.has(a.questionId)) throw errors.validation(`Soal ${a.questionId} dijawab lebih dari sekali`);
      if (a.selectedIndex >= parseOptions(row).length) {
        throw errors.validation(`Pilihan ${a.selectedIndex} tidak tersedia untuk soal ${a.questionId}`);
      }
      selected.set(a.questionId, a.selectedIndex);
    }

    const results = questions.map((row) => {
      const selectedIndex = selected.has(row.id) ? selected.get(row.id) : null;
      return {
        questionId: row.id,
        question: row.question,
        options: parseOptions(row),
        selectedIndex,
        correctIndex: row.answer_index,
        correct: selectedIndex === row.answer_index,
        explanation: row.explanation,
      };
    });
    const correctCount = results.filter((r) => r.correct).length;
    return {
      score: Math.round((correctCount / questions.length) * 100),
      correctCount,
      totalQuestions: questions.length,
      results,
    };
  }

  /** Kuis bab: lulus jika skor >= passingScore. */
  function grade(chapterId, answers) {
    const questions = q.questions.all(chapterId);
    if (questions.length === 0) throw errors.badRequest('Bab ini belum memiliki soal kuis', 'QUIZ_EMPTY');
    const g = gradeRows(questions, answers);
    return { ...g, passed: g.score >= config.rules.passingScore, passingScore: config.rules.passingScore };
  }

  // ---------- Dukungan tes awal & tes lompat ----------

  /** Soal acak dari bank soal satu era / satu bab (baris mentah, dipakai pemanggil untuk menyimpan sesi). */
  const sampleOfEra = (eraId, limit) => q.sampleOfEra.all(eraId, limit);
  const sampleOfChapter = (chapterId, limit) => q.sampleOfChapter.all(chapterId, limit);
  const toStudent = (rows) => rows.map(toStudentQuestion);

  /** Soal dari sesi tes yang tersimpan, urutan sesuai ids. Soal yang sudah dihapus/ditarik admin dilewati. */
  function rowsByIds(ids) {
    if (ids.length === 0) return [];
    const rows = db
      .prepare(`SELECT * FROM questions WHERE id IN (${ids.map(() => '?').join(',')}) AND status = 'approved'`)
      .all(...ids);
    const byId = new Map(rows.map((r) => [r.id, r]));
    return ids.map((i) => byId.get(i)).filter(Boolean);
  }

  /** Peta era -> jumlah soal approved, untuk menandai era yang bisa dites lompat. */
  const questionCountByEra = () => new Map(q.countByEra.all().map((r) => [r.era_id, r.n]));

  /** Peta id soal -> id era (untuk mengelompokkan jawaban tes awal per era). */
  function eraOfQuestions(ids) {
    if (ids.length === 0) return new Map();
    return new Map(
      db
        .prepare(
          `SELECT q.id AS id, c.era_id AS era_id FROM questions q JOIN chapters c ON c.id = q.chapter_id
           WHERE q.id IN (${ids.map(() => '?').join(',')})`
        )
        .all(...ids)
        .map((r) => [r.id, r.era_id])
    );
  }

  function recordAttempt(userId, chapterId, result, answers) {
    q.insertAttempt.run(userId, chapterId, result.score, result.passed ? 1 : 0, JSON.stringify(answers));
    return q.attemptCount.get(userId, chapterId).n;
  }

  const attemptCount = (userId, chapterId) => q.attemptCount.get(userId, chapterId).n;

  /** Open Host Service: soal + kunci jawaban per topik untuk kelompok lain (hanya yang sudah disetujui). */
  function publicQuiz({ topic, limit }) {
    const params = [];
    let where = "WHERE q.status = 'approved'";
    if (topic) {
      const like = `%${topic.toLowerCase()}%`;
      where +=
        ' AND (LOWER(c.title) LIKE ? OR c.slug LIKE ? OR c.topic_tags LIKE ? OR LOWER(q.question) LIKE ?)';
      params.push(like, like, like, like);
    }
    return db
      .prepare(
        `SELECT q.*, c.title AS chapter_title FROM questions q JOIN chapters c ON c.id = q.chapter_id
         ${where} ORDER BY RANDOM() LIMIT ?`
      )
      .all(...params, limit)
      .map((r) => {
        const full = toFullQuestion(r);
        return { ...full, chapterTitle: r.chapter_title, answer: full.options[full.answerIndex] };
      });
  }

  // ---------- Admin CRUD ----------

  function requireQuestion(id) {
    const row = q.question.get(id);
    if (!row) throw errors.notFound(`Soal dengan id ${id} tidak ditemukan`);
    return toFullQuestion(row);
  }

  /** Semua status (draf + disetujui), untuk layar admin. */
  const listFull = (chapterId) => q.allQuestions.all(chapterId).map(toFullQuestion);

  function createQuestion(chapterId, data, { source = 'manual', status = 'approved' } = {}) {
    const order = data.order ?? q.maxOrder.get(chapterId).m + 1;
    const info = db
      .prepare(
        `INSERT INTO questions (chapter_id, question, options, answer_index, explanation, order_index, source, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(chapterId, data.question, JSON.stringify(data.options), data.answerIndex, data.explanation ?? '', order, source, status);
    return requireQuestion(info.lastInsertRowid);
  }

  /** Simpan soal hasil AI sebagai DRAF (tidak dipakai pengguna sampai admin menyetujui). */
  const createDrafts = db.transaction((chapterId, items) =>
    items.map((item) => createQuestion(chapterId, item, { source: 'ai', status: 'draft' }))
  );

  /** Teks soal yang sudah ada di bab (semua status), untuk mencegah duplikat dari AI. */
  const questionTexts = (chapterId) => q.allQuestions.all(chapterId).map((r) => r.question);

  function approveQuestion(id) {
    requireQuestion(id);
    db.prepare("UPDATE questions SET status = 'approved' WHERE id = ?").run(id);
    return requireQuestion(id);
  }

  function updateQuestion(id, data) {
    const current = requireQuestion(id);
    const merged = { ...current, ...data };
    if (merged.answerIndex >= merged.options.length) {
      throw errors.validation('answerIndex harus menunjuk salah satu options');
    }
    db.prepare(
      'UPDATE questions SET question = ?, options = ?, answer_index = ?, explanation = ?, order_index = ? WHERE id = ?'
    ).run(merged.question, JSON.stringify(merged.options), merged.answerIndex, merged.explanation, merged.order, id);
    return requireQuestion(id);
  }

  function deleteQuestion(id) {
    requireQuestion(id);
    db.prepare('DELETE FROM questions WHERE id = ?').run(id);
  }

  return {
    countQuestions,
    studentQuiz,
    grade,
    gradeRows,
    sampleOfEra,
    sampleOfChapter,
    toStudent,
    rowsByIds,
    questionCountByEra,
    eraOfQuestions,
    recordAttempt,
    attemptCount,
    publicQuiz,
    listFull,
    createQuestion,
    createDrafts,
    questionTexts,
    approveQuestion,
    updateQuestion,
    deleteQuestion,
  };
}

module.exports = { createAssessmentService };
