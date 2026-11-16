import supertest from 'supertest';
import { signToken } from '../src/middleware/auth';

/**
 * supertest wrapper that sends a valid Bearer token with every request, so the
 * feature tests can exercise routes that sit behind the auth middleware.
 */
export function request(app: Parameters<typeof supertest>[0]) {
  const agent = supertest(app);
  const authorization = `Bearer ${signToken({ id: 1, userName: 'test' })}`;
  return {
    get: (url: string) => agent.get(url).set('Authorization', authorization),
    post: (url: string) => agent.post(url).set('Authorization', authorization),
    put: (url: string) => agent.put(url).set('Authorization', authorization),
    delete: (url: string) => agent.delete(url).set('Authorization', authorization),
  };
}
