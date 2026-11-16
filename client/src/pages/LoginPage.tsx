import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { errorMessage } from '../api';
import { useAuth } from '../auth/AuthContext';
import { useMessageBox } from '../components/ConfirmDialog';
import { useEnterChain } from '../hooks/useEnterChain';
import { LIMITS } from '../types';

export const DEFAULT_HOME = '/home';

/** LoginForm: UserName / Password checked against the server (/api/auth/login). */
export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { showMessage, dialog } = useMessageBox();
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const onKeyDown = useEnterChain();

  const from = (location.state as { from?: string } | null)?.from;

  if (isAuthenticated && !busy) {
    return <Navigate to={from ?? DEFAULT_HOME} replace />;
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (userName.trim() === '') {
      await showMessage('Please enter the user name');
      return;
    }
    if (password === '') {
      await showMessage('Please enter the password');
      return;
    }
    setBusy(true);
    try {
      await login(userName.trim(), password);
      navigate(from && from !== '/login' ? from : DEFAULT_HOME, { replace: true });
    } catch (err) {
      setBusy(false);
      setPassword('');
      await showMessage(errorMessage(err), 'Login');
    }
  };

  return (
    <div className="login-page">
      <form className="login-form" onSubmit={submit} onKeyDown={onKeyDown}>
        <h2>Kora Kagaz - Login</h2>
        <label>
          User Name
          <input
            type="text"
            value={userName}
            maxLength={LIMITS.user.userName}
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
            maxLength={LIMITS.user.password}
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
