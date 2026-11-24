'use strict';

/** Error domain yang diterjemahkan ke format { error: { code, message } }. */
class AppError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const errors = {
  validation: (message, details) => new AppError(400, 'VALIDATION_ERROR', message, details),
  badRequest: (message, code = 'BAD_REQUEST') => new AppError(400, code, message),
  unauthorized: (message, code = 'UNAUTHORIZED') => new AppError(401, code, message),
  forbidden: (message, code = 'FORBIDDEN') => new AppError(403, code, message),
  eraLocked: (eraTitle) =>
    new AppError(
      403,
      'ERA_LOCKED',
      `Era "${eraTitle}" masih terkunci. Selesaikan semua bab di era sebelumnya terlebih dahulu.`
    ),
  ai: (status, code, message) => new AppError(status, code, message),
  notFound: (message = 'Resource tidak ditemukan') => new AppError(404, 'NOT_FOUND', message),
  conflict: (message) => new AppError(409, 'CONFLICT', message),
};

module.exports = { AppError, errors };
