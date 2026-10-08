import { Outlet, useLocation, NavLink } from 'react-router-dom';
import { useEffect } from 'react';
import { ContactRound, LayoutDashboard, Link2, QrCode } from 'lucide-react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { useUIStore } from '../stores/ui.store';

export function Layout() {
  const { sidebarOpen, closeSidebar } = useUIStore();
  const location = useLocation();
  useEffect(() => {
    if (window.innerWidth < 1024) closeSidebar();
  }, [location.pathname, closeSidebar]);

  const section = location.pathname.split('/')[1] || 'dashboard';
  const chapter: Record<string, string> = { dashboard: '00 / Espace de travail', links: '01 / Liens & destinations', 'qr-codes': '02 / Codes & contenus', 'business-cards': '03 / Identité professionnelle', 'digital-cards': '04 / Identité numérique', passwords: '05 / Utilitaire local', analytics: '06 / Signaux & activité', billing: '07 / Votre abonnement', settings: '08 / Préférences', help: '09 / Guide WRX' };

  return (
    <div className="wrx-app min-h-screen" data-page={section}>
      <Navbar />
      <div className="flex">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div className="wrx-drawer-backdrop fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={closeSidebar} />
        )}
        <Sidebar />
        <main
          className={`min-w-0 flex-1 transition-[margin] duration-200 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-16'} ml-0`}
        >
          <div className="studio-content mx-auto w-full min-w-0 max-w-[1600px]">
            <p className="page-chapter eyebrow">{chapter[section]}</p>
            <div key={location.pathname} className="wrx-page-enter">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
      <nav className="mobile-tool-dock" aria-label="Accès rapide"><NavLink to="/dashboard"><LayoutDashboard size={19} /><span>Accueil</span></NavLink><NavLink to="/links/new"><Link2 size={19} /><span>Liens</span></NavLink><NavLink to="/qr-codes/new"><QrCode size={19} /><span>QR Codes</span></NavLink><NavLink to="/business-cards"><ContactRound size={19} /><span>Cartes</span></NavLink></nav>
    </div>
  );
}
