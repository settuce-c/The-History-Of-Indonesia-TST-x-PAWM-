'use strict';
const { errors } = require('../shared/errors');
const { slugify } = require('../shared/schemas');

const toEra = (r) =>
  r && {
    id: r.id,
    slug: r.slug,
    title: r.title,
    description: r.description,
    startYear: r.start_year,
    endYear: r.end_year,
    order: r.order_index,
  };

const toChapter = (r) =>
  r && {
    id: r.id,
    eraId: r.era_id,
    slug: r.slug,
    title: r.title,
    order: r.order_index,
    videoUrl: r.video_url,
    summary: r.summary,
    topicTags: r.topic_tags ? r.topic_tags.split(',').filter(Boolean) : [],
    wikiTitle: r.wiki_title ?? null,
  };

const ERA_COLUMNS = { slug: 'slug', title: 'title', description: 'description', startYear: 'start_year', endYear: 'end_year', order: 'order_index' };
const CHAPTER_COLUMNS = { eraId: 'era_id', slug: 'slug', title: 'title', order: 'order_index', videoUrl: 'video_url', summary: 'summary', topicTags: 'topic_tags', wikiTitle: 'wiki_title' };

function toColumns(data, mapping) {
  const cols = [];
  const vals = [];
  for (const [key, col] of Object.entries(mapping)) {
    if (data[key] === undefined) continue;
    cols.push(col);
    vals.push(key === 'topicTags' ? data[key].map((t) => t.toLowerCase()).join(',') : data[key]);
  }
  return { cols, vals };
}

function wrapUnique(fn) {
  try {
    return fn();
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') throw errors.conflict('Slug sudah dipakai');
    throw err;
  }
}

/** Bounded context Curriculum: era -> bab (video + ringkasan + urutan). */
function createCurriculumService(db) {
  const q = {
    eras: db.prepare('SELECT * FROM eras ORDER BY order_index, id'),
    era: db.prepare('SELECT * FROM eras WHERE id = ?'),
    chaptersOfEra: db.prepare('SELECT * FROM chapters WHERE era_id = ? ORDER BY order_index, id'),
    chapter: db.prepare('SELECT * FROM chapters WHERE id = ?'),
    // Urutan learning path global: urut era lalu urut bab.
    learningPath: db.prepare(
      'SELECT c.* FROM chapters c JOIN eras e ON e.id = c.era_id ORDER BY e.order_index, e.id, c.order_index, c.id'
    ),
    maxEraOrder: db.prepare('SELECT COALESCE(MAX(order_index), 0) AS m FROM eras'),
    maxChapterOrder: db.prepare('SELECT COALESCE(MAX(order_index), 0) AS m FROM chapters WHERE era_id = ?'),
  };

  const listEras = () => q.eras.all().map(toEra);
  const listChapters = (eraId) => q.chaptersOfEra.all(eraId).map(toChapter);
  const learningPath = () => q.learningPath.all().map(toChapter);

  function requireEra(id) {
    const era = toEra(q.era.get(id));
    if (!era) throw errors.notFound(`Era dengan id ${id} tidak ditemukan`);
    return era;
  }

  function requireChapter(id) {
    const chapter = toChapter(q.chapter.get(id));
    if (!chapter) throw errors.notFound(`Bab dengan id ${id} tidak ditemukan`);
    return chapter;
  }

  /** Bab-bab sesudah chapterId dalam urutan learning path. */
  function nextChapters(chapterId, limit = 3) {
    const path = learningPath();
    const idx = path.findIndex((c) => c.id === chapterId);
    if (idx === -1) throw errors.notFound(`Bab dengan id ${chapterId} tidak ditemukan`);
    return path.slice(idx + 1, idx + 1 + limit);
  }

  // ---------- Admin CRUD ----------

  function createEra(data) {
    const row = { ...data, slug: data.slug || slugify(data.title), order: data.order ?? q.maxEraOrder.get().m + 1 };
    const { cols, vals } = toColumns(row, ERA_COLUMNS);
    const info = wrapUnique(() =>
      db.prepare(`INSERT INTO eras (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`).run(...vals)
    );
    return requireEra(info.lastInsertRowid);
  }

  function updateEra(id, data) {
    requireEra(id);
    const { cols, vals } = toColumns(data, ERA_COLUMNS);
    wrapUnique(() => db.prepare(`UPDATE eras SET ${cols.map((c) => `${c} = ?`).join(', ')} WHERE id = ?`).run(...vals, id));
    return requireEra(id);
  }

  function deleteEra(id) {
    requireEra(id);
    db.prepare('DELETE FROM eras WHERE id = ?').run(id);
  }

  function createChapter(data) {
    requireEra(data.eraId);
    const row = {
      ...data,
      slug: data.slug || slugify(data.title),
      order: data.order ?? q.maxChapterOrder.get(data.eraId).m + 1,
      topicTags: data.topicTags || [],
    };
    const { cols, vals } = toColumns(row, CHAPTER_COLUMNS);
    const info = wrapUnique(() =>
      db.prepare(`INSERT INTO chapters (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`).run(...vals)
    );
    return requireChapter(info.lastInsertRowid);
  }

  function updateChapter(id, data) {
    requireChapter(id);
    if (data.eraId !== undefined) requireEra(data.eraId);
    const { cols, vals } = toColumns(data, CHAPTER_COLUMNS);
    wrapUnique(() =>
      db.prepare(`UPDATE chapters SET ${cols.map((c) => `${c} = ?`).join(', ')} WHERE id = ?`).run(...vals, id)
    );
    return requireChapter(id);
  }

  function deleteChapter(id) {
    requireChapter(id);
    db.prepare('DELETE FROM chapters WHERE id = ?').run(id);
  }

  return {
    listEras,
    listChapters,
    learningPath,
    requireEra,
    requireChapter,
    nextChapters,
    createEra,
    updateEra,
    deleteEra,
    createChapter,
    updateChapter,
    deleteChapter,
  };
}

module.exports = { createCurriculumService };
