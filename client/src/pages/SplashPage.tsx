import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const SPLASH_INTERVAL_MS = 200;
export const SPLASH_STEP = 5;
export const SPLASH_MAX = 100;

/** frmSplash: progress bar advancing +5 every 200 ms, then the login form. */
export default function SplashPage() {
  const navigate = useNavigate();
  const [value, setValue] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setValue((v) => Math.min(v + SPLASH_STEP, SPLASH_MAX));
    }, SPLASH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (value >= SPLASH_MAX) navigate('/login', { replace: true });
  }, [value, navigate]);

  return (
    <div className="splash">
      <div className="splash-frame">
        <img
          className="splash-logo"
          src="/Logo.jpg"
          alt="Kora Kagaz logo"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
        <h1 className="splash-title">Kora Kagaz</h1>
        <div className="splash-progress-row">
          <span className="splash-loading">Loading...</span>
          <span className="splash-percent">{value}%</span>
        </div>
        <progress max={SPLASH_MAX} value={value} aria-label="Loading progress" />
      </div>
    </div>
  );
}
