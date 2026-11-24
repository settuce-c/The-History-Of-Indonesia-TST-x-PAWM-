'use strict';

/** Era + status untuk user (dipakai /api/eras dan /api/me/progress). */
function presentEraState(s) {
  return {
    ...s.era,
    status: s.status,
    chapterCount: s.chapters.length,
    completedChapters: s.completedChapters, // termasuk bab yang dilewati
    skippedChapters: s.skippedChapters,
    averageScore: s.averageScore,
    badgeEarned: Boolean(s.badge),
    // Hanya ada pada era terkunci: alasan + apakah tombol "Tes lompat" bisa dipakai.
    lock: s.lock,
  };
}

/** Ringkasan bab + status (tanpa video/ringkasan; isi lengkap ada di GET /api/chapters/:id). */
function presentChapterState(c) {
  const { chapter } = c;
  return {
    id: chapter.id,
    eraId: chapter.eraId,
    slug: chapter.slug,
    title: chapter.title,
    order: chapter.order,
    status: c.status, // locked | available | in_progress | completed | skipped
    watched: c.watched,
    passed: c.passed,
    bestScore: c.bestScore,
  };
}

module.exports = { presentEraState, presentChapterState };
