'use strict';
const config = require('../config');
const { errors } = require('../shared/errors');

const round1 = (n) => Math.round(n * 10) / 10;

/**
 * Bounded context Learning Progress.
 *
 * Status tidak disimpan sebagai kolom "locked/unlocked", tetapi DIHITUNG dari data progres
 * setiap kali dibutuhkan (computeState). Keuntungannya: aturan bisnis ada di satu tempat dan
 * selalu konsisten, misalnya ketika admin menambah bab baru di era yang sudah tuntas.
 */
function createProgressService(db, { curriculum }) {
  const q = {
    progressOfUser: db.prepare('SELECT * FROM chapter_progress WHERE user_id = ?'),
    badgesOfUser: db.prepare('SELECT * FROM era_badges WHERE user_id = ?'),
    markWatched: db.prepare(
      `INSERT INTO chapter_progress (user_id, chapter_id, watched_at)
       VALUES (?, ?, strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
       ON CONFLICT (user_id, chapter_id) DO UPDATE SET watched_at = COALESCE(watched_at, excluded.watched_at)`
    ),
    // Aturan 2: percobaan tidak dibatasi, yang disimpan nilai TERTINGGI.
    recordScore: db.prepare(
      `INSERT INTO chapter_progress (user_id, chapter_id, best_score, passed_at)
       VALUES (@userId, @chapterId, @score, CASE WHEN @passed = 1 THEN strftime('%Y-%m-%dT%H:%M:%SZ', 'now') END)
       ON CONFLICT (user_id, chapter_id) DO UPDATE SET
         best_score = MAX(COALESCE(best_score, 0), excluded.best_score),
         passed_at  = COALESCE(passed_at, excluded.passed_at)`
    ),
    awardBadge: db.prepare('INSERT OR IGNORE INTO era_badges (user_id, era_id, average_score) VALUES (?, ?, ?)'),
  };

  /** Hitung status seluruh era & bab untuk satu user. */
  function computeState(userId) {
    const eras = curriculum.listEras();
    const chapters = curriculum.learningPath();
    const progress = new Map(q.progressOfUser.all(userId).map((p) => [p.chapter_id, p]));
    const badges = new Map(q.badgesOfUser.all(userId).map((b) => [b.era_id, b]));

    let previousCompleted = true; // aturan 1: era pertama selalu terbuka
    return eras.map((era) => {
      const unlocked = previousCompleted;
      const chs = chapters
        .filter((c) => c.eraId === era.id)
        .map((c) => {
          const p = progress.get(c.id);
          const watched = Boolean(p?.watched_at);
          const passed = Boolean(p?.passed_at);
          const bestScore = p?.best_score ?? null;
          const completed = watched && passed; // aturan 4
          let status = 'not_started';
          if (!unlocked) status = 'locked';
          else if (completed) status = 'completed';
          else if (watched || bestScore !== null) status = 'in_progress';
          return { chapter: c, status, watched, passed, bestScore, completed };
        });

      // Era tanpa bab dianggap tuntas agar tidak memblokir era berikutnya.
      const completed = unlocked && chs.every((c) => c.completed);
      const scored = chs.filter((c) => c.bestScore !== null);
      const averageScore = scored.length ? round1(scored.reduce((s, c) => s + c.bestScore, 0) / scored.length) : null;
      previousCompleted = completed;

      const badge = badges.get(era.id);
      return {
        era,
        status: !unlocked ? 'locked' : completed ? 'completed' : 'unlocked',
        unlocked,
        completed,
        chapters: chs,
        completedChapters: chs.filter((c) => c.completed).length,
        averageScore,
        badge: badge ? { eraId: era.id, averageScore: badge.average_score, awardedAt: badge.awarded_at } : null,
      };
    });
  }

  function eraState(userId, eraId) {
    return computeState(userId).find((s) => s.era.id === eraId);
  }

  function chapterState(userId, chapterId) {
    for (const s of computeState(userId)) {
      const c = s.chapters.find((x) => x.chapter.id === chapterId);
      if (c) return { era: s, chapter: c };
    }
    return null;
  }

  /** Aturan 6: akses bab/kuis di era terkunci ditolak dengan 403. */
  function assertChapterAccessible(userId, chapter) {
    const s = eraState(userId, chapter.eraId);
    if (!s.unlocked) throw errors.eraLocked(s.era.title);
    return s;
  }

  /**
   * Bandingkan state sebelum & sesudah sebuah aksi untuk mendeteksi era yang baru terbuka,
   * lalu berikan lencana (aturan 5) bila era tuntas dengan rata-rata >= 90.
   */
  function detectChanges(userId, before) {
    const after = computeState(userId);
    let eraUnlocked = null;
    let badgeEarned = null;
    after.forEach((s, i) => {
      if (s.unlocked && before[i] && !before[i].unlocked) eraUnlocked = { id: s.era.id, title: s.era.title };
      if (s.completed && s.chapters.length > 0 && !s.badge && s.averageScore >= config.rules.badgeAverage) {
        q.awardBadge.run(userId, s.era.id, s.averageScore);
        badgeEarned = {
          eraId: s.era.id,
          name: `Lencana ${s.era.title}`,
          averageScore: s.averageScore,
        };
      }
    });
    return { eraUnlocked, badgeEarned };
  }

  const markWatched = db.transaction((userId, chapterId) => {
    const before = computeState(userId);
    q.markWatched.run(userId, chapterId);
    const changes = detectChanges(userId, before);
    return { ...chapterState(userId, chapterId).chapter, ...changes };
  });

  /** Dipanggil di dalam transaksi submit kuis. */
  function recordQuizScore(userId, chapterId, { score, passed }) {
    const before = computeState(userId);
    q.recordScore.run({ userId, chapterId, score, passed: passed ? 1 : 0 });
    const changes = detectChanges(userId, before);
    return { ...chapterState(userId, chapterId).chapter, ...changes };
  }

  return { computeState, eraState, chapterState, assertChapterAccessible, markWatched, recordQuizScore };
}

module.exports = { createProgressService };
