'use strict';
const { createTestContext } = require('./helpers');

describe('Identity & Access', () => {
  const ctx = createTestContext();

  test('GET /api/health publik tanpa auth', async () => {
    const res = await ctx.api().get('/api/health').expect(200);
    expect(res.body).toMatchObject({ status: 'ok', database: 'ok' });
  });

  test('register membuat akun student dan mengembalikan JWT', async () => {
    const res = await ctx
      .api()
      .post('/api/auth/register')
      .send({ email: 'Baru@Test.id', password: 'password-123', name: 'Akun Baru', role: 'admin' })
      .expect(201);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).toMatchObject({ email: 'baru@test.id', role: 'student' }); // role dari body diabaikan
    expect(res.body.user).not.toHaveProperty('password_hash');
  });

  test('register dengan email yang sama ditolak 409', async () => {
    const res = await ctx
      .api()
      .post('/api/auth/register')
      .send({ email: 'baru@test.id', password: 'password-123', name: 'Duplikat' })
      .expect(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  test('register dengan input tidak valid -> 400 dengan detail per field', async () => {
    const res = await ctx.api().post('/api/auth/register').send({ email: 'salah', password: '123' }).expect(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.map((d) => d.field)).toEqual(expect.arrayContaining(['email', 'password', 'name']));
  });

  test('body JSON rusak -> 400 INVALID_JSON', async () => {
    const res = await ctx
      .api()
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email":')
      .expect(400);
    expect(res.body.error.code).toBe('INVALID_JSON');
  });

  test('login dengan password salah -> 401', async () => {
    const res = await ctx
      .api()
      .post('/api/auth/login')
      .send({ email: ctx.ACCOUNTS.student.email, password: 'salah-sekali' })
      .expect(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  test('GET /api/me butuh token valid', async () => {
    await ctx.api().get('/api/me').expect(401);
    const bad = await ctx.api().get('/api/me').set('Authorization', 'Bearer token.palsu.sekali').expect(401);
    expect(bad.body.error.code).toBe('INVALID_TOKEN');

    const token = await ctx.login(ctx.ACCOUNTS.student);
    const res = await ctx.api().get('/api/me').set('Authorization', `Bearer ${token}`).expect(200);
    expect(res.body).toMatchObject({ email: ctx.ACCOUNTS.student.email, role: 'student' });
  });

  test('PUT /api/me mengubah nama & avatar dengan validasi', async () => {
    const token = await ctx.login(ctx.ACCOUNTS.student);
    const auth = { Authorization: `Bearer ${token}` };
    const ok = await ctx
      .api()
      .put('/api/me')
      .set(auth)
      .send({ name: 'Siswa Berganti', avatarUrl: 'https://example.com/avatar.png' })
      .expect(200);
    expect(ok.body).toMatchObject({ name: 'Siswa Berganti', avatarUrl: 'https://example.com/avatar.png' });

    await ctx.api().put('/api/me').set(auth).send({}).expect(400);
    await ctx.api().put('/api/me').set(auth).send({ avatarUrl: 'http://tidak-aman.com/a.png' }).expect(400);
    await ctx.api().put('/api/me').set(auth).send({ role: 'admin' }).expect(400); // field asing ditolak
  });

  test('endpoint admin ditolak untuk student (403) dan diterima untuk admin', async () => {
    const student = await ctx.login(ctx.ACCOUNTS.student);
    const admin = await ctx.login(ctx.ACCOUNTS.admin);
    const res = await ctx.api().get('/api/admin/eras').set('Authorization', `Bearer ${student}`).expect(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
    await ctx.api().get('/api/admin/eras').set('Authorization', `Bearer ${admin}`).expect(200);
  });

  test('X-API-Key: tanpa key 401, key salah 401, key valid 200, key dicabut 403', async () => {
    expect((await ctx.api().get('/api/public/eras').expect(401)).body.error.code).toBe('API_KEY_REQUIRED');
    expect((await ctx.api().get('/api/public/eras').set('X-API-Key', 'ngawur').expect(401)).body.error.code).toBe(
      'INVALID_API_KEY'
    );
    await ctx.api().get('/api/public/eras').set('X-API-Key', ctx.API_KEYS.classroom).expect(200);

    const admin = await ctx.login(ctx.ACCOUNTS.admin);
    const issued = await ctx
      .api()
      .post('/api/admin/api-keys')
      .set('Authorization', `Bearer ${admin}`)
      .send({ clientName: 'kelompok-baru' })
      .expect(201);
    await ctx.api().get('/api/public/eras').set('X-API-Key', issued.body.apiKey).expect(200);

    await ctx
      .api()
      .delete(`/api/admin/api-keys/${issued.body.client.id}`)
      .set('Authorization', `Bearer ${admin}`)
      .expect(200);
    const revoked = await ctx.api().get('/api/public/eras').set('X-API-Key', issued.body.apiKey).expect(403);
    expect(revoked.body.error.code).toBe('API_KEY_REVOKED');

    // key mentah tidak pernah muncul di daftar key
    const list = await ctx.api().get('/api/admin/api-keys').set('Authorization', `Bearer ${admin}`).expect(200);
    expect(JSON.stringify(list.body)).not.toContain(issued.body.apiKey);
  });

  test('endpoint tidak dikenal -> 404 format seragam', async () => {
    const res = await ctx.api().get('/api/tidak-ada').expect(404);
    expect(res.body).toEqual({ error: { code: 'NOT_FOUND', message: expect.any(String) } });
  });
});
