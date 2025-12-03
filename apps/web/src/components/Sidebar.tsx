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

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/links', icon: LinkIcon, label: 'Liens' },
  { to: '/qr-codes', icon: QrCode, label: 'QR Codes' },
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
      className={`fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] border-r border-gray-200 bg-white transition-all duration-300 ${sidebarOpen ? 'w-64 translate-x-0' : '-translate-x-full lg:w-16 lg:translate-x-0'} `}
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
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                } ${!sidebarOpen ? 'lg:justify-center' : ''}`
              }
            >
              <item.icon size={20} className="flex-shrink-0" />
              <span className={`${!sidebarOpen ? 'lg:hidden' : ''}`}>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Séparateur */}
        <div className="mx-4 my-4 border-t border-gray-200"></div>

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
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
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
          className={`from-primary-50 to-accent-50 mx-4 mt-4 rounded-lg bg-gradient-to-br p-4 ${!sidebarOpen ? 'lg:hidden' : ''}`}
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
