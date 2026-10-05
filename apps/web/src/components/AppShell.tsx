import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import {
  BarChart3,
  Compass,
  Inbox,
  Link2,
  LogOut,
  Menu,
  Moon,
  QrCode,
  Search,
  Settings,
  Sun,
  Briefcase,
  IdCard,
} from 'lucide-react';
import { useT } from '@/lib/i18n';
import { api } from '@/lib/api';
import { toggleTheme, isDark } from '@/lib/theme';
import { useInbox, useMe } from '@/hooks/queries';
import { Logo } from './Logo';
import { CommandPalette } from './CommandPalette';
import { cx, Kbd, ModuleLoader } from './ui';

export function AppShell() {
  const { t, lang, setLang } = useT();
  const me = useMe();
  const nav = useNavigate();
  const loc = useLocation();
  const qc = useQueryClient();
  const inbox = useInbox();
  const [open, setOpen] = useState(false);
  const [palette, setPalette] = useState(false);
  const [dark, setDark] = useState(isDark);

  useEffect(() => setOpen(false), [loc.pathname]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPalette((p) => !p);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  useEffect(() => {
    if (me.isFetched && !me.data) nav(`/login?next=${encodeURIComponent(loc.pathname)}`, { replace: true });
  }, [me.isFetched, me.data, nav, loc.pathname]);

  if (!me.data) return <ModuleLoader className="min-h-dvh" />;
  const unread = inbox.data?.counts.new ?? 0;

  const logout = async () => {
    await api('/auth/logout', { method: 'POST' });
    qc.clear();
    nav('/');
  };
  const item = (to: string, icon: React.ReactNode, label: string, badge?: number) => (
    <NavLink
      to={to}
      end={to === '/app'}
      className={({ isActive }) =>
        cx(
          'flex h-10 items-center gap-3 rounded-[10px] px-3 text-[14px] font-medium transition',
          isActive
            ? 'bg-ink text-white dark:bg-accent-soft dark:text-fg'
            : 'text-muted hover:bg-raised hover:text-fg',
        )
      }
    >
      {icon}
      <span className="flex-1">{label}</span>
      {!!badge && (
        <span className="grid h-5 min-w-5 place-items-center rounded-full bg-signal px-1.5 text-[11px] font-semibold text-ink">
          {badge}
        </span>
      )}
    </NavLink>
  );

  const sidebar = (
    <nav aria-label={t('Main')} className="flex h-full flex-col gap-6 p-4">
      <NavLink to="/app" className="px-2 pt-1">
        <Logo />
      </NavLink>
      <button
        onClick={() => setPalette(true)}
        className="flex h-10 items-center gap-2 rounded-[10px] border border-line bg-surface px-3 text-[13.5px] text-faint transition hover:border-faint"
      >
        <Search className="size-4" /> <span className="flex-1 text-left">{t('Search or jump to…')}</span>
        <Kbd>⌘K</Kbd>
      </button>
      <div className="grid gap-1">
        {item('/app', <BarChart3 className="size-[18px]" />, t('Overview'))}
        {item('/app/links', <Link2 className="size-[18px]" />, t('Links'))}
        {item('/app/qr', <QrCode className="size-[18px]" />, t('QR codes'))}
      </div>
      <div className="grid gap-1">
        <span className="px-3 text-[12px] font-medium text-faint">{t('Connect')}</span>
        {item('/app/profile', <IdCard className="size-[18px]" />, t('Profile & card'))}
        {item('/app/opportunities', <Briefcase className="size-[18px]" />, t('Opportunities'))}
        {item('/app/inbox', <Inbox className="size-[18px]" />, t('Inbox'), unread)}
        {item('/discover', <Compass className="size-[18px]" />, t('Discover'))}
      </div>
      <div className="mt-auto grid gap-1">
        {item('/app/settings', <Settings className="size-[18px]" />, t('Settings'))}
        <div className="flex items-center gap-1 px-1 pt-2">
          <button
            onClick={() => setDark(toggleTheme())}
            className="grid size-9 place-items-center rounded-lg text-muted hover:bg-raised hover:text-fg"
            aria-label={dark ? t('Light mode') : t('Dark mode')}
          >
            {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
          <button
            onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
            className="grid h-9 place-items-center rounded-lg px-2 text-[12.5px] font-semibold text-muted hover:bg-raised hover:text-fg"
            aria-label={t('Change language')}
          >
            {lang === 'fr' ? 'EN' : 'FR'}
          </button>
          <button
            onClick={logout}
            className="ml-auto flex h-9 items-center gap-2 rounded-lg px-2 text-[13px] text-muted hover:bg-raised hover:text-fg"
          >
            <LogOut className="size-4" />
            {t('Sign out')}
          </button>
        </div>
        <div className="truncate px-3 text-[12px] text-faint">{me.data.email}</div>
      </div>
    </nav>
  );

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="sticky top-0 hidden h-dvh border-r border-line bg-bg lg:block">{sidebar}</aside>
      <div
        className={cx('fixed inset-0 z-40 bg-ink/40 lg:hidden', open ? 'block' : 'hidden')}
        onClick={() => setOpen(false)}
      />
      <aside
        className={cx(
          'fixed inset-y-0 left-0 z-50 w-[280px] border-r border-line bg-bg transition-transform duration-300 lg:hidden',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {sidebar}
      </aside>
      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-bg/85 px-4 backdrop-blur lg:hidden">
          <button
            onClick={() => setOpen(true)}
            className="grid size-9 place-items-center rounded-lg hover:bg-raised"
            aria-label={t('Open menu')}
          >
            <Menu className="size-5" />
          </button>
          <Logo />
          <button
            onClick={() => setPalette(true)}
            className="grid size-9 place-items-center rounded-lg hover:bg-raised"
            aria-label={t('Search')}
          >
            <Search className="size-5" />
          </button>
        </header>
        {me.data.isDemo && (
          <div className="border-b border-line bg-signal/15 px-4 py-2 text-center text-[13px]">
            {t('You are exploring the demo workspace with sample data. It resets every night.')}{' '}
            <NavLink to="/register" className="font-semibold underline underline-offset-2">
              {t('Create your own account')}
            </NavLink>
          </div>
        )}
        <main className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-8 sm:py-10">
          <Outlet />
        </main>
      </div>
      <CommandPalette open={palette} onClose={() => setPalette(false)} />
    </div>
  );
}
