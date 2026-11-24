'use strict';
const express = require('express');
const config = require('../config');
const { z, id, idParam, youtubeUrl, slug, wikiTitle, nonEmpty } = require('../shared/schemas');
const { validate } = require('../shared/middleware');
const { AppError, errors } = require('../shared/errors');
const { presentEraState, presentChapterState } = require('./presenters');

const year = z.number().int().min(-5000).max(2100);
const eraFields = {
  title: z.string().trim().min(3).max(120),
  slug: slug.optional(),
  description: z.string().trim().max(2000).optional(),
  startYear: year.optional(),
  endYear: year.optional(),
  order: z.number().int().min(1).max(1000).optional(),
};
const createEraSchema = z.object(eraFields).strict();
const updateEraSchema = nonEmpty(z.object(eraFields).partial().strict());

const chapterFields = {
  eraId: id,
  title: z.string().trim().min(3).max(120),
  slug: slug.optional(),
  order: z.number().int().min(1).max(1000).optional(),
  videoUrl: youtubeUrl,
  summary: z.string().trim().min(10).max(10000),
  topicTags: z.array(z.string().trim().min(1).max(40).regex(/^[^,]+$/, 'Tag tidak boleh mengandung koma')).max(20).optional(),
  wikiTitle: wikiTitle.nullable().optional(), // judul artikel id.wikipedia.org
};
const createChapterSchema = z.object(chapterFields).strict();
const updateChapterSchema = nonEmpty(z.object(chapterFields).partial().strict());

const wikiDraftSchema = z.object({ wikiTitle: wikiTitle.optional() }).strict();

function curriculumRoutes({ curriculum, progress, knowledge, assessment, wiki }, mw) {
  const r = express.Router();
  const admin = [mw.auth, mw.admin];

  // GET /api/eras -> semua era + status locked/unlocked/completed untuk user ini
  r.get('/eras', mw.auth, (req, res) => {
    res.json({ data: progress.computeState(req.user.id).map(presentEraState) });
  });

  // GET /api/eras/:id/chapters -> daftar bab + status. Era terkunci tetap bisa dilihat judulnya
  // (untuk ditampilkan dengan ikon gembok), tetapi isi bab ditolak di /api/chapters/:id.
  r.get('/eras/:id/chapters', mw.auth, validate(idParam, 'params'), (req, res) => {
    const era = curriculum.requireEra(req.valid.params.id);
    const s = progress.eraState(req.user.id, era.id);
    res.json({ era: presentEraState(s), data: s.chapters.map(presentChapterState) });
  });

  // GET /api/chapters/:id -> video, ringkasan, peristiwa & tokoh terkait
  r.get('/chapters/:id', mw.auth, validate(idParam, 'params'), async (req, res) => {
    const chapter = curriculum.requireChapter(req.valid.params.id);
    const eraState = progress.assertChapterAccessible(req.user.id, chapter);
    const state = eraState.chapters.find((c) => c.chapter.id === chapter.id);
    const [next] = curriculum.nextChapters(chapter.id, 1);
    // Materi tambahan dari Wikipedia. Jika Wikipedia gagal, hasilnya null dan materi tetap tampil.
    const wikiSummary = await wiki.getSummary(chapter.wikiTitle);
    res.json({
      ...chapter,
      era: { id: eraState.era.id, title: eraState.era.title },
      status: state.status,
      watched: state.watched,
      passed: state.passed,
      bestScore: state.bestScore,
      attempts: assessment.attemptCount(req.user.id, chapter.id),
      quiz: { questionCount: assessment.countQuestions(chapter.id), passingScore: config.rules.passingScore },
      ...knowledge.forChapter(chapter.id),
      wikiSummary,
      nextChapter: next ? { id: next.id, title: next.title, eraId: next.eraId } : null,
    });
  });

  // POST /api/admin/chapters/:id/wiki-draft -> DRAF ringkasan dari Wikipedia (tidak disimpan otomatis)
  r.post('/admin/chapters/:id/wiki-draft', admin, validate(idParam, 'params'), validate(wikiDraftSchema), async (req, res) => {
    const chapter = curriculum.requireChapter(req.valid.params.id);
    const title = req.valid.body.wikiTitle ?? chapter.wikiTitle;
    if (!title) {
      throw errors.badRequest('Isi wikiTitle di body atau set wikiTitle pada bab terlebih dahulu', 'WIKI_TITLE_REQUIRED');
    }
    const summary = await wiki.getSummary(title, { force: true });
    if (!summary) throw new AppError(502, 'WIKI_UNAVAILABLE', `Artikel Wikipedia "${title}" tidak ditemukan atau Wikipedia sedang tidak bisa diakses.`);
    res.json({
      chapterId: chapter.id,
      wikiTitle: title,
      draftSummary: summary.extract,
      sourceUrl: summary.url,
      source: summary.source,
      note: 'Ini hanya draf. Periksa dan sunting, lalu simpan lewat PUT /api/admin/chapters/{id}.',
    });
  });

  // ---- Admin CRUD era & bab ----
  r.get('/admin/eras', admin, (req, res) => {
    res.json({ data: curriculum.listEras().map((e) => ({ ...e, chapters: curriculum.listChapters(e.id) })) });
  });
  r.post('/admin/eras', admin, validate(createEraSchema), (req, res) => {
    res.status(201).json(curriculum.createEra(req.valid.body));
  });
  r.put('/admin/eras/:id', admin, validate(idParam, 'params'), validate(updateEraSchema), (req, res) => {
    res.json(curriculum.updateEra(req.valid.params.id, req.valid.body));
  });
  r.delete('/admin/eras/:id', admin, validate(idParam, 'params'), (req, res) => {
    curriculum.deleteEra(req.valid.params.id);
    res.status(204).end();
  });

  r.post('/admin/chapters', admin, validate(createChapterSchema), (req, res) => {
    res.status(201).json(curriculum.createChapter(req.valid.body));
  });
  r.put('/admin/chapters/:id', admin, validate(idParam, 'params'), validate(updateChapterSchema), (req, res) => {
    res.json(curriculum.updateChapter(req.valid.params.id, req.valid.body));
  });
  r.delete('/admin/chapters/:id', admin, validate(idParam, 'params'), (req, res) => {
    curriculum.deleteChapter(req.valid.params.id);
    res.status(204).end();
  });

  return r;
}

module.exports = { curriculumRoutes };
