import { NavLink, useNavigate } from 'react-router-dom';
import { useUIStore } from '../stores/ui.store';
import { useSubscription, useUsage } from '../hooks/useBilling';
import {
  LayoutDashboard,
  Link as LinkIcon,
  QrCode,
  BarChart3,
  Settings,
  HelpCircle,
  CreditCard,
  X,
} from 'lucide-react';
import { ContactRound } from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/links', icon: LinkIcon, label: 'Liens' },
  { to: '/qr-codes', icon: QrCode, label: 'QR Codes' },
  { to: '/business-cards', icon: ContactRound, label: 'Cartes de visite' },
  { to: '/analytics', icon: BarChart3, label: 'Analytiques' },
];

const bottomItems = [
  { to: '/billing', icon: CreditCard, label: 'Facturation' },
  { to: '/settings', icon: Settings, label: 'Paramètres' },
  { to: '/help', icon: HelpCircle, label: 'Aide' },
];

const planNames: Record<string, string> = {
  free: 'Plan Gratuit',
  pro: 'Plan Pro',
  business: 'Plan Business',
};

export function Sidebar() {
  const { sidebarOpen, closeSidebar } = useUIStore();
  const navigate = useNavigate();
  const { data: subscription } = useSubscription();
  const { data: usage } = useUsage();

  const currentPlanName = planNames[subscription?.tier || 'free'] || 'Plan Gratuit';
  const linksUsed = usage?.links.used || 0;
  const linksLimit = usage?.links.limit === -1 ? '∞' : usage?.links.limit || 0;

  return (
    <aside
      className={`fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] border-r border-slate-200/80 bg-white/85 backdrop-blur-xl transition-all duration-300 ${sidebarOpen ? 'w-64 translate-x-0' : '-translate-x-full lg:w-16 lg:translate-x-0'} `}
    >
      {/* Mobile close button */}
      <button
        onClick={closeSidebar}
        className="absolute right-2 top-2 rounded-lg p-2 hover:bg-gray-100 lg:hidden"
      >
        <X size={20} />
      </button>

      <div className="flex h-full flex-col py-4 pt-12 lg:pt-4">
        {/* Navigation principale */}
        <nav className="flex-1 space-y-1 px-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => window.innerWidth < 1024 && closeSidebar()}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
                  isActive
                    ? 'text-primary-700 bg-gradient-to-r from-cyan-50 to-blue-50 font-medium shadow-sm'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-950'
                } ${!sidebarOpen ? 'lg:justify-center' : ''}`
              }
            >
              <item.icon size={20} className="flex-shrink-0" />
              <span className={`${!sidebarOpen ? 'lg:hidden' : ''}`}>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Séparateur */}
        <div className="mx-4 my-4 border-t border-slate-200"></div>

        {/* Navigation secondaire */}
        <nav className="space-y-1 px-2">
          {bottomItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => window.innerWidth < 1024 && closeSidebar()}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
                  isActive
                    ? 'text-primary-700 bg-gradient-to-r from-cyan-50 to-blue-50 font-medium shadow-sm'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-950'
                } ${!sidebarOpen ? 'lg:justify-center' : ''}`
              }
            >
              <item.icon size={20} className="flex-shrink-0" />
              <span className={`${!sidebarOpen ? 'lg:hidden' : ''}`}>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Plan info */}
        <div
          className={`mx-4 mt-4 rounded-2xl border border-cyan-100 bg-gradient-to-br from-cyan-50 to-blue-50 p-4 ${!sidebarOpen ? 'lg:hidden' : ''}`}
        >
          <p className="text-sm font-medium text-gray-900">{currentPlanName}</p>
          <p className="mt-1 text-xs text-gray-600">
            {linksUsed}/{linksLimit} liens utilisés
          </p>
          {subscription?.tier === 'free' && (
            <button
              onClick={() => navigate('/billing')}
              className="text-primary-600 hover:text-primary-700 mt-3 w-full text-sm font-medium transition-colors"
            >
              Mettre à niveau →
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
