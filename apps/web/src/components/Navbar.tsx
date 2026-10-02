import { Link } from 'react-router-dom';
import { useUIStore } from '../stores/ui.store';
import { useLogout } from '../hooks/useAuth';
import { Menu, User, Settings, LogOut, Bell, Search } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../stores/auth.store';

export function Navbar() {
  const { toggleSidebar } = useUIStore();
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
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-3 sm:px-4">
        {/* Logo et toggle sidebar */}
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={toggleSidebar}
            className="rounded-xl p-2 transition-colors hover:bg-slate-100"
            aria-label="Menu"
          >
            <Menu size={20} />
          </button>
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-md shadow-cyan-500/20">
              <span className="text-sm font-bold text-white">W</span>
            </div>
            <span className="hidden text-lg font-semibold tracking-tight text-slate-950 sm:inline">
              WRX Generator
            </span>
          </Link>
        </div>

        {/* Barre de recherche - Hidden on mobile */}
        <div className="mx-4 hidden max-w-md flex-1 lg:flex">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Rechercher..."
              className="focus:ring-primary-500 w-full rounded-xl border-0 bg-slate-100 py-2 pl-10 pr-4 transition-colors focus:bg-white focus:ring-2"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Search button for mobile */}
          <button className="rounded-xl p-2 transition-colors hover:bg-slate-100 lg:hidden">
            <Search size={20} className="text-gray-600" />
          </button>

          {/* Notifications */}
          <button className="relative rounded-xl p-2 transition-colors hover:bg-slate-100">
            <Bell size={20} className="text-gray-600" />
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500"></span>
          </button>

          {/* Menu profil */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 rounded-xl p-2 transition-colors hover:bg-slate-100"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-50">
                <User size={18} className="text-primary-600" />
              </div>
            </button>

            {/* Dropdown */}
            {isProfileOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-slate-200 bg-white py-2 shadow-xl shadow-slate-900/10">
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
