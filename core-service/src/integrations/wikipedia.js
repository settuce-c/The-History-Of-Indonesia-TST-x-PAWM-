'use strict';

const ATTRIBUTION = {
  name: 'Wikipedia (bahasa Indonesia)',
  license: 'CC BY-SA 4.0',
  licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
};

/** Judul artikel -> segmen URL: spasi jadi garis bawah, sisanya di-encode. */
const toPath = (title) => encodeURIComponent(title.trim().replace(/\s+/g, '_'));

/**
 * Klien REST Wikipedia (id.wikipedia.org). Mengembalikan:
 *   { found: true, ...ringkasan }  artikel ada
 *   { found: false }               404 / halaman disambiguasi
 * dan melempar Error biasa bila jaringan/server bermasalah (ditangani layanan cache).
 */
function createWikipediaClient({ baseUrl, userAgent, timeoutMs, fetch: fetchImpl = globalThis.fetch }) {
  async function fetchSummary(title) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetchImpl(`${baseUrl}/${toPath(title)}`, {
        headers: { 'User-Agent': userAgent, 'Api-User-Agent': userAgent, Accept: 'application/json' },
        redirect: 'follow',
        signal: controller.signal,
      });
      if (res.status === 404) return { found: false };
      if (!res.ok) throw new Error(`Wikipedia HTTP ${res.status}`);
      const j = await res.json();
      if (j.type === 'disambiguation' || !j.extract) return { found: false };
      return {
        found: true,
        displayTitle: j.title || title,
        extract: j.extract,
        description: j.description || null,
        pageUrl: j.content_urls?.desktop?.page || `https://id.wikipedia.org/wiki/${toPath(title)}`,
        thumbnail: j.thumbnail?.source || null,
      };
    } finally {
      clearTimeout(timer);
    }
  }
  return { fetchSummary };
}

/**
 * Layanan ringkasan Wikipedia + cache di database (tabel wiki_cache).
 * - Cache segar -> langsung dipakai, Wikipedia tidak dipanggil.
 * - Cache kedaluwarsa & Wikipedia gagal -> pakai cache lama (lebih baik data lama daripada kosong).
 * - Tidak ada cache & Wikipedia gagal -> null. Tidak pernah melempar error ke pemanggil.
 */
function createWikiService(db, client, { cacheDays = 7, now = () => Date.now() } = {}) {
  const q = {
    get: db.prepare('SELECT * FROM wiki_cache WHERE title = ?'),
    save: db.prepare(
      `INSERT INTO wiki_cache (title, found, display_title, extract, description, page_url, thumbnail, fetched_at)
       VALUES (@title, @found, @displayTitle, @extract, @description, @pageUrl, @thumbnail, @fetchedAt)
       ON CONFLICT (title) DO UPDATE SET found = excluded.found, display_title = excluded.display_title,
         extract = excluded.extract, description = excluded.description, page_url = excluded.page_url,
         thumbnail = excluded.thumbnail, fetched_at = excluded.fetched_at`
    ),
  };
  const DAY = 24 * 60 * 60 * 1000;

  const present = (row, cached) => ({
    title: row.display_title,
    description: row.description,
    extract: row.extract,
    url: row.page_url,
    thumbnail: row.thumbnail,
    source: ATTRIBUTION,
    fetchedAt: row.fetched_at,
    cached,
  });

  /** @returns {Promise<object|null>} ringkasan, atau null bila tidak tersedia */
  async function getSummary(title, { force = false } = {}) {
    if (!title) return null;
    const row = q.get.get(title);
    // Artikel yang ditemukan di-cache selama cacheDays; "tidak ditemukan" hanya 1 hari.
    const ttl = (row?.found ? cacheDays : 1) * DAY;
    if (row && !force && now() - Date.parse(row.fetched_at) < ttl) return row.found ? present(row, true) : null;

    try {
      const r = await client.fetchSummary(title);
      q.save.run({
        title,
        found: r.found ? 1 : 0,
        displayTitle: r.displayTitle ?? null,
        extract: r.extract ?? null,
        description: r.description ?? null,
        pageUrl: r.pageUrl ?? null,
        thumbnail: r.thumbnail ?? null,
        fetchedAt: new Date(now()).toISOString(),
      });
      return r.found ? present(q.get.get(title), false) : null;
    } catch (err) {
      console.warn(`[wikipedia] gagal mengambil "${title}": ${err.message}`);
      return row?.found ? present(row, true) : null;
    }
  }

  return { getSummary };
}

module.exports = { createWikipediaClient, createWikiService, ATTRIBUTION };
