'use strict';
const express = require('express');
const { idParam } = require('../shared/schemas');
const { validate } = require('../shared/middleware');
const { errors } = require('../shared/errors');

function knowledgeRoutes({ knowledge, wiki }, mw) {
  const r = express.Router();

  // GET /api/items/:id -> detail peristiwa/tokoh + ringkasan Wikipedia (null bila tidak tersedia)
  r.get('/items/:id', mw.auth, validate(idParam, 'params'), async (req, res) => {
    const item = knowledge.find(req.valid.params.id);
    if (!item) throw errors.notFound(`Peristiwa/tokoh dengan id ${req.valid.params.id} tidak ditemukan`);
    res.json({ ...item, wikiSummary: await wiki.getSummary(item.wikiTitle) });
  });

  return r;
}

module.exports = { knowledgeRoutes };
