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
          'flex h-8 items-center gap-2.5 rounded-[7px] px-2 text-[13.5px] transition-colors [&>svg]:size-4 [&>svg]:shrink-0',
          isActive
            ? 'bg-surface font-medium text-fg shadow-[0_0_0_1px_var(--line),0_1px_2px_rgb(0_0_0/.05)] [&>svg]:text-accent'
            : 'text-muted hover:bg-raised hover:text-fg',
        )
      }
    >
      {icon}
      <span className="flex-1">{label}</span>
      {!!badge && (
        <span className="grid h-[18px] min-w-[18px] place-items-center rounded-full bg-accent px-1.5 text-[10.5px] font-semibold text-white dark:text-[#0a0a0b]">
          {badge}
        </span>
      )}
    </NavLink>
  );

  const sidebar = (
    <nav aria-label={t('Main')} className="flex h-full flex-col gap-5 px-3 py-4">
      <div className="flex items-center justify-between px-2">
        <NavLink to="/app"><Logo /></NavLink>
        <span className="grid size-6 place-items-center rounded-full bg-raised text-[10.5px] font-semibold text-muted ring-1 ring-line" title={me.data.email}>
          {(me.data.name || me.data.email).slice(0, 2).toUpperCase()}
        </span>
      </div>
      <button
        onClick={() => setPalette(true)}
        className="flex h-8 items-center gap-2 rounded-[7px] border border-line bg-surface px-2.5 text-[13px] text-faint transition-colors hover:border-line-strong hover:text-muted"
      >
        <Search className="size-3.5" /> <span className="flex-1 truncate text-left">{t('Search')}</span>
        <Kbd>⌘K</Kbd>
      </button>
      <div className="grid gap-px">
        {item('/app', <BarChart3 />, t('Overview'))}
        {item('/app/links', <Link2/>, t('Links'))}
        {item('/app/qr', <QrCode/>, t('QR codes'))}
      </div>
      <div className="grid gap-px">
        <span className="px-2 pb-1.5 text-[11.5px] font-medium text-faint">{t('Connect')}</span>
        {item('/app/profile', <IdCard/>, t('Profile & card'))}
        {item('/app/opportunities', <Briefcase/>, t('Opportunities'))}
        {item('/app/inbox', <Inbox/>, t('Inbox'), unread)}
        {item('/discover', <Compass/>, t('Discover'))}
      </div>
      <div className="mt-auto grid gap-px">
        {item('/app/settings', <Settings/>, t('Settings'))}
        <div className="flex items-center gap-1 px-1 pt-2">
          <button
            onClick={() => setDark(toggleTheme())}
            className="grid size-8 place-items-center rounded-md text-muted hover:bg-raised hover:text-fg"
            aria-label={dark ? t('Light mode') : t('Dark mode')}
          >
            {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
          <button
            onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
            className="grid h-8 place-items-center rounded-md px-2 text-[12px] font-medium text-muted hover:bg-raised hover:text-fg"
            aria-label={t('Change language')}
          >
            {lang === 'fr' ? 'EN' : 'FR'}
          </button>
          <button
            onClick={logout}
            className="ml-auto flex h-8 items-center gap-2 rounded-md px-2 text-[12.5px] text-muted hover:bg-raised hover:text-fg"
          >
            <LogOut className="size-4" />
            {t('Sign out')}
          </button>
        </div>
              </div>
    </nav>
  );

  return (
    <div className="min-h-dvh bg-bg lg:grid lg:grid-cols-[236px_1fr]">
      <aside className="sticky top-0 hidden h-dvh lg:block">{sidebar}</aside>
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
      <div className="min-w-0 lg:my-2 lg:mr-2 lg:h-[calc(100dvh-16px)] lg:overflow-y-auto lg:rounded-[14px] lg:border lg:border-line lg:bg-surface lg:shadow-[0_1px_2px_rgb(0_0_0/.03)]" id="app-scroll">
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
          <div className="flex items-center justify-center gap-2 border-b border-line px-4 py-2 text-center text-[12.5px] text-muted">
            <span className="size-1.5 animate-pulse rounded-full bg-signal" aria-hidden />
            {t('You are exploring the demo workspace with sample data. It resets every night.')}{' '}
            <NavLink to="/register" className="font-medium text-fg underline decoration-line-strong underline-offset-4 hover:decoration-fg">
              {t('Create your own account')}
            </NavLink>
          </div>
        )}
        <main className="mx-auto w-full max-w-[1160px] px-4 py-6 sm:px-10 sm:py-10">
          <Outlet />
        </main>
      </div>
      <CommandPalette open={palette} onClose={() => setPalette(false)} />
    </div>
  );
}
