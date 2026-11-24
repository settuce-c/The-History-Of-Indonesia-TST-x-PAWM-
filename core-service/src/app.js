'use strict';
const express = require('express');
const cors = require('cors');
const config = require('./config');
const { version } = require('../package.json');
const { createIdentityService } = require('./identity/service');
const { createCurriculumService } = require('./curriculum/service');
const { createKnowledgeService } = require('./knowledge/service');
const { createAssessmentService } = require('./assessment/service');
const { createProgressService } = require('./progress/service');
const { identityRoutes } = require('./identity/routes');
const { curriculumRoutes } = require('./curriculum/routes');
const { assessmentRoutes } = require('./assessment/routes');
const { progressRoutes } = require('./progress/routes');
const { knowledgeRoutes } = require('./knowledge/routes');
const { publicRoutes } = require('./public/routes');
const { createGeminiClient } = require('./integrations/gemini');
const { createWikipediaClient, createWikiService } = require('./integrations/wikipedia');
const { createAiQuizService } = require('./assessment/aiQuiz');
const { createPlacementService } = require('./progress/placement');
const { mountDocs } = require('./docs');
const mwLib = require('./shared/middleware');

/** Rakit service per bounded context. Dipisah dari server.js agar mudah dites. */
function createServices(db, deps = {}) {
  // deps.fetch / deps.gemini / deps.wikipedia bisa diganti saat test agar tidak memanggil internet.
  const fetchImpl = deps.fetch || globalThis.fetch;
  const identity = createIdentityService(db);
  const curriculum = createCurriculumService(db);
  const knowledge = createKnowledgeService(db);
  const assessment = createAssessmentService(db);
  const progress = createProgressService(db, { curriculum, assessment });
  const placement = createPlacementService(db, { curriculum, assessment, progress });
  const gemini = createGeminiClient({ ...config.gemini, ...deps.gemini, fetch: fetchImpl });
  const aiQuiz = createAiQuizService({ gemini, assessment });
  const wikiConfig = { ...config.wikipedia, ...deps.wikipedia };
  const wiki = createWikiService(db, createWikipediaClient({ ...wikiConfig, fetch: fetchImpl }), {
    cacheDays: wikiConfig.cacheDays,
    now: deps.now,
  });
  return { identity, curriculum, knowledge, assessment, progress, placement, aiQuiz, wiki };
}

function createApp(db, deps = {}) {
  const services = createServices(db, deps);
  const mw = {
    auth: mwLib.authenticate(services.identity),
    admin: mwLib.requireRole('admin'),
    apiKey: mwLib.requireApiKey(services.identity),
  };

  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1); // di belakang Nginx: pakai X-Forwarded-For untuk IP klien
  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json({ limit: '100kb' }));

  app.get('/api/health', (req, res) => {
    db.prepare('SELECT 1').get();
    res.json({
      status: 'ok',
      service: 'core-service',
      version,
      database: 'ok',
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  });

  mountDocs(app);

  app.use('/api', identityRoutes(services, mw));
  app.use('/api', curriculumRoutes(services, mw));
  app.use('/api', assessmentRoutes(services, mw, db));
  app.use('/api', progressRoutes(services, mw));
  app.use('/api', knowledgeRoutes(services, mw));
  app.use('/api', publicRoutes(services, mw));

  app.use(mwLib.notFoundHandler);
  app.use(mwLib.errorHandler);

  app.locals.services = services;
  return app;
}

module.exports = { createApp, createServices };
