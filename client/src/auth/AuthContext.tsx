import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, clearToken, getToken, setToken, UNAUTHORIZED_EVENT } from '../api';
import type { LoginRequest, User } from '../types';

const USER_KEY = 'bookshop.user';

interface LoginResponse {
  token: string;
  user: User;
}

export interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  login: (userName: string, password: string) => Promise<User>;
  /** frmMain.cmdLogout: ends the session on the server and clears it locally. */
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredUser(): User | null {
  try {
    if (!getToken()) return null;
    const raw = sessionStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

function clearSession(): void {
  clearToken();
  try {
    sessionStorage.removeItem(USER_KEY);
  } catch {
    /* storage unavailable */
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(readStoredUser);

  useEffect(() => {
    const onUnauthorized = () => {
      clearSession();
      setUser(null);
    };
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, []);

  const login = useCallback(async (userName: string, password: string) => {
    const body: LoginRequest = { userName, password };
    const result = await api.post<LoginResponse>('/auth/login', body);
    setToken(result.token);
    sessionStorage.setItem(USER_KEY, JSON.stringify(result.user));
    setUser(result.user);
    return result.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      /* the session is dropped locally regardless */
    }
    clearSession();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated: user !== null, login, logout }),
    [user, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside an AuthProvider');
  return ctx;
}
