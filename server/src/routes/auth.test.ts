import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../app';
import { openDatabase, setDb } from '../db';
import { seedDatabase } from '../seed';
import { signToken, verifyToken } from '../middleware/auth';

const app = createApp('/nonexistent-client-dist');

async function login(userName = 'Deepak', password = 'Deepak'): Promise<string> {
  const res = await request(app).post('/api/auth/login').send({ userName, password });
  expect(res.status).toBe(200);
  return res.body.token as string;
}

describe('auth API', () => {
  beforeEach(() => {
    const db = openDatabase(':memory:');
    seedDatabase(db);
    setDb(db);
  });

  afterAll(() => {
    setDb(null);
  });

  it('login succeeds for the seeded users and returns a token', async () => {
    for (const name of ['Deepak', 'Rohit']) {
      const res = await request(app).post('/api/auth/login').send({ userName: name, password: name });
      expect(res.status).toBe(200);
      expect(typeof res.body.token).toBe('string');
      expect(res.body.user).toEqual({ id: expect.any(Number), userName: name });
      expect(res.body.user.password).toBeUndefined();
      expect(verifyToken(res.body.token)?.userName).toBe(name);
    }
  });

  it('login returns 401 for wrong credentials', async () => {
    const wrongPassword = await request(app)
      .post('/api/auth/login')
      .send({ userName: 'Deepak', password: 'nope' });
    expect(wrongPassword.status).toBe(401);
    const unknownUser = await request(app)
      .post('/api/auth/login')
      .send({ userName: 'Nobody', password: 'Deepak' });
    expect(unknownUser.status).toBe(401);
    const empty = await request(app).post('/api/auth/login').send({ userName: '', password: '' });
    expect(empty.status).toBe(401);
  });

  it('login returns 400 for malformed bodies', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
  });

  it('stores passwords hashed, never in clear text', async () => {
    const token = await login();
    const list = await request(app).get('/api/admin/users').set('Authorization', `Bearer ${token}`);
    expect(JSON.stringify(list.body)).not.toContain('scrypt');
    expect(JSON.stringify(list.body)).not.toContain('password');
  });

  it('protected /api routes return 401 without a valid token', async () => {
    for (const url of ['/api/books', '/api/customers', '/api/orders', '/api/sales', '/api/admin/users']) {
      const res = await request(app).get(url);
      expect(res.status).toBe(401);
      const bad = await request(app).get(url).set('Authorization', 'Bearer not.a.token');
      expect(bad.status).toBe(401);
    }
    expect((await request(app).post('/api/auth/logout')).status).toBe(401);
  });

  it('rejects tampered and expired tokens', async () => {
    const token = await login();
    const [h, p, s] = token.split('.');
    const forgedPayload = Buffer.from(
      JSON.stringify({ ...JSON.parse(Buffer.from(p, 'base64url').toString()), userName: 'Mallory' }),
    ).toString('base64url');
    const forged = await request(app)
      .get('/api/books')
      .set('Authorization', `Bearer ${h}.${forgedPayload}.${s}`);
    expect(forged.status).toBe(401);
    const expired = signToken({ id: 1, userName: 'Deepak' }, Date.now() - 24 * 60 * 60 * 1000);
    const res = await request(app).get('/api/books').set('Authorization', `Bearer ${expired}`);
    expect(res.status).toBe(401);
  });

  it('a valid token grants access to the other routers', async () => {
    const token = await login();
    for (const url of ['/api/books', '/api/customers', '/api/orders', '/api/sales']) {
      const res = await request(app).get(url).set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
    }
  });

  it('logout invalidates the token', async () => {
    const token = await login();
    const out = await request(app).post('/api/auth/logout').set('Authorization', `Bearer ${token}`);
    expect(out.status).toBe(200);
    const after = await request(app).get('/api/books').set('Authorization', `Bearer ${token}`);
    expect(after.status).toBe(401);
    // logging in again works (Logout -> Login)
    expect(await login()).not.toBe(token);
  });

  describe('admin users', () => {
    it('lists the seeded users', async () => {
      const token = await login();
      const res = await request(app).get('/api/admin/users').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.map((u: { userName: string }) => u.userName)).toEqual(['Deepak', 'Rohit']);
    });

    it('adds, updates and deletes a user', async () => {
      const token = await login();
      const auth = { Authorization: `Bearer ${token}` };

      const created = await request(app)
        .post('/api/admin/users')
        .set(auth)
        .send({ userName: 'Anand', password: 'secret1' });
      expect(created.status).toBe(201);
      expect(created.body).toEqual({ id: expect.any(Number), userName: 'Anand' });
      const id = created.body.id;

      // the new user can log in
      expect((await request(app).post('/api/auth/login').send({ userName: 'Anand', password: 'secret1' })).status).toBe(200);

      const got = await request(app).get(`/api/admin/users/${id}`).set(auth);
      expect(got.status).toBe(200);
      expect(got.body.userName).toBe('Anand');

      const renamed = await request(app)
        .put(`/api/admin/users/${id}`)
        .set(auth)
        .send({ userName: 'Anand2' });
      expect(renamed.status).toBe(200);
      expect(renamed.body).toEqual({ id, userName: 'Anand2' });
      // password unchanged when omitted
      expect((await request(app).post('/api/auth/login').send({ userName: 'Anand2', password: 'secret1' })).status).toBe(200);

      const repass = await request(app)
        .put(`/api/admin/users/${id}`)
        .set(auth)
        .send({ userName: 'Anand2', password: 'changed' });
      expect(repass.status).toBe(200);
      expect((await request(app).post('/api/auth/login').send({ userName: 'Anand2', password: 'secret1' })).status).toBe(401);
      expect((await request(app).post('/api/auth/login').send({ userName: 'Anand2', password: 'changed' })).status).toBe(200);

      const del = await request(app).delete(`/api/admin/users/${id}`).set(auth);
      expect(del.status).toBe(204);
      expect((await request(app).get(`/api/admin/users/${id}`).set(auth)).status).toBe(404);
      expect((await request(app).delete(`/api/admin/users/${id}`).set(auth)).status).toBe(404);
      expect((await request(app).post('/api/auth/login').send({ userName: 'Anand2', password: 'changed' })).status).toBe(401);
    });

    it('validates input, ids and duplicates', async () => {
      const token = await login();
      const auth = { Authorization: `Bearer ${token}` };
      expect((await request(app).post('/api/admin/users').set(auth).send({})).status).toBe(400);
      expect(
        (await request(app).post('/api/admin/users').set(auth).send({ userName: 'x'.repeat(31), password: 'a' })).status,
      ).toBe(400);
      expect(
        (await request(app).post('/api/admin/users').set(auth).send({ userName: 'New', password: '' })).status,
      ).toBe(400);
      expect(
        (await request(app).post('/api/admin/users').set(auth).send({ userName: 'deepak', password: 'a' })).status,
      ).toBe(409);
      expect((await request(app).get('/api/admin/users/abc').set(auth)).status).toBe(400);
      expect((await request(app).put('/api/admin/users/999').set(auth).send({ userName: 'Zed' })).status).toBe(404);
      expect((await request(app).put('/api/admin/users/1').set(auth).send({ userName: 'Rohit' })).status).toBe(409);
      expect((await request(app).put('/api/admin/users/1').set(auth).send({})).status).toBe(400);
      expect((await request(app).delete('/api/admin/users/abc').set(auth)).status).toBe(400);
    });
  });
});
