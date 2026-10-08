import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
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
  KeyRound,
} from 'lucide-react';
import { ContactRound, Contact } from 'lucide-react';

const navGroups = [
  { label: 'Créer & partager', items: [
    { to: '/links', icon: LinkIcon, label: 'Liens courts' },
    { to: '/qr-codes', icon: QrCode, label: 'QR Codes' },
    { to: '/business-cards', icon: ContactRound, label: 'Cartes de visite' },
    { to: '/digital-cards', icon: Contact, label: 'Cartes numériques' },
  ] },
  { label: 'Mesurer', items: [
    { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  ] },
  { label: 'Utilitaires locaux', items: [
    { to: '/passwords', icon: KeyRound, label: 'Mots de passe' },
  ] },
];

const overviewItem = { to: '/dashboard', icon: LayoutDashboard, label: 'Vue d’ensemble' };

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
  const location = useLocation();
  const asideRef = useRef<HTMLElement>(null);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);
  const mainNavRef = useRef<HTMLDivElement>(null);
  const bottomNavRef = useRef<HTMLElement>(null);
  const [navRails, setNavRails] = useState([{ top: 0, height: 0 }, { top: 0, height: 0 }]);
  const { data: subscription } = useSubscription();
  const { data: usage } = useUsage();

  const currentPlanName = planNames[subscription?.tier || 'free'] || 'Plan Gratuit';
  const linksUsed = usage?.links.used || 0;
  const linksLimit = usage?.links.limit === -1 ? '∞' : usage?.links.limit || 0;

  useEffect(() => {
    const media = window.matchMedia('(max-width: 1023px)');
    const update = () => { setIsMobile(media.matches); if (media.matches) closeSidebar(); };
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [closeSidebar]);

  useEffect(() => {
    const aside = asideRef.current;
    if (!aside) return;
    aside.inert = isMobile && !sidebarOpen;
    if (!isMobile || !sidebarOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    const main = document.querySelector<HTMLElement>('.wrx-app main');
    const dock = document.querySelector<HTMLElement>('.mobile-tool-dock');
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    if (main) main.inert = true;
    if (dock) dock.inert = true;
    aside.querySelector<HTMLButtonElement>('button')?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeSidebar();
      if (event.key !== 'Tab') return;
      const nodes = Array.from(aside.querySelectorAll<HTMLElement>('a[href],button:not(:disabled)')).filter(node => node.offsetParent !== null);
      const first = nodes[0]; const last = nodes.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = overflow;
      if (main) main.inert = false;
      if (dock) dock.inert = false;
      document.removeEventListener('keydown', onKey);
      previous?.focus();
    };
  }, [isMobile, sidebarOpen, closeSidebar]);

  useLayoutEffect(() => {
    const updateRails = () => {
      setNavRails([mainNavRef.current, bottomNavRef.current].map((nav) => {
        const active = nav?.querySelector<HTMLElement>('a[aria-current="page"]');
        return { top: active?.offsetTop ?? 0, height: active?.offsetHeight ?? 0 };
      }));
    };
    updateRails();
    window.addEventListener('resize', updateRails);
    return () => window.removeEventListener('resize', updateRails);
  }, [location.pathname, sidebarOpen]);

  return (
    <aside
      ref={asideRef}
      id="studio-navigation"
      aria-label="Navigation de l’espace"
      aria-hidden={isMobile && !sidebarOpen ? true : undefined}
      className={`studio-sidebar ${sidebarOpen ? 'is-expanded' : 'is-collapsed'} fixed left-0 top-16 z-40 h-[calc(100dvh-4rem)] transition-[width,transform] duration-200 ${sidebarOpen ? 'w-64 translate-x-0' : '-translate-x-full lg:w-16 lg:translate-x-0'} `}
    >
      {/* Mobile close button */}
      <button
        onClick={closeSidebar}
        aria-label="Fermer la navigation"
        className="absolute right-2 top-2 rounded-lg p-2 hover:bg-gray-100 lg:hidden"
      >
        <X size={20} />
      </button>

      <div className="flex h-full flex-col py-4 pt-12 lg:pt-4">
        {/* Navigation principale */}
        <div ref={mainNavRef} className="relative flex-1 space-y-3 overflow-y-auto px-2">
          <span aria-hidden="true" className="wrx-nav-rail" style={{ height: navRails[0]?.height, transform: `translateY(${navRails[0]?.top}px)`, opacity: navRails[0]?.height ? 1 : 0 }} />
          <NavLink to={overviewItem.to} aria-label={overviewItem.label} title={overviewItem.label} onClick={() => window.innerWidth < 1024 && closeSidebar()} className={({ isActive }) => `wrx-nav-link relative flex items-center gap-3 rounded-lg px-3 py-2.5 ${isActive ? 'font-medium' : ''} ${!sidebarOpen ? 'lg:justify-center' : ''}`}>
            <overviewItem.icon size={20} className="flex-shrink-0" />
            <span className={`${!sidebarOpen ? 'lg:hidden' : ''}`}>{overviewItem.label}</span>
          </NavLink>
          {navGroups.map((group) => <section className="sidebar-nav-group" key={group.label} aria-label={group.label}>
            {sidebarOpen && <p className="sidebar-group-label eyebrow">{group.label}</p>}
            <div className="space-y-1">
              {group.items.map((item) => <NavLink key={item.to} to={item.to} aria-label={item.label} title={item.label} onClick={() => window.innerWidth < 1024 && closeSidebar()} className={({ isActive }) => `wrx-nav-link relative flex items-center gap-3 rounded-lg px-3 py-2.5 ${isActive ? 'font-medium' : ''} ${!sidebarOpen ? 'lg:justify-center' : ''}`}>
                <item.icon size={20} className="flex-shrink-0" />
                <span className={`${!sidebarOpen ? 'lg:hidden' : ''}`}>{item.label}</span>
              </NavLink>)}
            </div>
          </section>)}
        </div>

        {/* Séparateur */}
        <div className="mx-4 my-4 border-t border-slate-200"></div>

        {/* Navigation secondaire */}
        <nav ref={bottomNavRef} className="relative space-y-1 px-2">
          <span aria-hidden="true" className="wrx-nav-rail" style={{ height: navRails[1]?.height, transform: `translateY(${navRails[1]?.top}px)`, opacity: navRails[1]?.height ? 1 : 0 }} />
          {bottomItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => window.innerWidth < 1024 && closeSidebar()}
              className={({ isActive }) =>
                `wrx-nav-link relative flex items-center gap-3 rounded-lg px-3 py-2.5 ${
                  isActive
                    ? 'bg-cyan-50 font-medium text-cyan-900'
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
          className={`sidebar-plan mx-4 mt-4 p-4 ${!sidebarOpen ? 'lg:hidden' : ''}`}
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
