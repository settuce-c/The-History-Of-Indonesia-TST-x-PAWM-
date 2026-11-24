'use strict';
const { AppError } = require('../shared/errors');

const BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

/**
 * Klien tipis untuk Gemini API (REST). Model AI TIDAK berjalan di STB: backend hanya memanggil
 * API-nya lewat internet. Kunci dibaca dari .env (GEMINI_API_KEY) dan dikirim lewat header,
 * bukan URL, supaya tidak muncul di log.
 *
 * Semua kegagalan diubah menjadi AppError dengan kode yang jelas, sehingga endpoint admin
 * mengembalikan pesan yang bisa dipahami dan fitur lain (kuis biasa) tidak terpengaruh.
 */
function createGeminiClient({ apiKey, model, timeoutMs, fetch: fetchImpl = globalThis.fetch }) {
  const configured = Boolean(apiKey);

  async function generateJson({ prompt, schema }) {
    if (!configured) {
      throw new AppError(
        503,
        'AI_NOT_CONFIGURED',
        'GEMINI_API_KEY belum diisi di .env server, jadi generator soal AI belum aktif.'
      );
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let res;
    try {
      res = await fetchImpl(`${BASE}/${encodeURIComponent(model)}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json', responseSchema: schema, temperature: 0.4 },
        }),
        signal: controller.signal,
      });
    } catch (e) {
      if (e.name === 'AbortError') {
        throw new AppError(504, 'AI_TIMEOUT', `Gemini tidak merespons dalam ${Math.round(timeoutMs / 1000)} detik. Coba lagi.`);
      }
      throw new AppError(502, 'AI_UNREACHABLE', 'Server tidak bisa menghubungi Gemini API. Periksa koneksi internet STB.');
    } finally {
      clearTimeout(timer);
    }

    if (res.status === 429) {
      throw new AppError(429, 'AI_QUOTA_EXCEEDED', 'Kuota Gemini API habis atau terlalu sering dipanggil. Coba lagi nanti.');
    }
    if (res.status === 401 || res.status === 403) {
      throw new AppError(502, 'AI_AUTH_FAILED', 'API key Gemini ditolak. Periksa GEMINI_API_KEY di .env.');
    }
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      const msg = String(body?.error?.message || '');
      if (res.status === 400 && /api key/i.test(msg)) {
        throw new AppError(502, 'AI_AUTH_FAILED', 'API key Gemini ditolak. Periksa GEMINI_API_KEY di .env.');
      }
      throw new AppError(502, 'AI_UPSTREAM_ERROR', `Gemini mengembalikan error HTTP ${res.status}.`);
    }

    const data = await res.json().catch(() => null);
    const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';
    if (!text.trim()) {
      const why = data?.promptFeedback?.blockReason || data?.candidates?.[0]?.finishReason || 'kosong';
      throw new AppError(502, 'AI_EMPTY_RESPONSE', `Gemini tidak mengembalikan isi (alasan: ${why}).`);
    }
    try {
      // Jaga-jaga bila model membungkus JSON dengan pagar kode ```json
      return JSON.parse(text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, ''));
    } catch {
      throw new AppError(502, 'AI_INVALID_RESPONSE', 'Gemini mengembalikan JSON yang tidak valid. Coba lagi.');
    }
  }

  return { configured, model, generateJson };
}

module.exports = { createGeminiClient };
