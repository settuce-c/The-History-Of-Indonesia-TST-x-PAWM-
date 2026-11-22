'use strict';
const express = require('express');
const { z, id } = require('../shared/schemas');
const { validate } = require('../shared/middleware');

/**
 * Open Host Service untuk kelompok lain (header X-API-Key).
 * Bentuk respons di sini adalah "published language" yang stabil: jangan diubah sembarangan
 * karena dipakai oleh layanan kelompok mitra.
 */
const quizQuery = z.object({
  topic: z.string().trim().min(2).max(50).optional(),
  limit: z.coerce.number().int().min(1).max(20).default(5),
});
const eventsQuery = z.object({
  keyword: z.string().trim().min(2).max(50).optional(),
  kind: z.enum(['event', 'figure']).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
const recommendationQuery = z.object({
  chapterId: id,
  limit: z.coerce.number().int().min(1).max(10).default(3),
});

function publicRoutes({ curriculum, knowledge, assessment }, mw) {
  const r = express.Router();
  r.use('/public', mw.apiKey);

  r.get('/public/eras', (req, res) => {
    res.json({
      data: curriculum.listEras().map((e) => ({ ...e, chapterCount: curriculum.listChapters(e.id).length })),
    });
  });

  r.get('/public/learning-path', (req, res) => {
    let step = 0;
    const eras = curriculum.listEras().map((era) => ({
      ...era,
      chapters: curriculum.listChapters(era.id).map((c) => ({
        id: c.id,
        step: ++step,
        title: c.title,
        order: c.order,
        videoUrl: c.videoUrl,
        summary: c.summary,
        topicTags: c.topicTags,
        questionCount: assessment.countQuestions(c.id),
      })),
    }));
    res.json({ totalEras: eras.length, totalChapters: step, data: eras });
  });

  r.get('/public/quiz', validate(quizQuery, 'query'), (req, res) => {
    const { topic, limit } = req.valid.query;
    const data = assessment.publicQuiz({ topic, limit });
    res.json({ topic: topic ?? null, count: data.length, data });
  });

  r.get('/public/events', validate(eventsQuery, 'query'), (req, res) => {
    const data = knowledge.search(req.valid.query);
    res.json({ keyword: req.valid.query.keyword ?? null, count: data.length, data });
  });

  r.get('/public/recommendations', validate(recommendationQuery, 'query'), (req, res) => {
    const { chapterId, limit } = req.valid.query;
    const source = curriculum.requireChapter(chapterId);
    const eras = new Map(curriculum.listEras().map((e) => [e.id, e]));
    const data = curriculum.nextChapters(chapterId, limit).map((c) => ({
      id: c.id,
      title: c.title,
      era: { id: c.eraId, title: eras.get(c.eraId).title },
      videoUrl: c.videoUrl,
      reason:
        c.eraId === source.eraId
          ? 'Bab berikutnya di era yang sama'
          : `Lanjutan ke era berikutnya: ${eras.get(c.eraId).title}`,
    }));
    res.json({ chapter: { id: source.id, title: source.title }, count: data.length, data });
  });

  return r;
}

module.exports = { publicRoutes };
