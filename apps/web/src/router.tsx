import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { Layout, ProtectedRoute } from './components';
import { AuthFrame } from './components/AuthFrame';
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
  PasswordGeneratorPage,
} from './pages';
import { BusinessCardsPage } from './pages/BusinessCardsPage';
import { BusinessCardEditorPage } from './pages/BusinessCardEditorPage';
import { DigitalCardsPage } from './pages/DigitalCardsPage';
import { DigitalCardEditorPage } from './pages/DigitalCardEditorPage';
import { DigitalCardShareRoute } from './pages/DigitalCardShareRoute';
import { PublicDigitalCardPage } from './pages/PublicDigitalCardPage';
import { EmailSignaturesPage } from './pages/EmailSignaturesPage';
import { EmailSignatureEditorPage } from './pages/EmailSignatureEditorPage';

const HomepageConcept = lazy(() => import('./pages/homepage-concept/HomepageConcept'));
const approvedHomepage = (
  <Suspense fallback={<p role="status">Chargement du concept WRX…</p>}>
    <HomepageConcept />
  </Suspense>
);

export const router = createBrowserRouter([
  { path: '/', element: approvedHomepage },
  { path: '/homepage-concept', element: approvedHomepage },
  { path: '/c/:slug', element: <PublicDigitalCardPage /> },
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
        path: 'business-cards',
        children: [
          { index: true, element: <BusinessCardsPage /> },
          { path: 'new', element: <BusinessCardEditorPage /> },
          { path: ':id/edit', element: <BusinessCardEditorPage /> },
        ],
      },
      {
        path: 'digital-cards',
        children: [
          { index: true, element: <DigitalCardsPage /> },
          { path: 'new', element: <DigitalCardEditorPage /> },
          { path: ':id/edit', element: <DigitalCardEditorPage /> },
          { path: ':id/share', element: <DigitalCardShareRoute /> },
        ],
      },
      {
        path: 'email-signatures',
        children: [
          { index: true, element: <EmailSignaturesPage /> },
          { path: 'new', element: <EmailSignatureEditorPage /> },
          { path: ':id/edit', element: <EmailSignatureEditorPage /> },
        ],
      },
      {
        path: 'analytics',
        element: <AnalyticsPage />,
      },
      {
        path: 'passwords',
        element: <PasswordGeneratorPage />,
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
      <AuthFrame>
        <div className="text-center">
          <p className="eyebrow mb-4">Destination introuvable / 404</p>
          <h2 className="text-4xl font-bold text-gray-900">Ce chemin s’arrête ici.</h2>
          <p className="mt-4 text-xl text-gray-600">Page non trouvée</p>
          <a href="/dashboard" className="btn btn-primary mt-6 inline-block">Retour au dashboard</a>
        </div>
      </AuthFrame>
    ),
  },
]);
