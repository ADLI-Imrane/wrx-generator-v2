import { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './styles.css';
import { I18nProvider } from './lib/i18n';
import { ToastProvider, ModuleLoader } from './components/ui';
import { AppShell } from './components/AppShell';
import { PublicShell } from './components/PublicShell';
import Landing from './pages/public/Landing';
import NotFound from './pages/public/NotFound';
import { AuthPage } from './pages/public/Auth';
import { Unavailable, Unlock } from './pages/public/Gate';
import { ApiError } from './lib/api';

// Route-level code splitting: visitors of a public profile never download the dashboard.
const Discover = lazy(() => import('./pages/public/Discover'));
const ProfilePage = lazy(() => import('./pages/public/ProfilePage'));
const OpportunityPage = lazy(() => import('./pages/public/OpportunityPage'));
const Overview = lazy(() => import('./pages/app/Overview'));
const Links = lazy(() => import('./pages/app/Links'));
const LinkDetail = lazy(() => import('./pages/app/LinkDetail'));
const QrStudio = lazy(() => import('./pages/app/QrStudio'));
const ProfileEditor = lazy(() => import('./pages/app/ProfileEditor'));
const Opportunities = lazy(() => import('./pages/app/Opportunities'));
const Inbox = lazy(() => import('./pages/app/Inbox'));
const Settings = lazy(() => import('./pages/app/Settings'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 20_000,
      refetchOnWindowFocus: true,
      retry: (n, e) => !(e instanceof ApiError && e.status < 500) && n < 2,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <ToastProvider>
          <BrowserRouter>
            <Suspense fallback={<ModuleLoader className="min-h-dvh" />}>
              <Routes>
                <Route element={<PublicShell />}>
                  <Route index element={<Landing />} />
                  <Route path="discover" element={<Discover />} />
                  <Route path="o/:id" element={<OpportunityPage />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
                <Route path="b/:handle" element={<ProfilePage />} />
                <Route path="login" element={<AuthPage mode="login" />} />
                <Route path="register" element={<AuthPage mode="register" />} />
                <Route path="unlock/:slug" element={<Unlock />} />
                <Route path="p/unavailable" element={<Unavailable />} />
                <Route path="app" element={<AppShell />}>
                  <Route index element={<Overview />} />
                  <Route path="links" element={<Links />} />
                  <Route path="links/:id" element={<LinkDetail />} />
                  <Route path="qr" element={<QrStudio />} />
                  <Route path="profile" element={<ProfileEditor />} />
                  <Route path="opportunities" element={<Opportunities />} />
                  <Route path="inbox" element={<Inbox />} />
                  <Route path="settings" element={<Settings />} />
                </Route>
              </Routes>
            </Suspense>
          </BrowserRouter>
        </ToastProvider>
      </I18nProvider>
    </QueryClientProvider>
  </StrictMode>,
);
