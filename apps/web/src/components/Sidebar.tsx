import { NavLink } from 'react-router-dom';
import { useUIStore } from '../stores/ui.store';
import {
  LayoutDashboard,
  Link as LinkIcon,
  QrCode,
  BarChart3,
  Settings,
  HelpCircle,
  CreditCard,
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

export function Sidebar() {
  const { sidebarOpen } = useUIStore();

  return (
    <aside
      className={`fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] border-r border-gray-200 bg-white transition-all duration-300 ${
        sidebarOpen ? 'w-64' : 'w-16'
      }`}
    >
      <div className="flex h-full flex-col py-4">
        {/* Navigation principale */}
        <nav className="flex-1 space-y-1 px-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                } ${!sidebarOpen ? 'justify-center' : ''}`
              }
            >
              <item.icon size={20} className="flex-shrink-0" />
              {sidebarOpen && <span>{item.label}</span>}
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
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                } ${!sidebarOpen ? 'justify-center' : ''}`
              }
            >
              <item.icon size={20} className="flex-shrink-0" />
              {sidebarOpen && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Plan info */}
        {sidebarOpen && (
          <div className="from-primary-50 to-accent-50 mx-4 mt-4 rounded-lg bg-gradient-to-br p-4">
            <p className="text-sm font-medium text-gray-900">Plan Gratuit</p>
            <p className="mt-1 text-xs text-gray-600">10/50 liens utilisés</p>
            <button className="text-primary-600 hover:text-primary-700 mt-3 w-full text-sm font-medium transition-colors">
              Mettre à niveau →
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
