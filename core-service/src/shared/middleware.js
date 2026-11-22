'use strict';
const { AppError, errors } = require('./errors');

/**
 * Validasi req.body / req.params / req.query dengan skema zod.
 * Hasil yang sudah bersih & ter-coerce disimpan di req.valid[source].
 */
function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source] ?? {});
    if (!result.success) {
      const details = result.error.issues.map((i) => ({
        field: i.path.join('.') || source,
        message: i.message,
      }));
      return next(errors.validation('Input tidak valid', details));
    }
    req.valid = req.valid || {};
    req.valid[source] = result.data;
    next();
  };
}

/** Identity & Access: verifikasi JWT di header Authorization: Bearer <token>. */
function authenticate(identity) {
  return (req, res, next) => {
    const match = /^Bearer\s+(.+)$/i.exec(req.get('authorization') || '');
    if (!match) {
      return next(errors.unauthorized('Header Authorization: Bearer <token> wajib disertakan'));
    }
    const user = identity.verifyToken(match[1].trim());
    if (!user) return next(errors.unauthorized('Token tidak valid atau sudah kedaluwarsa', 'INVALID_TOKEN'));
    req.user = user;
    next();
  };
}

function requireRole(role) {
  return (req, res, next) => {
    if (req.user?.role !== role) return next(errors.forbidden(`Endpoint ini hanya untuk role ${role}`));
    next();
  };
}

/** Identity & Access: verifikasi header X-API-Key untuk kelompok lain. */
function requireApiKey(identity) {
  return (req, res, next) => {
    const raw = req.get('x-api-key');
    if (!raw) return next(errors.unauthorized('Header X-API-Key wajib disertakan', 'API_KEY_REQUIRED'));
    const client = identity.verifyApiKey(raw);
    if (!client) return next(errors.unauthorized('API key tidak dikenal', 'INVALID_API_KEY'));
    if (client.revokedAt) return next(errors.forbidden('API key sudah dicabut', 'API_KEY_REVOKED'));
    identity.touchApiKey(client.id);
    req.client = client;
    next();
  };
}

function notFoundHandler(req, res) {
  res.status(404).json({
    error: { code: 'NOT_FOUND', message: `Endpoint ${req.method} ${req.originalUrl} tidak ditemukan` },
  });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    const body = { error: { code: err.code, message: err.message } };
    if (err.details) body.error.details = err.details;
    return res.status(err.status).json(body);
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { code: 'INVALID_JSON', message: 'Body bukan JSON yang valid' } });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'Body request terlalu besar' } });
  }
  console.error('[error]', err);
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Terjadi kesalahan pada server' } });
}

module.exports = { validate, authenticate, requireRole, requireApiKey, notFoundHandler, errorHandler };
