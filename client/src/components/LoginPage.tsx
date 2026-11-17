import { useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useDialog } from './DialogProvider';
import { useEnterAsTab } from '../hooks/useEnterAsTab';
import { errorMessage, FIELD_LIMITS } from '../api';

export const DEFAULT_HOME = '/home';

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { showMessage, dialog } = useDialog();
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const onKeyDown = useEnterAsTab();
  const from = (location.state as { from?: string } | null)?.from;

  if (isAuthenticated && !busy) {
    return <Navigate to={from ?? DEFAULT_HOME} replace />;
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (userName.trim() === '') {
      await showMessage('Please enter the user name');
    } else if (password === '') {
      await showMessage('Please enter the password');
    } else {
      setBusy(true);
      try {
        await login(userName.trim(), password);
        navigate(from && from !== '/login' ? from : DEFAULT_HOME, { replace: true });
      } catch (err) {
        setBusy(false);
        setPassword('');
        await showMessage(errorMessage(err), 'Login');
      }
    }
  };

  return (
    <div className="login-page">
      <form className="login-form" onSubmit={onSubmit} onKeyDown={onKeyDown}>
        <img
          className="login-logo"
          src="/Logo.jpg"
          alt=""
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
        <h2>Kora Kagaz - Login</h2>
        <label>
          User Name
          <input
            type="text"
            value={userName}
            maxLength={FIELD_LIMITS.user.userName}
            autoFocus
            autoComplete="username"
            onChange={(e) => setUserName(e.target.value)}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            maxLength={FIELD_LIMITS.user.password}
            autoComplete="current-password"
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <div className="form-buttons">
          <button type="submit" disabled={busy}>
            Login
          </button>
        </div>
      </form>
      {dialog}
    </div>
  );
}
