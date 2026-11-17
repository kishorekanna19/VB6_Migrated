import { lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import ProtectedRoute from './auth/ProtectedRoute';
import SplashScreen from './components/SplashScreen';
import LoginPage from './components/LoginPage';
import MainShell from './components/MainShell';
import AdminForm from './components/AdminForm';
import GoodbyePage from './pages/GoodbyePage';
import HomePage from './pages/HomePage';

const NewBookPage = lazy(() => import('./pages/NewBookPage'));
const EditBookPage = lazy(() => import('./pages/EditBookPage'));
const BookStockPage = lazy(() => import('./pages/BookStockPage'));
const ViewBooksPage = lazy(() => import('./pages/ViewBooksPage'));
const NewOrderPage = lazy(() => import('./pages/NewOrderPage'));
const SalePage = lazy(() => import('./pages/SalePage'));
const CustomerDetailsPage = lazy(() => import('./pages/CustomerDetailsPage'));
const OrderDetailsPage = lazy(() => import('./pages/OrderDetailsPage'));

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/splash" replace />} />
        <Route path="/splash" element={<SplashScreen />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/goodbye" element={<GoodbyePage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<MainShell />}>
            <Route path="/home" element={<HomePage />} />
            <Route path="/books/new" element={<NewBookPage />} />
            <Route path="/books/edit" element={<EditBookPage />} />
            <Route path="/books/stock" element={<BookStockPage />} />
            <Route path="/books/view" element={<ViewBooksPage />} />
            <Route path="/orders/new" element={<NewOrderPage />} />
            <Route path="/sale" element={<SalePage />} />
            <Route path="/reports/customers" element={<CustomerDetailsPage />} />
            <Route path="/reports/orders" element={<OrderDetailsPage />} />
            <Route path="/admin" element={<AdminForm />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/splash" replace />} />
      </Routes>
    </AuthProvider>
  );
}
