'use strict';
const express = require('express');
const { z, id, idParam } = require('../shared/schemas');
const { validate } = require('../shared/middleware');
const { presentEraState, presentChapterState } = require('../curriculum/presenters');

const answersSchema = z
  .object({
    answers: z
      .array(z.object({ questionId: id, selectedIndex: z.number().int().min(0) }).strict())
      .max(100),
  })
  .strict();
const retakeQuery = z.object({ retake: z.enum(['true', 'false']).optional() });
const placementSubmitSchema = answersSchema.extend({ retake: z.boolean().optional() }).strict();

function progressRoutes({ curriculum, progress, placement }, mw) {
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
        completedChapters: allChapters.filter((c) => c.done).length, // termasuk bab yang dilewati
        skippedChapters: allChapters.filter((c) => c.skipped).length,
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

  // ---- Tes awal (placement test) ----

  // GET /api/me/placement -> sudah pernah tes awal? + hasil terakhir
  r.get('/me/placement', mw.auth, (req, res) => {
    res.json(placement.status(req.user.id));
  });

  // GET /api/placement -> soal tes awal (±2 per era, tanpa kunci). 409 bila sudah pernah, kecuali ?retake=true
  r.get('/placement', mw.auth, validate(retakeQuery, 'query'), (req, res) => {
    res.json(placement.startPlacement(req.user.id, { retake: req.valid.query.retake === 'true' }));
  });

  // POST /api/placement/submit -> nilai per era; era dengan skor >= 80 dikuasai, babnya dilewati
  r.post('/placement/submit', mw.auth, validate(placementSubmitSchema), (req, res) => {
    const { answers, retake } = req.valid.body;
    res.json(placement.submitPlacement(req.user.id, answers, { retake: retake === true }));
  });

  // ---- Tes lompat (test-out) per era ----

  // GET /api/eras/:id/test-out -> kuis gabungan satu era (boleh kapan saja)
  r.get('/eras/:id/test-out', mw.auth, validate(idParam, 'params'), (req, res) => {
    res.json(placement.startTestOut(req.user.id, req.valid.params.id));
  });

  // POST /api/eras/:id/test-out -> skor >= 80: era terbuka & semua babnya dilewati
  r.post('/eras/:id/test-out', mw.auth, validate(idParam, 'params'), validate(answersSchema), (req, res) => {
    res.json(placement.submitTestOut(req.user.id, req.valid.params.id, req.valid.body.answers));
  });

  return r;
}

module.exports = { progressRoutes };
