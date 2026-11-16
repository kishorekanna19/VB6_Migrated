import { useEffect } from 'react';
import { Link, Navigate, Outlet, Route, Routes, useNavigate } from 'react-router-dom';

export const SPLASH_DELAY_MS = 2000;

function hideOnError(e: { currentTarget: HTMLImageElement }) {
  e.currentTarget.style.display = 'none';
}

/** Equivalent of FrmSplash: shows the shop logo, then continues to the main form. */
export function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => navigate('/main', { replace: true }), SPLASH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="splash">
      <img src="/Logo.jpg" alt="Book Shop logo" onError={hideOnError} />
      <h1>Book Shop Management System</h1>
      <p>Loading...</p>
    </div>
  );
}

/** Equivalent of frmMain: application shell with branding. */
export function MainLayout() {
  return (
    <div>
      <header className="main-header">
        <img src="/Logo.jpg" alt="Book Shop logo" onError={hideOnError} />
        <h2>Book Shop Management System</h2>
        <nav>
          <Link to="/main" style={{ color: '#fff' }}>
            Home
          </Link>
        </nav>
      </header>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

export function Home() {
  return (
    <div>
      <h3>Welcome</h3>
      <div className="branding">
        <img src="/k1.Jpeg" alt="" onError={hideOnError} />
        <img src="/k2.Jpeg" alt="" onError={hideOnError} />
        <img src="/k3.Jpeg" alt="" onError={hideOnError} />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Splash />} />
      <Route path="/main" element={<MainLayout />}>
        <Route index element={<Home />} />
      </Route>
      <Route path="*" element={<Navigate to="/main" replace />} />
    </Routes>
  );
}
