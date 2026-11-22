'use strict';
const express = require('express');
const { idParam } = require('../shared/schemas');
const { validate } = require('../shared/middleware');
const { presentEraState, presentChapterState } = require('../curriculum/presenters');

function progressRoutes({ curriculum, progress }, mw) {
  const r = express.Router();

  // POST /api/chapters/:id/watched -> tandai video sudah ditonton
  r.post('/chapters/:id/watched', mw.auth, validate(idParam, 'params'), (req, res) => {
    const chapter = curriculum.requireChapter(req.valid.params.id);
    progress.assertChapterAccessible(req.user.id, chapter);
    const outcome = progress.markWatched(req.user.id, chapter.id);
    res.json({
      ...presentChapterState(outcome),
      chapterCompleted: outcome.completed,
      eraUnlocked: outcome.eraUnlocked,
      badgeEarned: outcome.badgeEarned,
    });
  });

  // GET /api/me/progress -> ringkasan progres belajar
  r.get('/me/progress', mw.auth, (req, res) => {
    const state = progress.computeState(req.user.id);
    const allChapters = state.flatMap((s) => s.chapters);
    const scored = allChapters.filter((c) => c.bestScore !== null);
    res.json({
      summary: {
        totalEras: state.length,
        completedEras: state.filter((s) => s.completed).length,
        totalChapters: allChapters.length,
        completedChapters: allChapters.filter((c) => c.completed).length,
        averageScore: scored.length
          ? Math.round((scored.reduce((sum, c) => sum + c.bestScore, 0) / scored.length) * 10) / 10
          : null,
        badgeCount: state.filter((s) => s.badge).length,
      },
      badges: state
        .filter((s) => s.badge)
        .map((s) => ({ ...s.badge, name: `Lencana ${s.era.title}` })),
      eras: state.map((s) => ({ ...presentEraState(s), chapters: s.chapters.map(presentChapterState) })),
    });
  });

  return r;
}

module.exports = { progressRoutes };
