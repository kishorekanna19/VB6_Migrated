import { request } from '../../test/authRequest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../app';
import { getDb, openDatabase, setDb } from '../db';
import { computePay, vbVal } from '../services/salesService';

const app = createApp('/nonexistent-client-dist');

describe('VB Val semantics', () => {
  it('parses leading numbers and treats the rest as 0', () => {
    expect(vbVal('12abc')).toBe(12);
    expect(vbVal(' 2.5 ')).toBe(2.5);
    expect(vbVal('abc')).toBe(0);
    expect(vbVal('')).toBe(0);
    expect(vbVal(null)).toBe(0);
    expect(computePay('3', '10.5')).toBe(31.5);
    expect(computePay('x', '10')).toBe(0);
  });
});

describe('sales API', () => {
  beforeEach(() => {
    setDb(openDatabase(':memory:'));
  });
  afterAll(() => {
    setDb(null);
  });

  it('POST stores the line with Pay = quantity x sale price', async () => {
    const res = await request(app)
      .post('/api/sales')
      .send({ name: 'Clean Code', author: 'Robert Martin', quantity: 3, salePrice: 12.5 });
    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      id: expect.any(Number),
      name: 'Clean Code',
      author: 'Robert Martin',
      quantity: 3,
      salePrice: 12.5,
      pay: 37.5,
    });
    const list = await request(app).get('/api/sales');
    expect(list.status).toBe(200);
    expect(list.body).toEqual([res.body]);
  });

  it('ignores a client supplied pay and accepts text input', async () => {
    const res = await request(app)
      .post('/api/sales')
      .send({ name: 'Book', author: 'A', quantity: '2', salePrice: '4.25', pay: 999 });
    expect(res.status).toBe(201);
    expect(res.body.pay).toBe(8.5);
  });

  it('treats non-numeric values as 0', async () => {
    const res = await request(app)
      .post('/api/sales')
      .send({ name: 'Book', quantity: 'abc', salePrice: '5' });
    expect(res.status).toBe(201);
    expect(res.body.quantity).toBe(0);
    expect(res.body.pay).toBe(0);
    expect(res.body.author).toBe('');
  });

  it('rejects invalid bodies', async () => {
    expect((await request(app).post('/api/sales').send({})).status).toBe(400);
    expect(
      (await request(app).post('/api/sales').send({ name: 'x'.repeat(31), quantity: 1 })).status,
    ).toBe(400);
    expect(
      (await request(app).post('/api/sales').send({ name: 'Book', quantity: 1.5, salePrice: 1 }))
        .status,
    ).toBe(400);
  });

  it('does not change book stock', async () => {
    const book = {
      name: 'Stocked',
      author: 'A',
      publication: 'P',
      edition: '1',
      quantity: 10,
      purchasePrice: 1,
      salePrice: 2,
    };
    const created = await request(app).post('/api/books').send(book);
    await request(app).post('/api/sales').send({ name: 'Stocked', author: 'A', quantity: 4, salePrice: 2 });
    const got = await request(app).get(`/api/books/${created.body.id}`);
    expect(got.body.quantity).toBe(10);
    const row = getDb().prepare('SELECT COUNT(*) AS c FROM SalesDetails').get() as { c: number };
    expect(row.c).toBe(1);
  });
});
