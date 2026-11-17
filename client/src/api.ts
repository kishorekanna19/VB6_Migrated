export const TOKEN_KEY = 'bookshop.token';
export const API_BASE = '/api';
export const UNAUTHORIZED_EVENT = 'bookshop:unauthorized';

export class ApiRequestError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
  }
}

export function getToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unexpected error';
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const url = path.startsWith(API_BASE) ? path : `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
  const headers: Record<string, string> = { Accept: 'application/json' };
  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const init: RequestInit = { method, headers };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }

  let response: Response;
  try {
    response = await fetch(url, init);
  } catch {
    throw new ApiRequestError(0, 'Unable to reach the server');
  }

  let data: unknown;
  if (response.status !== 204) {
    const text = await response.text();
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = undefined;
      }
    }
  }

  if (!response.ok) {
    if (response.status === 401 && token && !path.endsWith('/auth/login')) {
      clearToken();
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    const message =
      data && typeof data === 'object' && 'error' in data && typeof (data as { error: unknown }).error === 'string'
        ? (data as { error: string }).error
        : `Request failed (${response.status})`;
    throw new ApiRequestError(response.status, message);
  }
  return data as T;
}

export const api = {
  get: <T = unknown>(path: string) => request<T>('GET', path),
  post: <T = unknown>(path: string, body?: unknown) => request<T>('POST', path, body ?? {}),
  put: <T = unknown>(path: string, body?: unknown) => request<T>('PUT', path, body ?? {}),
  del: <T = unknown>(path: string) => request<T>('DELETE', path),
};

export const FIELD_LIMITS = {
  customer: { name: 30, mobile: 15, email: 30 },
  book: { name: 25, author: 25, publication: 25, edition: 25 },
  order: { book: 30, author: 30, publication: 30, cusName: 30, cusMob: 30, cusEmail: 30 },
  sale: { name: 30, author: 30 },
  user: { userName: 30, password: 30 },
};
