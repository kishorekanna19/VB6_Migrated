import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const SPLASH_INTERVAL_MS = 200;
export const SPLASH_STEP = 5;
export const SPLASH_MAX = 100;

export default function SplashScreen() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((p) => Math.min(p + SPLASH_STEP, SPLASH_MAX));
    }, SPLASH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (progress >= SPLASH_MAX) {
      navigate('/login', { replace: true });
    }
  }, [progress, navigate]);

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
          <span className="splash-percent" role="status">
            {progress}%
          </span>
        </div>
        <progress max={100} value={progress} aria-label="Loading progress" />
      </div>
    </div>
  );
}
