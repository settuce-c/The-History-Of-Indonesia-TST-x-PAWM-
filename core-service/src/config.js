'use strict';
const path = require('path');

// Saat dev lokal, baca .env di root repo. Di Docker, variabel datang dari docker compose
// (env_file), dan file ini tidak ada di image sehingga dotenv diam saja.
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const env = process.env.NODE_ENV || 'development';
const isProd = env === 'production';

function secret(name, devFallback) {
  const value = process.env[name];
  if (value) return value;
  if (isProd) throw new Error(`Environment variable ${name} wajib diisi di production`);
  return devFallback;
}

module.exports = {
  env,
  isProd,
  port: Number(process.env.PORT) || 3000,
  dbPath: process.env.DB_PATH || path.resolve(__dirname, '../data/app.db'),
  jwt: {
    secret: secret('JWT_SECRET', 'dev-only-secret-jangan-dipakai-di-production'),
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS) || 10,
  corsOrigin: process.env.CORS_ORIGIN || '*',
  seedOnStart: process.env.SEED_ON_START !== 'false',
  rules: {
    passingScore: 70, // aturan 2: lulus kuis jika skor >= 70
    badgeAverage: 90, // aturan 5: lencana era jika rata-rata >= 90
    skipScore: 80, // tes awal / tes lompat: skor era >= 80 berarti era dikuasai -> bab dilewati
    placementQuestionsPerEra: 2, // tes awal: jumlah soal acak per era
    testOutQuestionsPerChapter: 2, // tes lompat: jumlah soal acak per bab (digabung satu era)
  },
  // Kunci API AI hanya dibaca dari environment (.env), TIDAK pernah di-commit.
  // Model AI TIDAK berjalan di STB; backend hanya memanggil API Gemini lewat internet.
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    timeoutMs: Number(process.env.GEMINI_TIMEOUT_MS) || 25000,
  },
  wikipedia: {
    baseUrl: process.env.WIKI_API_URL || 'https://id.wikipedia.org/api/rest_v1/page/summary',
    // Kebijakan Wikimedia: User-Agent harus jelas mengidentifikasi aplikasi + cara menghubungi.
    userAgent:
      process.env.WIKI_USER_AGENT || 'TheHistoryOfIndonesia/1.0 (https://thehistoryofid.stei.site; aplikasi edukasi sejarah)',
    timeoutMs: Number(process.env.WIKI_TIMEOUT_MS) || 4000,
    cacheDays: Number(process.env.WIKI_CACHE_DAYS) || 7,
  },
  seed: {
    admin: {
      email: process.env.SEED_ADMIN_EMAIL || 'admin@thehistoryofid.test',
      password: process.env.SEED_ADMIN_PASSWORD,
      name: 'Admin Uji',
      role: 'admin',
    },
    student: {
      email: process.env.SEED_STUDENT_EMAIL || 'siswa@thehistoryofid.test',
      password: process.env.SEED_STUDENT_PASSWORD,
      name: 'Pengguna Uji',
      role: 'student',
    },
    apiKeys: [
      { client: 'classroom-service', key: process.env.API_KEY_CLASSROOM_SERVICE },
      { client: 'tourism-language', key: process.env.API_KEY_TOURISM_LANGUAGE },
    ],
  },
};
