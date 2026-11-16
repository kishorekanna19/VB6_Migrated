import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../app';
import { openDatabase, setDb } from '../db';

const app = createApp('/nonexistent-client-dist');

const sample = {
  name: 'Clean Code',
  author: 'Robert Martin',
  publication: 'Prentice Hall',
  edition: '1st',
  quantity: 5,
  purchasePrice: 20.5,
  salePrice: 30,
};

describe('books API', () => {
  beforeEach(() => {
    setDb(openDatabase(':memory:'));
  });

  afterAll(() => {
    setDb(null);
  });

  it('POST stores all 7 fields and returns 201', async () => {
    const res = await request(app).post('/api/books').send(sample);
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: expect.any(Number), ...sample });
    const got = await request(app).get(`/api/books/${res.body.id}`);
    expect(got.status).toBe(200);
    expect(got.body).toEqual(res.body);
  });

  it('POST rejects invalid bodies', async () => {
    const tooLong = await request(app)
      .post('/api/books')
      .send({ ...sample, name: 'x'.repeat(26) });
    expect(tooLong.status).toBe(400);
    const badQty = await request(app)
      .post('/api/books')
      .send({ ...sample, quantity: 'many' });
    expect(badQty.status).toBe(400);
    const missing = await request(app).post('/api/books').send({});
    expect(missing.status).toBe(400);
  });

  it('GET lists all books in insertion order', async () => {
    await request(app).post('/api/books').send(sample);
    await request(app)
      .post('/api/books')
      .send({ ...sample, name: 'Refactoring' });
    const res = await request(app).get('/api/books');
    expect(res.status).toBe(200);
    expect(res.body.map((b: { name: string }) => b.name)).toEqual(['Clean Code', 'Refactoring']);
  });

  it('GET ?name= returns exact matches; empty name returns all', async () => {
    await request(app).post('/api/books').send(sample);
    await request(app)
      .post('/api/books')
      .send({ ...sample, name: 'Refactoring' });
    const exact = await request(app).get('/api/books').query({ name: 'Refactoring' });
    expect(exact.body).toHaveLength(1);
    expect(exact.body[0].name).toBe('Refactoring');
    const partial = await request(app).get('/api/books').query({ name: 'Refactor' });
    expect(partial.body).toEqual([]);
    const empty = await request(app).get('/api/books').query({ name: '' });
    expect(empty.body).toHaveLength(2);
  });

  it('GET ?name= with quotes does not break or inject SQL', async () => {
    await request(app)
      .post('/api/books')
      .send({ ...sample, name: "O'Reilly's Guide" });
    await request(app).post('/api/books').send(sample);
    const quoted = await request(app).get('/api/books').query({ name: "O'Reilly's Guide" });
    expect(quoted.status).toBe(200);
    expect(quoted.body).toHaveLength(1);
    const inject = await request(app).get('/api/books').query({ name: "' OR '1'='1" });
    expect(inject.status).toBe(200);
    expect(inject.body).toEqual([]);
    const drop = await request(app).get('/api/books').query({ name: "x'; DROP TABLE NewBook; --" });
    expect(drop.status).toBe(200);
    expect(drop.body).toEqual([]);
    const all = await request(app).get('/api/books');
    expect(all.body).toHaveLength(2);
  });

  it('GET /:id returns 404 for unknown and 400 for invalid ids', async () => {
    expect((await request(app).get('/api/books/999')).status).toBe(404);
    expect((await request(app).get('/api/books/abc')).status).toBe(400);
  });

  it('PUT updates all 7 fields', async () => {
    const created = await request(app).post('/api/books').send(sample);
    const update = {
      name: 'Clean Coder',
      author: 'R. Martin',
      publication: 'PH',
      edition: '2nd',
      quantity: 9,
      purchasePrice: 11.25,
      salePrice: 15.75,
    };
    const res = await request(app).put(`/api/books/${created.body.id}`).send(update);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: created.body.id, ...update });
    const got = await request(app).get(`/api/books/${created.body.id}`);
    expect(got.body).toEqual({ id: created.body.id, ...update });
  });

  it('PUT unknown id returns 404; invalid body returns 400', async () => {
    const res = await request(app).put('/api/books/12345').send(sample);
    expect(res.status).toBe(404);
    const created = await request(app).post('/api/books').send(sample);
    const bad = await request(app)
      .put(`/api/books/${created.body.id}`)
      .send({ ...sample, salePrice: 'free' });
    expect(bad.status).toBe(400);
  });

  it('DELETE removes the row; unknown id returns 404', async () => {
    const created = await request(app).post('/api/books').send(sample);
    const res = await request(app).delete(`/api/books/${created.body.id}`);
    expect(res.status).toBe(204);
    expect((await request(app).get(`/api/books/${created.body.id}`)).status).toBe(404);
    expect((await request(app).get('/api/books')).body).toEqual([]);
    expect((await request(app).delete(`/api/books/${created.body.id}`)).status).toBe(404);
  });
});
