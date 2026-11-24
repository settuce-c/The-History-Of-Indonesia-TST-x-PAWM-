'use strict';
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const { errors } = require('../shared/errors');

// Hash palsu agar waktu respons login sama walau email tidak terdaftar (mencegah enumerasi akun).
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', 4);

const hashApiKey = (raw) => crypto.createHash('sha256').update(raw).digest('hex');

const toUser = (r) =>
  r && {
    id: r.id,
    email: r.email,
    name: r.name,
    avatarId: r.avatar_id,
    role: r.role,
    createdAt: r.created_at,
  };

const toApiKey = (r) =>
  r && {
    id: r.id,
    clientName: r.client_name,
    keyPrefix: r.key_prefix,
    active: !r.revoked_at,
    createdAt: r.created_at,
    lastUsedAt: r.last_used_at,
    revokedAt: r.revoked_at,
  };

function createIdentityService(db) {
  const q = {
    userByEmail: db.prepare('SELECT * FROM users WHERE email = ?'),
    userById: db.prepare('SELECT * FROM users WHERE id = ?'),
    insertUser: db.prepare('INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)'),
    keyByHash: db.prepare('SELECT * FROM api_keys WHERE key_hash = ?'),
    keyByClient: db.prepare('SELECT * FROM api_keys WHERE client_name = ?'),
    keyById: db.prepare('SELECT * FROM api_keys WHERE id = ?'),
    insertKey: db.prepare('INSERT INTO api_keys (client_name, key_hash, key_prefix) VALUES (?, ?, ?)'),
    rotateKey: db.prepare(
      'UPDATE api_keys SET key_hash = ?, key_prefix = ?, revoked_at = NULL, created_at = strftime(\'%Y-%m-%dT%H:%M:%SZ\', \'now\') WHERE id = ?'
    ),
    touchKey: db.prepare("UPDATE api_keys SET last_used_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now') WHERE id = ?"),
    revokeKey: db.prepare(
      "UPDATE api_keys SET revoked_at = COALESCE(revoked_at, strftime('%Y-%m-%dT%H:%M:%SZ', 'now')) WHERE id = ?"
    ),
    listKeys: db.prepare('SELECT * FROM api_keys ORDER BY client_name'),
  };

  function issueToken(user) {
    return jwt.sign({ role: user.role }, config.jwt.secret, {
      subject: String(user.id),
      expiresIn: config.jwt.expiresIn,
    });
  }

  function findUser(id) {
    return toUser(q.userById.get(id));
  }

  async function register({ email, password, name }) {
    if (q.userByEmail.get(email)) throw errors.conflict('Email sudah terdaftar');
    const hash = await bcrypt.hash(password, config.bcryptRounds);
    const info = q.insertUser.run(email, hash, name, 'student'); // registrasi publik selalu student
    const user = findUser(info.lastInsertRowid);
    return { user, token: issueToken(user) };
  }

  async function login({ email, password }) {
    const row = q.userByEmail.get(email);
    const ok = await bcrypt.compare(password, row ? row.password_hash : DUMMY_HASH);
    if (!row || !ok) throw errors.unauthorized('Email atau password salah', 'INVALID_CREDENTIALS');
    const user = toUser(row);
    return { user, token: issueToken(user) };
  }

  /** Mengembalikan user jika token valid, null jika tidak. */
  function verifyToken(token) {
    try {
      const payload = jwt.verify(token, config.jwt.secret, { algorithms: ['HS256'] });
      return findUser(Number(payload.sub)) || null;
    } catch {
      return null;
    }
  }

  function updateProfile(userId, { name, avatarId }) {
    const sets = [];
    const values = [];
    if (name !== undefined) {
      sets.push('name = ?');
      values.push(name);
    }
    if (avatarId !== undefined) {
      sets.push('avatar_id = ?');
      values.push(avatarId);
    }
    if (sets.length) db.prepare(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`).run(...values, userId);
    return findUser(userId);
  }

  /** Untuk seed: buat akun jika belum ada. */
  function ensureUser({ email, password, name, role }) {
    if (q.userByEmail.get(email)) return false;
    q.insertUser.run(email, bcrypt.hashSync(password, config.bcryptRounds), name, role);
    return true;
  }

  // ---------- API key kelompok lain ----------

  function verifyApiKey(raw) {
    return toApiKey(q.keyByHash.get(hashApiKey(raw))) || null;
  }

  function touchApiKey(id) {
    q.touchKey.run(id);
  }

  /** Untuk seed: daftarkan key dari .env jika client belum punya key. */
  function ensureApiKey(clientName, rawKey) {
    if (q.keyByClient.get(clientName)) return false;
    q.insertKey.run(clientName, hashApiKey(rawKey), rawKey.slice(0, 8));
    return true;
  }

  /** Admin: terbitkan key baru (atau rotasi key lama). Key mentah hanya ditampilkan sekali. */
  function issueApiKey(clientName) {
    const raw = `thid_${crypto.randomBytes(24).toString('hex')}`;
    const existing = q.keyByClient.get(clientName);
    if (existing) q.rotateKey.run(hashApiKey(raw), raw.slice(0, 8), existing.id);
    else q.insertKey.run(clientName, hashApiKey(raw), raw.slice(0, 8));
    return { apiKey: raw, client: toApiKey(q.keyByClient.get(clientName)) };
  }

  function revokeApiKey(id) {
    if (!q.keyById.get(id)) throw errors.notFound('API key tidak ditemukan');
    q.revokeKey.run(id);
    return toApiKey(q.keyById.get(id));
  }

  function listApiKeys() {
    return q.listKeys.all().map(toApiKey);
  }

  return {
    register,
    login,
    verifyToken,
    findUser,
    updateProfile,
    ensureUser,
    verifyApiKey,
    touchApiKey,
    ensureApiKey,
    issueApiKey,
    revokeApiKey,
    listApiKeys,
  };
}

module.exports = { createIdentityService };
