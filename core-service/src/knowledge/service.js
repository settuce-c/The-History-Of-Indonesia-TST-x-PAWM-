'use strict';

const toItem = (r) => ({
  id: r.id,
  kind: r.kind,
  name: r.name,
  year: r.year,
  yearEnd: r.year_end,
  location: r.location,
  region: r.region,
  coordinates: r.latitude != null && r.longitude != null ? { lat: r.latitude, lng: r.longitude } : null,
  description: r.description,
});

/** Bounded context Historical Knowledge: peristiwa & tokoh yang dirujuk oleh bab. */
function createKnowledgeService(db) {
  const q = {
    byChapter: db.prepare(
      `SELECT h.* FROM historical_items h
       JOIN chapter_items ci ON ci.item_id = h.id
       WHERE ci.chapter_id = ? ORDER BY h.year, h.id`
    ),
    chaptersOfItem: db.prepare(
      `SELECT c.id, c.title FROM chapters c JOIN chapter_items ci ON ci.chapter_id = c.id
       WHERE ci.item_id = ? ORDER BY c.id`
    ),
  };

  function forChapter(chapterId) {
    const items = q.byChapter.all(chapterId).map(toItem);
    return {
      events: items.filter((i) => i.kind === 'event'),
      figures: items.filter((i) => i.kind === 'figure'),
    };
  }

  function search({ keyword, kind, limit = 20 }) {
    const where = [];
    const params = [];
    if (keyword) {
      where.push('(h.name LIKE ? OR h.description LIKE ? OR h.location LIKE ? OR h.region LIKE ?)');
      const like = `%${keyword}%`;
      params.push(like, like, like, like);
    }
    if (kind) {
      where.push('h.kind = ?');
      params.push(kind);
    }
    const sql = `SELECT h.* FROM historical_items h ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
                 ORDER BY h.year, h.id LIMIT ?`;
    return db
      .prepare(sql)
      .all(...params, limit)
      .map((r) => ({ ...toItem(r), chapters: q.chaptersOfItem.all(r.id) }));
  }

  return { forChapter, search };
}

module.exports = { createKnowledgeService };
