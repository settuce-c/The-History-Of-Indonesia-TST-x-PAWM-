'use strict';
const express = require('express');
const { z, idParam, nonEmpty } = require('../shared/schemas');
const { validate } = require('../shared/middleware');

const email = z.string().trim().toLowerCase().email('Format email tidak valid').max(254);
const name = z.string().trim().min(2, 'Nama minimal 2 karakter').max(60, 'Nama maksimal 60 karakter');

const registerSchema = z.object({
  email,
  password: z.string().min(8, 'Password minimal 8 karakter').max(72, 'Password maksimal 72 karakter'),
  name,
});
const loginSchema = z.object({ email, password: z.string().min(1, 'Password wajib diisi').max(72) });
const updateMeSchema = nonEmpty(
  z
    .object({
      name: name.optional(),
      avatarUrl: z
        .string()
        .trim()
        .url('avatarUrl harus berupa URL')
        .max(500)
        .refine((u) => u.startsWith('https://'), 'avatarUrl harus memakai https')
        .nullable()
        .optional(),
    })
    .strict()
);
const apiKeySchema = z.object({
  clientName: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'clientName hanya huruf kecil, angka, dan tanda hubung')
    .max(60),
});

function identityRoutes({ identity }, mw) {
  const r = express.Router();
  const admin = [mw.auth, mw.admin];

  r.post('/auth/register', validate(registerSchema), async (req, res) => {
    res.status(201).json(await identity.register(req.valid.body));
  });

  r.post('/auth/login', validate(loginSchema), async (req, res) => {
    res.json(await identity.login(req.valid.body));
  });

  r.get('/me', mw.auth, (req, res) => res.json(req.user));

  r.put('/me', mw.auth, validate(updateMeSchema), (req, res) => {
    res.json(identity.updateProfile(req.user.id, req.valid.body));
  });

  // ---- Admin: kelola API key kelompok lain ----
  r.get('/admin/api-keys', admin, (req, res) => res.json({ data: identity.listApiKeys() }));

  r.post('/admin/api-keys', admin, validate(apiKeySchema), (req, res) => {
    res.status(201).json(identity.issueApiKey(req.valid.body.clientName));
  });

  r.delete('/admin/api-keys/:id', admin, validate(idParam, 'params'), (req, res) => {
    res.json(identity.revokeApiKey(req.valid.params.id));
  });

  return r;
}

module.exports = { identityRoutes };
