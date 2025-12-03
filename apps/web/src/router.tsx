import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Layout, ProtectedRoute } from './components';
import {
  LoginPage,
  RegisterPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  AuthCallbackPage,
  DashboardPage,
  LinksPage,
  CreateLinkPage,
  EditLinkPage,
  LinkStatsPage,
  QRCodesPage,
  CreateQRPage,
  EditQRPage,
  QRStatsPage,
  AnalyticsPage,
  SettingsPage,
  HelpPage,
  BillingPage,
} from './pages';

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
    element: <ForgotPasswordPage />,
  },
  {
    path: '/auth/callback',
    element: <AuthCallbackPage />,
  },
  {
    path: '/auth/reset-password',
    element: <ResetPasswordPage />,
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
            element: <CreateLinkPage />,
          },
          {
            path: ':id/edit',
            element: <EditLinkPage />,
          },
          {
            path: ':id/stats',
            element: <LinkStatsPage />,
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
            element: <CreateQRPage />,
          },
          {
            path: ':id/edit',
            element: <EditQRPage />,
          },
          {
            path: ':id/stats',
            element: <QRStatsPage />,
          },
        ],
      },
      {
        path: 'analytics',
        element: <AnalyticsPage />,
      },
      {
        path: 'billing',
        element: <BillingPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
      {
        path: 'help',
        element: <HelpPage />,
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
