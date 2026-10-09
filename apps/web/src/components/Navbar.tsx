import { Link, useLocation } from 'react-router-dom';
import { useUIStore } from '../stores/ui.store';
import { useLogout } from '../hooks/useAuth';
import { Menu, User, Settings, LogOut, ArrowUpRight } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../stores/auth.store';
import { BrandLogo } from './BrandLogo';
import type { WorkspaceNavigationMode } from '../lib/workspace-preferences';
import { WorkspaceDock } from './WorkspaceDock';

export function Navbar({ navigationMode, onOpenLauncher }: { navigationMode: WorkspaceNavigationMode; onOpenLauncher: () => void }) {
  const { toggleSidebar, sidebarOpen } = useUIStore();
  const location = useLocation();
  const { user, profile } = useAuthStore();
  const { mutate: logout, isPending: isLoggingOut } = useLogout();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Fermer le menu profil si on clique ailleurs
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="studio-navbar sticky top-0 z-50">
      <div className={`studio-navbar-inner flex h-16 items-center justify-between px-3 sm:px-4${navigationMode === 'dock' ? ' has-workspace-dock' : ''}`}>
        {/* Logo et toggle sidebar */}
        <div className="studio-navbar-left flex min-w-0 items-center gap-2 sm:gap-4">
          <button
            onClick={navigationMode === 'sidebar' ? toggleSidebar : onOpenLauncher}
            className="rounded-xl p-2 transition-colors hover:bg-slate-100"
            aria-label={navigationMode === 'sidebar' ? 'Ouvrir ou réduire la navigation latérale' : 'Ouvrir le lanceur d’outils'}
            aria-expanded={navigationMode === 'sidebar' ? sidebarOpen : undefined}
            aria-controls={navigationMode === 'sidebar' ? 'studio-navigation' : 'workspace-launcher'}
          >
            <Menu size={20} />
          </button>
          <Link to="/dashboard" className="brand-lockup" aria-label="WRX Generator — Vue d’ensemble">
            <BrandLogo size="compact" alt="" />
            <span>WRX<small>GENERATOR / V2</small></span>
          </Link>
          <div className="workspace-trail"><span>Espace personnel</span><span>/</span><strong>{location.pathname.startsWith('/qr-codes') ? 'QR Codes' : location.pathname.startsWith('/links') ? 'Liens courts' : location.pathname.startsWith('/business-cards') ? 'Cartes de visite' : location.pathname.startsWith('/digital-cards') ? 'Cartes numériques' : location.pathname === '/analytics' ? 'Analytics' : location.pathname === '/passwords' ? 'Mots de passe' : location.pathname === '/billing' ? 'Facturation' : location.pathname.startsWith('/settings') ? 'Paramètres' : location.pathname === '/help' ? 'Aide' : 'Vue d’ensemble'}</strong></div>
        </div>

        {navigationMode === 'dock' && <WorkspaceDock />}

        {/* Actions */}
        <div className="studio-navbar-actions flex items-center justify-self-end gap-1 sm:gap-2">
          <Link to="/" className="navbar-public">Découvrir WRX <ArrowUpRight size={14} /></Link>

          {/* Menu profil */}
          <div className="relative" ref={profileRef} onKeyDown={(event) => { if (event.key === 'Escape') { setIsProfileOpen(false); profileRef.current?.querySelector<HTMLButtonElement>('button')?.focus(); } }}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              aria-label="Menu du compte"
              aria-expanded={isProfileOpen}
              onKeyDown={(event) => { if (event.key === 'Escape') setIsProfileOpen(false); }}
              className="flex items-center gap-2 rounded-xl p-2 transition-colors hover:bg-slate-100"
            >
              <div className="navbar-account-mark flex h-8 w-8 items-center justify-center rounded-full">
                <User size={18} className="text-primary-600" />
              </div>
            </button>

            {/* Dropdown */}
            {isProfileOpen && (
              <div className="wrx-profile-panel absolute right-0 top-full mt-2 w-56 rounded-2xl border border-slate-200 bg-white py-2 shadow-xl shadow-slate-900/10">
                <div className="border-b border-gray-100 px-4 py-2">
                  <p className="font-medium text-slate-900">{profile?.fullName || 'Mon compte'}</p>
                  <p className="truncate text-sm text-slate-500">{user?.email || ''}</p>
                </div>
                <nav className="py-2">
                  <Link
                    to="/settings"
                    className="flex items-center gap-3 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <Settings size={18} />
                    <span>Paramètres</span>
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setIsProfileOpen(false);
                    }}
                    disabled={isLoggingOut}
                    className="flex w-full items-center gap-3 px-4 py-2 text-left text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                  >
                    <LogOut size={18} />
                    <span>{isLoggingOut ? 'Déconnexion...' : 'Se déconnecter'}</span>
                  </button>
                </nav>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
