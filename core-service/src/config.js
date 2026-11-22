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
      name: 'Siswa Uji',
      role: 'student',
    },
    apiKeys: [
      { client: 'classroom-service', key: process.env.API_KEY_CLASSROOM_SERVICE },
      { client: 'tourism-language', key: process.env.API_KEY_TOURISM_LANGUAGE },
    ],
  },
};
