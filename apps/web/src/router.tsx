import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Layout, ProtectedRoute } from './components';
import { LoginPage, RegisterPage, DashboardPage, LinksPage, QRCodesPage } from './pages';

export const router = createBrowserRouter([
  // Routes publiques
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/forgot-password',
    element: <div>Forgot Password Page - TODO</div>,
  },
  {
    path: '/auth/callback',
    element: <div>OAuth Callback - TODO</div>,
  },
  {
    path: '/auth/reset-password',
    element: <div>Reset Password Page - TODO</div>,
  },

  // Routes protégées
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'links',
        children: [
          {
            index: true,
            element: <LinksPage />,
          },
          {
            path: 'new',
            element: <div>Create Link Page - TODO</div>,
          },
          {
            path: ':id/edit',
            element: <div>Edit Link Page - TODO</div>,
          },
          {
            path: ':id/stats',
            element: <div>Link Stats Page - TODO</div>,
          },
        ],
      },
      {
        path: 'qr-codes',
        children: [
          {
            index: true,
            element: <QRCodesPage />,
          },
          {
            path: 'new',
            element: <div>Create QR Code Page - TODO</div>,
          },
          {
            path: ':id/edit',
            element: <div>Edit QR Code Page - TODO</div>,
          },
          {
            path: ':id/stats',
            element: <div>QR Code Stats Page - TODO</div>,
          },
        ],
      },
      {
        path: 'analytics',
        element: <div>Analytics Page - TODO</div>,
      },
      {
        path: 'billing',
        element: <div>Billing Page - TODO</div>,
      },
      {
        path: 'settings',
        element: <div>Settings Page - TODO</div>,
      },
      {
        path: 'help',
        element: <div>Help Page - TODO</div>,
      },
    ],
  },

  // 404
  {
    path: '*',
    element: (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-gray-900">404</h1>
          <p className="mt-4 text-xl text-gray-600">Page non trouvée</p>
          <a href="/dashboard" className="btn btn-primary mt-6 inline-block">
            Retour au dashboard
          </a>
        </div>
      </div>
    ),
  },
]);
