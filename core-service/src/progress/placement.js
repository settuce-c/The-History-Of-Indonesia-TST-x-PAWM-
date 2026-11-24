'use strict';
const config = require('../config');
const { AppError, errors } = require('../shared/errors');

/**
 * Tes awal (placement test) dan tes lompat (test-out) ala Duolingo.
 *
 * Keputusan desain: soal yang DITERBITKAN disimpan di tabel test_sessions. Saat submit,
 * server menilai berdasarkan sesi itu, bukan berdasarkan soal yang dipilih klien. Dengan begitu
 * pengguna tidak bisa menjawab hanya soal yang ia suka (mis. 1 soal benar = skor 100).
 */
function createPlacementService(db, { curriculum, assessment, progress }) {
  const mastery = () => config.rules.skipScore;
  const q = {
    saveSession: db.prepare(
      `INSERT INTO test_sessions (user_id, kind, ref_id, question_ids)
       VALUES (?, ?, ?, ?)
       ON CONFLICT (user_id, kind, ref_id) DO UPDATE SET
         question_ids = excluded.question_ids,
         created_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')`
    ),
    session: db.prepare('SELECT * FROM test_sessions WHERE user_id = ? AND kind = ? AND ref_id = ?'),
    dropSession: db.prepare('DELETE FROM test_sessions WHERE user_id = ? AND kind = ? AND ref_id = ?'),
    result: db.prepare('SELECT * FROM placement_results WHERE user_id = ?'),
    saveResult: db.prepare(
      `INSERT INTO placement_results (user_id, scores, start_era_id) VALUES (?, ?, ?)
       ON CONFLICT (user_id) DO UPDATE SET
         scores = excluded.scores,
         start_era_id = excluded.start_era_id,
         taken_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')`
    ),
  };

  const brief = (era) => (era ? { id: era.id, title: era.title } : null);

  function loadSession(userId, kind, refId) {
    const row = q.session.get(userId, kind, refId);
    if (!row) {
      throw errors.badRequest('Tes belum dimulai. Ambil soal terlebih dahulu sebelum mengirim jawaban.', 'TEST_NOT_STARTED');
    }
    const rows = assessment.rowsByIds(JSON.parse(row.question_ids));
    if (rows.length === 0) {
      throw new AppError(409, 'TEST_EXPIRED', 'Soal tes sudah berubah. Mulai tes lagi untuk mendapat soal baru.');
    }
    return rows;
  }

  // ---------------- Tes awal ----------------

  /** Hasil tes awal terakhir (atau { taken: false }). */
  function status(userId) {
    const row = q.result.get(userId);
    if (!row) return { taken: false };
    const eras = new Map(curriculum.listEras().map((e) => [e.id, e]));
    const scores = JSON.parse(row.scores).map((s) => ({ ...s, title: eras.get(s.eraId)?.title ?? null }));
    return {
      taken: true,
      takenAt: row.taken_at,
      masteryScore: mastery(),
      eras: scores,
      masteredEras: scores.filter((s) => s.mastered).map((s) => ({ id: s.eraId, title: s.title })),
      startEra: brief(eras.get(row.start_era_id)),
    };
  }

  /** Terbitkan soal tes awal: ±2 soal acak dari bank soal tiap era (tanpa kunci jawaban). */
  function startPlacement(userId, { retake = false } = {}) {
    if (q.result.get(userId) && !retake) {
      throw new AppError(
        409,
        'PLACEMENT_ALREADY_TAKEN',
        'Tes awal hanya bisa dikerjakan sekali. Untuk mengulang, pilih "Ulangi tes awal" di Profil.'
      );
    }
    const picked = [];
    const questions = [];
    for (const era of curriculum.listEras()) {
      const rows = assessment.sampleOfEra(era.id, config.rules.placementQuestionsPerEra);
      for (const row of rows) {
        picked.push(row.id);
        questions.push({ ...assessment.toStudent([row])[0], eraId: era.id, eraTitle: era.title });
      }
    }
    if (questions.length === 0) throw errors.badRequest('Belum ada soal untuk tes awal', 'QUIZ_EMPTY');
    q.saveSession.run(userId, 'placement', 0, JSON.stringify(picked));
    return { masteryScore: mastery(), totalQuestions: questions.length, questions };
  }

  const submitPlacementTx = db.transaction((userId, answers, retake) => {
    if (q.result.get(userId) && !retake) {
      throw new AppError(409, 'PLACEMENT_ALREADY_TAKEN', 'Tes awal hanya bisa dikerjakan sekali.');
    }
    const rows = loadSession(userId, 'placement', 0);
    const graded = assessment.gradeRows(rows, answers);
    const eraOf = assessment.eraOfQuestions(rows.map((r) => r.id));

    // Skor per era = persentase benar dari soal era itu yang diterbitkan.
    const perEra = new Map();
    for (const r of graded.results) {
      const eraId = eraOf.get(r.questionId);
      const e = perEra.get(eraId) || { eraId, correct: 0, total: 0 };
      e.total += 1;
      if (r.correct) e.correct += 1;
      perEra.set(eraId, e);
    }
    const eras = curriculum.listEras();
    const scores = eras.map((era) => {
      const e = perEra.get(era.id);
      if (!e) return { eraId: era.id, score: null, correct: 0, total: 0, mastered: false }; // era tanpa soal
      const score = Math.round((e.correct / e.total) * 100);
      return { eraId: era.id, score, correct: e.correct, total: e.total, mastered: score >= mastery() };
    });

    // Mengulang tes: buang lompatan dari tes awal sebelumnya, lalu terapkan hasil baru.
    progress.clearSkips(userId, 'placement');
    let skippedChapters = 0;
    for (const s of scores.filter((x) => x.mastered)) {
      skippedChapters += progress.skipChapters(
        userId,
        curriculum.listChapters(s.eraId).map((c) => c.id),
        'placement'
      );
    }

    // Era mulai = era pertama (urut) yang belum tuntas setelah lompatan diterapkan.
    const state = progress.computeState(userId);
    const start = state.find((s) => !s.completed);
    q.saveResult.run(userId, JSON.stringify(scores), start ? start.era.id : null);
    q.dropSession.run(userId, 'placement', 0);

    return { graded, scores, eras, skippedChapters, startEra: start ? brief(start.era) : null };
  });

  function submitPlacement(userId, answers, { retake = false } = {}) {
    const { graded, scores, eras, skippedChapters, startEra } = submitPlacementTx(userId, answers, retake);
    const byId = new Map(eras.map((e) => [e.id, e]));
    const withTitle = scores.map((s) => ({ ...s, title: byId.get(s.eraId).title }));
    return {
      masteryScore: mastery(),
      totalQuestions: graded.totalQuestions,
      correctCount: graded.correctCount,
      eras: withTitle,
      masteredEras: withTitle.filter((s) => s.mastered).map((s) => ({ id: s.eraId, title: s.title })),
      skippedChapters,
      startEra,
      allMastered: startEra === null,
    };
  }

  // ---------------- Tes lompat ----------------

  /** Terbitkan kuis gabungan satu era (±2 soal acak per bab). Boleh kapan saja, termasuk untuk era terkunci. */
  function startTestOut(userId, eraId) {
    const era = curriculum.requireEra(eraId);
    const state = progress.eraState(userId, era.id);
    if (state.completed) {
      throw new AppError(409, 'ERA_ALREADY_DONE', `Era "${era.title}" sudah selesai, tidak perlu tes lompat.`);
    }
    const picked = [];
    for (const ch of curriculum.listChapters(era.id)) {
      for (const row of assessment.sampleOfChapter(ch.id, config.rules.testOutQuestionsPerChapter)) picked.push(row);
    }
    if (picked.length === 0) throw errors.badRequest('Era ini belum memiliki soal', 'QUIZ_EMPTY');
    q.saveSession.run(userId, 'test_out', era.id, JSON.stringify(picked.map((r) => r.id)));
    return {
      eraId: era.id,
      eraTitle: era.title,
      masteryScore: mastery(),
      totalQuestions: picked.length,
      questions: assessment.toStudent(picked),
    };
  }

  const submitTestOutTx = db.transaction((userId, eraId, answers) => {
    const rows = loadSession(userId, 'test_out', eraId);
    const graded = assessment.gradeRows(rows, answers);
    const passed = graded.score >= mastery();
    let skippedChapters = 0;
    let unlockedEras = [];
    if (passed) {
      const before = progress.computeState(userId);
      skippedChapters = progress.skipChapters(
        userId,
        curriculum.listChapters(eraId).map((c) => c.id),
        'test_out'
      );
      const after = progress.computeState(userId);
      unlockedEras = after
        .filter((s, i) => s.unlocked && !before[i].unlocked)
        .map((s) => brief(s.era));
    }
    q.dropSession.run(userId, 'test_out', eraId);
    return { graded, passed, skippedChapters, unlockedEras };
  });

  function submitTestOut(userId, eraId, answers) {
    const era = curriculum.requireEra(eraId);
    const { graded, passed, skippedChapters, unlockedEras } = submitTestOutTx(userId, era.id, answers);
    return {
      eraId: era.id,
      eraTitle: era.title,
      score: graded.score,
      passed,
      masteryScore: mastery(),
      correctCount: graded.correctCount,
      totalQuestions: graded.totalQuestions,
      skippedChapters,
      unlockedEras,
      results: graded.results,
    };
  }

  return { status, startPlacement, submitPlacement, startTestOut, submitTestOut };
}

module.exports = { createPlacementService };
