import { createHmac, randomBytes, randomUUID, timingSafeEqual } from 'crypto';
import type { NextFunction, Request, Response } from 'express';

/**
 * Minimal HS256 JSON Web Token implementation (no external dependency).
 * The signing secret comes from JWT_SECRET; when it is not set a random secret
 * is generated at start-up (tokens are then invalidated by a restart).
 */
const TOKEN_TTL_SECONDS = 8 * 60 * 60;
const generatedSecret = randomBytes(32).toString('hex');

function getSecret(): string {
  const fromEnv = process.env.JWT_SECRET;
  return fromEnv && fromEnv.trim() !== '' ? fromEnv : generatedSecret;
}

export interface TokenPayload {
  sub: number;
  userName: string;
  jti: string;
  iat: number;
  exp: number;
}

export interface AuthUser {
  id: number;
  userName: string;
  jti: string;
  exp: number;
}

const b64 = (value: string | Buffer) => Buffer.from(value).toString('base64url');

function signature(data: string): Buffer {
  return createHmac('sha256', getSecret()).update(data).digest();
}

export function signToken(user: { id: number; userName: string }, now: number = Date.now()): string {
  const iat = Math.floor(now / 1000);
  const payload: TokenPayload = {
    sub: user.id,
    userName: user.userName,
    jti: randomUUID(),
    iat,
    exp: iat + TOKEN_TTL_SECONDS,
  };
  const data = `${b64(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))}.${b64(JSON.stringify(payload))}`;
  return `${data}.${b64(signature(data))}`;
}

/** Returns the payload of a valid, unexpired token or null. */
export function verifyToken(token: string, now: number = Date.now()): TokenPayload | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, body, sig] = parts;
  const expected = signature(`${header}.${body}`);
  const actual = Buffer.from(sig, 'base64url');
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  try {
    const head = JSON.parse(Buffer.from(header, 'base64url').toString('utf8')) as { alg?: string };
    if (head.alg !== 'HS256') return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as TokenPayload;
    if (
      typeof payload.sub !== 'number' ||
      typeof payload.userName !== 'string' ||
      typeof payload.jti !== 'string' ||
      typeof payload.exp !== 'number' ||
      payload.exp * 1000 <= now
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

// ------------------------------------------------------- logout (revocation)

const revoked = new Map<string, number>();

/** Marks a token id as logged out until its natural expiry. */
export function revokeToken(jti: string, exp: number): void {
  const nowSeconds = Math.floor(Date.now() / 1000);
  for (const [id, expiry] of revoked) {
    if (expiry <= nowSeconds) revoked.delete(id);
  }
  revoked.set(jti, exp);
}

export function isRevoked(jti: string): boolean {
  return revoked.has(jti);
}

// -------------------------------------------------------------- middleware

export function getAuthUser(res: Response): AuthUser {
  return res.locals.user as AuthUser;
}

/** Rejects the request with 401 unless it carries a valid `Authorization: Bearer <token>` header. */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  const match = typeof header === 'string' ? /^Bearer\s+(\S+)$/i.exec(header) : null;
  const payload = match ? verifyToken(match[1]) : null;
  if (!payload || isRevoked(payload.jti)) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  const user: AuthUser = {
    id: payload.sub,
    userName: payload.userName,
    jti: payload.jti,
    exp: payload.exp,
  };
  res.locals.user = user;
  next();
}
