import request from 'supertest';
import { describe, expect, it } from 'vitest';
import express from 'express';
import { createApp, errorHandler } from './app';

describe('app', () => {
  const app = createApp('/nonexistent-client-dist');

  it('returns a JSON 404 for unknown /api routes', async () => {
    const res = await request(app).get('/api/unknown');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Not found' });
  });

  it('returns a JSON 400 for malformed JSON bodies', async () => {
    const res = await request(app)
      .post('/api/unknown')
      .set('Content-Type', 'application/json')
      .send('{bad json');
    expect(res.status).toBe(400);
    expect(typeof res.body.error).toBe('string');
  });

  it('error handler returns JSON 500 for unexpected errors', async () => {
    const failing = express();
    failing.get('/boom', () => {
      throw new Error('boom');
    });
    failing.use(errorHandler);
    const res = await request(failing).get('/boom');
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Internal server error' });
  });

  it('sends CORS headers', async () => {
    const res = await request(app).get('/api/unknown');
    expect(res.headers['access-control-allow-origin']).toBe('*');
  });
});
