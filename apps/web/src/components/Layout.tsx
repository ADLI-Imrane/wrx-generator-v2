import { Outlet, useLocation } from 'react-router-dom';
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { useUIStore } from '../stores/ui.store';
import { useAuthStore } from '../stores/auth.store';
import { WorkspaceLauncher } from './WorkspaceDock';
import { useWorkspacePreferencesStore } from '../stores/workspace-preferences.store';
import { resolveWorkspaceAppearance, workspaceAccentVariables } from '../lib/workspace-preferences';

export function Layout() {
  const { sidebarOpen, closeSidebar } = useUIStore();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const { navigationMode, accent, appearance, hydrate } = useWorkspacePreferencesStore();
  const [launcherOpen, setLauncherOpen] = useState(false);
  const [systemPrefersDark, setSystemPrefersDark] = useState(() => typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches === true);
  const closeLauncher = useCallback(() => setLauncherOpen(false), []);
  const location = useLocation();
  useLayoutEffect(() => { hydrate(userId); }, [hydrate, userId]);
  useEffect(() => {
    const media = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!media) return;
    const sync = () => setSystemPrefersDark(media.matches);
    sync();
    if (media.addEventListener) {
      media.addEventListener('change', sync);
      return () => media.removeEventListener('change', sync);
    }
    media.addListener?.(sync);
    return () => media.removeListener?.(sync);
  }, []);
  useEffect(() => {
    if (window.innerWidth < 1024) closeSidebar();
    closeLauncher();
  }, [location.pathname, closeSidebar, closeLauncher]);

  const section = location.pathname.split('/')[1] || 'dashboard';
  const resolvedAppearance = resolveWorkspaceAppearance(appearance, systemPrefersDark);
  const chapter: Record<string, string> = { dashboard: '00 / Espace de travail', links: '01 / Liens & destinations', 'qr-codes': '02 / Codes & contenus', 'business-cards': '03 / Identité professionnelle', 'digital-cards': '04 / Identité numérique', passwords: '05 / Utilitaire local', analytics: '06 / Signaux & activité', billing: '07 / Votre abonnement', settings: '08 / Préférences', help: '09 / Guide WRX', 'email-signatures': '10 / Correspondance professionnelle' };

  return (
    <div className="wrx-app min-h-screen" data-page={section} data-navigation-mode={navigationMode} data-accent={accent} data-appearance={appearance} data-theme={resolvedAppearance} style={workspaceAccentVariables(accent)}>
      <Navbar navigationMode={navigationMode} onOpenLauncher={() => setLauncherOpen(true)} />
      <div className="flex">
        {/* Mobile overlay */}
        {navigationMode === 'sidebar' && sidebarOpen && (
          <div className="wrx-drawer-backdrop fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={closeSidebar} />
        )}
        <Sidebar />
        <main className={`min-w-0 flex-1 transition-[margin] duration-200 ${navigationMode === 'sidebar' ? (sidebarOpen ? 'lg:ml-64' : 'lg:ml-16') : 'ml-0'}`}>
          <div className="studio-content mx-auto w-full min-w-0 max-w-[1600px]">
            <p className="page-chapter eyebrow">{chapter[section]}</p>
            <div key={location.pathname} className="wrx-page-enter">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
      {launcherOpen && <WorkspaceLauncher onClose={closeLauncher} />}
    </div>
  );
}
