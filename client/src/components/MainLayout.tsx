import { Suspense, useCallback, useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import ConfirmDialog from './ConfirmDialog';

interface MenuItem {
  label: string;
  to: string;
  shortcut?: string;
}

interface Menu {
  label: string;
  /** Top level entries without sub items navigate directly (mnuAdmin). */
  to?: string;
  items?: MenuItem[];
}

export const MENUS: Menu[] = [
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

const SIDE_BUTTONS: { label: string; to: string }[] = [
  { label: 'New Order', to: '/orders/new' },
  { label: 'New Book', to: '/books/new' },
  { label: 'Books In Stock', to: '/books/stock' },
  { label: 'Sale Book', to: '/sale' },
];

function hideOnError(e: { currentTarget: HTMLImageElement }) {
  e.currentTarget.style.display = 'none';
}

/** frmMain (MDI form): side panel, menu bar and the workspace for the child forms. */
export default function MainLayout() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [confirmExit, setConfirmExit] = useState(false);

  const go = useCallback(
    (to: string) => {
      setOpenMenu(null);
      navigate(to);
    },
    [navigate],
  );

  // Menu shortcuts: Ctrl+N = New book, Ctrl+U = Update book.
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

  // Clicking anywhere else closes an open menu.
  useEffect(() => {
    if (openMenu === null) return undefined;
    const close = () => setOpenMenu(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [openMenu]);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const handleExit = async () => {
    setConfirmExit(false);
    await logout();
    navigate('/goodbye', { replace: true });
    window.close();
  };

  return (
    <div className="main-shell">
      <aside className="side-panel">
        <img className="side-logo" src="/Logo.jpg" alt="Kora Kagaz logo" onError={hideOnError} />
        <div className="side-title">Kora Kagaz</div>
        {SIDE_BUTTONS.map((b) => (
          <button key={b.label} type="button" className="side-button" onClick={() => go(b.to)}>
            {b.label}
          </button>
        ))}
        <div className="side-spacer" />
        <button type="button" className="side-button" onClick={handleLogout}>
          Logout
        </button>
        <button type="button" className="side-button" onClick={() => setConfirmExit(true)}>
          Exit
        </button>
      </aside>
      <div className="main-area">
        <nav className="menu-bar" aria-label="Main menu">
          {MENUS.map((menu) => (
            <div key={menu.label} className="menu">
              <button
                type="button"
                className="menu-title"
                aria-haspopup={menu.items ? 'true' : undefined}
                aria-expanded={menu.items ? openMenu === menu.label : undefined}
                onClick={(e) => {
                  e.stopPropagation();
                  if (menu.to) go(menu.to);
                  else setOpenMenu(openMenu === menu.label ? null : menu.label);
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
        open={confirmExit}
        message="Do you want to exit the application?"
        onConfirm={handleExit}
        onCancel={() => setConfirmExit(false)}
      />
    </div>
  );
}
