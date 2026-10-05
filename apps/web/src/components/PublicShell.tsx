import { Link, NavLink, Outlet } from 'react-router';
import { useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { useMe } from '@/hooks/queries';
import { toggleTheme, isDark } from '@/lib/theme';
import { Logo } from './Logo';
import { Button, cx } from './ui';
import { useDemoLogin } from '@/hooks/useDemoLogin';

export function PublicShell() {
  const { t, lang, setLang } = useT();
  const me = useMe();
  const demo = useDemoLogin();
  const [dark, setDark] = useState(isDark);
  const link = ({ isActive }: { isActive: boolean }) =>
    cx(
      'rounded-lg px-3 py-2 text-[14px] font-medium transition hover:text-fg',
      isActive ? 'text-fg' : 'text-muted',
    );
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b border-line/70 bg-bg/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-2 px-4 sm:px-8">
          <Link to="/" aria-label="WRX home">
            <Logo />
          </Link>
          <nav className="ml-4 hidden items-center sm:flex" aria-label={t('Main')}>
            <NavLink to="/discover" className={link}>
              {t('Discover')}
            </NavLink>
            <a
              href="/api/v1/docs"
              className="rounded-lg px-3 py-2 text-[14px] font-medium text-muted hover:text-fg"
            >
              {t('API')}
            </a>
          </nav>
          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
              className="grid h-9 place-items-center rounded-lg px-2 text-[12.5px] font-semibold text-muted hover:bg-raised"
              aria-label={t('Change language')}
            >
              {lang === 'fr' ? 'EN' : 'FR'}
            </button>
            <button
              onClick={() => setDark(toggleTheme())}
              className="grid size-9 place-items-center rounded-lg text-muted hover:bg-raised"
              aria-label={dark ? t('Light mode') : t('Dark mode')}
            >
              {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
            {me.data ? (
              <Link to="/app">
                <Button size="sm">{t('Open dashboard')}</Button>
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden px-3 text-[14px] font-medium text-muted hover:text-fg sm:block"
                >
                  {t('Sign in')}
                </Link>
                <Button size="sm" variant="signal" loading={demo.isPending} onClick={() => demo.mutate()}>
                  {t('Try the demo')}
                </Button>
              </>
            )}
          </div>
        </div>
      </header>
      <div className="flex-1">
        <Outlet />
      </div>
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4 px-4 py-8 text-[13px] text-muted sm:px-8">
          <Logo className="text-[16px]" />
          <p>
            {t('Built by Imrane Adli on Cloudflare Workers.')}{' '}
            <a
              className="underline underline-offset-2 hover:text-fg"
              href="https://github.com/ADLI-Imrane/wrx-generator-v2"
            >
              {t('Source code')}
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
