import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../app';
import { openDatabase, setDb } from '../db';

const app = createApp('/nonexistent-client-dist');

const order = {
  book: 'Clean Code',
  author: 'Robert Martin',
  publication: 'Prentice Hall',
  quantity: 3,
  cusName: 'Alice',
  cusMob: '5551234',
  cusEmail: 'alice@example.com',
};

const customer = { name: 'Bob', mobile: '5559999', email: 'bob@example.com' };

describe('orders API', () => {
  beforeEach(() => {
    setDb(openDatabase(':memory:'));
  });
  afterAll(() => {
    setDb(null);
  });

  it('POST persists all 7 order fields', async () => {
    const res = await request(app).post('/api/orders').send(order);
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: expect.any(Number), ...order });
    const list = await request(app).get('/api/orders');
    expect(list.status).toBe(200);
    expect(list.body).toEqual([res.body]);
  });

  it('POST rejects invalid bodies', async () => {
    expect((await request(app).post('/api/orders').send({})).status).toBe(400);
    expect(
      (await request(app).post('/api/orders').send({ ...order, book: 'x'.repeat(31) })).status,
    ).toBe(400);
    expect(
      (await request(app).post('/api/orders').send({ ...order, quantity: 'lots' })).status,
    ).toBe(400);
  });

  it('DELETE removes the order and returns 404 for unknown ids', async () => {
    const created = await request(app).post('/api/orders').send(order);
    const res = await request(app).delete(`/api/orders/${created.body.id}`);
    expect(res.status).toBe(204);
    expect((await request(app).get('/api/orders')).body).toEqual([]);
    expect((await request(app).delete(`/api/orders/${created.body.id}`)).status).toBe(404);
    expect((await request(app).delete('/api/orders/abc')).status).toBe(400);
  });
});

describe('customers API', () => {
  beforeEach(() => {
    setDb(openDatabase(':memory:'));
  });
  afterAll(() => {
    setDb(null);
  });

  it('POST saves Name, Moble and Email', async () => {
    const res = await request(app).post('/api/customers').send(customer);
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: expect.any(Number), ...customer });
    const list = await request(app).get('/api/customers');
    expect(list.body).toEqual([res.body]);
  });

  it('POST rejects invalid bodies', async () => {
    expect((await request(app).post('/api/customers').send({})).status).toBe(400);
    expect(
      (await request(app).post('/api/customers').send({ ...customer, mobile: '1'.repeat(16) }))
        .status,
    ).toBe(400);
  });

  it('DELETE removes the customer and returns 404 for unknown ids', async () => {
    const created = await request(app).post('/api/customers').send(customer);
    expect((await request(app).delete(`/api/customers/${created.body.id}`)).status).toBe(204);
    expect((await request(app).get('/api/customers')).body).toEqual([]);
    expect((await request(app).delete(`/api/customers/${created.body.id}`)).status).toBe(404);
    expect((await request(app).delete('/api/customers/abc')).status).toBe(400);
  });
});
