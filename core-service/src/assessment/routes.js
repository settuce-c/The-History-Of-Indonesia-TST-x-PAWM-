'use strict';
const express = require('express');
const config = require('../config');
const { z, id, idParam, nonEmpty } = require('../shared/schemas');
const { validate } = require('../shared/middleware');

const submitSchema = z
  .object({
    answers: z
      .array(z.object({ questionId: id, selectedIndex: z.number().int().min(0) }).strict())
      .min(1, 'Minimal satu jawaban')
      .max(100),
  })
  .strict();

const questionFields = {
  question: z.string().trim().min(5).max(1000),
  options: z.array(z.string().trim().min(1).max(300)).min(2).max(6),
  answerIndex: z.number().int().min(0),
  explanation: z.string().trim().max(2000).optional(),
  order: z.number().int().min(1).max(1000).optional(),
};
const createQuestionSchema = z
  .object(questionFields)
  .strict()
  .refine((d) => d.answerIndex < d.options.length, {
    message: 'answerIndex harus menunjuk salah satu options',
    path: ['answerIndex'],
  });
const updateQuestionSchema = nonEmpty(z.object(questionFields).partial().strict());

const generateSchema = z.object({ count: z.number().int().min(1).max(10).default(5) }).strict();

function assessmentRoutes({ curriculum, progress, assessment, aiQuiz }, mw, db) {
  const r = express.Router();
  const admin = [mw.auth, mw.admin];

  // GET /api/chapters/:id/quiz -> soal TANPA kunci jawaban (aturan 3)
  r.get('/chapters/:id/quiz', mw.auth, validate(idParam, 'params'), (req, res) => {
    const chapter = curriculum.requireChapter(req.valid.params.id);
    progress.assertChapterAccessible(req.user.id, chapter);
    const questions = assessment.studentQuiz(chapter.id);
    res.json({
      chapterId: chapter.id,
      chapterTitle: chapter.title,
      passingScore: config.rules.passingScore,
      totalQuestions: questions.length,
      questions,
    });
  });

  // POST /api/chapters/:id/quiz/submit -> nilai di server, simpan percobaan & nilai tertinggi
  const submit = db.transaction((userId, chapterId, answers) => {
    const result = assessment.grade(chapterId, answers);
    const attempt = assessment.recordAttempt(userId, chapterId, result, answers);
    const outcome = progress.recordQuizScore(userId, chapterId, result);
    return { result, attempt, outcome };
  });

  r.post('/chapters/:id/quiz/submit', mw.auth, validate(idParam, 'params'), validate(submitSchema), (req, res) => {
    const chapter = curriculum.requireChapter(req.valid.params.id);
    progress.assertChapterAccessible(req.user.id, chapter);
    const { result, attempt, outcome } = submit(req.user.id, chapter.id, req.valid.body.answers);
    res.json({
      chapterId: chapter.id,
      score: result.score,
      passed: result.passed,
      passingScore: result.passingScore,
      correctCount: result.correctCount,
      totalQuestions: result.totalQuestions,
      attempt,
      bestScore: outcome.bestScore,
      chapterCompleted: outcome.completed,
      eraUnlocked: outcome.eraUnlocked,
      badgeEarned: outcome.badgeEarned,
      results: result.results,
    });
  });

  // ---- Admin CRUD soal ----
  r.get('/admin/chapters/:id/questions', admin, validate(idParam, 'params'), (req, res) => {
    const chapter = curriculum.requireChapter(req.valid.params.id);
    res.json({ chapterId: chapter.id, data: assessment.listFull(chapter.id) });
  });
  r.post('/admin/chapters/:id/questions', admin, validate(idParam, 'params'), validate(createQuestionSchema), (req, res) => {
    const chapter = curriculum.requireChapter(req.valid.params.id);
    res.status(201).json(assessment.createQuestion(chapter.id, req.valid.body));
  });
  // POST /api/admin/chapters/:id/generate-quiz -> minta N soal ke Gemini, simpan sebagai DRAF (belum dipakai pengguna)
  r.post('/admin/chapters/:id/generate-quiz', admin, validate(idParam, 'params'), validate(generateSchema), async (req, res) => {
    const chapter = curriculum.requireChapter(req.valid.params.id);
    res.status(201).json(await aiQuiz.generate(chapter, req.valid.body.count));
  });
  // POST /api/admin/questions/:id/approve -> soal draf baru masuk ke kuis setelah disetujui admin
  r.post('/admin/questions/:id/approve', admin, validate(idParam, 'params'), (req, res) => {
    res.json(assessment.approveQuestion(req.valid.params.id));
  });
  r.put('/admin/questions/:id', admin, validate(idParam, 'params'), validate(updateQuestionSchema), (req, res) => {
    res.json(assessment.updateQuestion(req.valid.params.id, req.valid.body));
  });
  r.delete('/admin/questions/:id', admin, validate(idParam, 'params'), (req, res) => {
    assessment.deleteQuestion(req.valid.params.id);
    res.status(204).end();
  });

  return r;
}

module.exports = { assessmentRoutes };
