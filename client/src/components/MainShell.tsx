import { Suspense, useCallback, useEffect, useState } from 'react';
import type { SyntheticEvent } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { ConfirmDialog } from './DialogProvider';

interface MenuItem {
  label: string;
  to: string;
  shortcut?: string;
}

interface MenuGroup {
  label: string;
  items?: MenuItem[];
  to?: string;
}

const MENUS: MenuGroup[] = [
  {
    label: 'Book',
    items: [
      { label: 'New', to: '/books/new', shortcut: 'Ctrl+N' },
      { label: 'New Order', to: '/orders/new' },
      { label: 'Update', to: '/books/edit', shortcut: 'Ctrl+U' },
      { label: "View Book's", to: '/books/stock' },
    ],
  },
  { label: 'Sale', items: [{ label: 'Sale Book', to: '/sale' }] },
  {
    label: 'Report',
    items: [
      { label: 'Customer Details', to: '/reports/customers' },
      { label: 'Order Details', to: '/reports/orders' },
      { label: 'Book In Stock', to: '/books/stock' },
    ],
  },
  { label: 'Admin', to: '/admin' },
];

const SIDE_BUTTONS: MenuItem[] = [
  { label: 'New Order', to: '/orders/new' },
  { label: 'New Book', to: '/books/new' },
  { label: 'Books In Stock', to: '/books/stock' },
  { label: 'Sale Book', to: '/sale' },
];

function hideBrokenImage(e: SyntheticEvent<HTMLImageElement>) {
  e.currentTarget.style.display = 'none';
}

export default function MainShell() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [exitOpen, setExitOpen] = useState(false);
  // Presentation only: off-canvas navigation drawer on narrow screens.
  const [drawerOpen, setDrawerOpen] = useState(false);

  const go = useCallback(
    (to: string) => {
      setOpenMenu(null);
      setDrawerOpen(false);
      navigate(to);
    },
    [navigate],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!e.ctrlKey || e.altKey || e.shiftKey || e.metaKey) return;
      const key = e.key.toLowerCase();
      if (key === 'n') {
        e.preventDefault();
        go('/books/new');
      } else if (key === 'u') {
        e.preventDefault();
        go('/books/edit');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go]);

  useEffect(() => {
    if (openMenu === null) return;
    const close = () => setOpenMenu(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [openMenu]);

  return (
    <div className="main-shell">
      {drawerOpen && <div className="drawer-backdrop" aria-hidden="true" onClick={() => setDrawerOpen(false)} />}
      <aside id="side-navigation" className={drawerOpen ? 'side-panel is-open' : 'side-panel'}>
        <img className="side-logo" src="/Logo.jpg" alt="Kora Kagaz logo" onError={hideBrokenImage} />
        <div className="side-title">Kora Kagaz</div>
        {SIDE_BUTTONS.map((b) => (
          <button key={b.label} type="button" className="side-button" onClick={() => go(b.to)}>
            {b.label}
          </button>
        ))}
        <div className="side-spacer" />
        <button
          type="button"
          className="side-button"
          onClick={async () => {
            setDrawerOpen(false);
            await logout();
            navigate('/login', { replace: true });
          }}
        >
          Logout
        </button>
        <button
          type="button"
          className="side-button"
          onClick={() => {
            setDrawerOpen(false);
            setExitOpen(true);
          }}
        >
          Exit
        </button>
      </aside>
      <div className="main-area">
        <header className="app-header">
          <button
            type="button"
            className="drawer-toggle"
            aria-controls="side-navigation"
            aria-expanded={drawerOpen}
            aria-label="Toggle navigation"
            onClick={(e) => {
              e.stopPropagation();
              setDrawerOpen((open) => !open);
            }}
          >
            <span className="drawer-toggle-bars" aria-hidden="true" />
          </button>
          <span className="app-header-title">Kora Kagaz</span>
        </header>
        <nav className="menu-bar" aria-label="Main menu">
          {MENUS.map((menu) => (
            <div className="menu" key={menu.label}>
              <button
                type="button"
                className="menu-title"
                aria-haspopup={menu.items ? 'true' : undefined}
                aria-expanded={menu.items ? openMenu === menu.label : undefined}
                onClick={(e) => {
                  e.stopPropagation();
                  if (menu.to) {
                    go(menu.to);
                  } else {
                    setOpenMenu(openMenu === menu.label ? null : menu.label);
                  }
                }}
              >
                {menu.label}
              </button>
              {menu.items && openMenu === menu.label && (
                <ul className="menu-items" role="menu">
                  {menu.items.map((item) => (
                    <li key={item.label} role="none">
                      <button type="button" role="menuitem" onClick={() => go(item.to)}>
                        <span>{item.label}</span>
                        {item.shortcut && <span className="menu-shortcut">{item.shortcut}</span>}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </nav>
        <main className="workspace">
          <Suspense fallback={<p>Loading...</p>}>
            <Outlet />
          </Suspense>
        </main>
      </div>
      <ConfirmDialog
        open={exitOpen}
        message="Do you want to exit the application?"
        onConfirm={async () => {
          setExitOpen(false);
          await logout();
          navigate('/goodbye', { replace: true });
          window.close();
        }}
        onCancel={() => setExitOpen(false)}
      />
    </div>
  );
}
