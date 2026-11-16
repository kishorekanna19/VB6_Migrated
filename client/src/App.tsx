import { lazy, type ComponentType } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import ProtectedRoute from './auth/ProtectedRoute';
import MainLayout from './components/MainLayout';
import AdminSettingsPage from './pages/AdminSettingsPage';
import GoodbyePage from './pages/GoodbyePage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SplashPage from './pages/SplashPage';

/**
 * Feature pages (books, orders, sale, reports) live in ./pages and are resolved by
 * file name so this shell does not depend on their exact export style.
 */
const pageModules = import.meta.glob<Record<string, unknown>>('./pages/*Page.tsx');

function MissingPage() {
  return <p>This screen is not available.</p>;
}

function loadPage(candidates: string[]): ComponentType {
  const key = candidates.map((n) => `./pages/${n}.tsx`).find((k) => k in pageModules);
  if (!key) return MissingPage;
  return lazy(async () => {
    const mod = await pageModules[key]();
    const component = (mod.default ?? Object.values(mod).find((v) => typeof v === 'function')) as
      | ComponentType
      | undefined;
    return { default: component ?? MissingPage };
  });
}

const NewBookPage = loadPage(['AddNewBookPage', 'NewBookPage', 'AddBookPage', 'BookNewPage']);
const EditBookPage = loadPage(['EditBookPage', 'EditBookDetailsPage', 'UpdateBookPage', 'BookEditPage']);
const BookStockPage = loadPage(['BookStockPage', 'BooksInStockPage', 'StockPage', 'ViewBookDetailsPage']);
const ViewBooksPage = loadPage(['ViewBooksPage', 'ViewBookDetailsPage']);
const NewOrderPage = loadPage(['NewOrderPage', 'OrderNewPage']);
const SalePage = loadPage(['SalePage', 'SaleBookPage']);
const CustomerDetailsPage = loadPage(['CustomerDetailsPage', 'CustomersPage', 'CustomerReportPage']);
const OrderDetailsPage = loadPage(['OrderDetailsPage', 'OrdersPage', 'OrderReportPage']);

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/splash" replace />} />
        <Route path="/splash" element={<SplashPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/goodbye" element={<GoodbyePage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/home" element={<HomePage />} />
            <Route path="/books/new" element={<NewBookPage />} />
            <Route path="/books/edit" element={<EditBookPage />} />
            <Route path="/books/stock" element={<BookStockPage />} />
            <Route path="/books/view" element={<ViewBooksPage />} />
            <Route path="/orders/new" element={<NewOrderPage />} />
            <Route path="/sale" element={<SalePage />} />
            <Route path="/reports/customers" element={<CustomerDetailsPage />} />
            <Route path="/reports/orders" element={<OrderDetailsPage />} />
            <Route path="/admin" element={<AdminSettingsPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/splash" replace />} />
      </Routes>
    </AuthProvider>
  );
}
