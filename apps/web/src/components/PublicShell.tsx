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
      'rounded-md px-3 py-1.5 text-[13.5px] transition-colors hover:text-fg',
      isActive ? 'text-fg' : 'text-muted',
    );
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b border-line/60 bg-bg/75 backdrop-blur-xl backdrop-saturate-150">
        <div className="mx-auto flex h-14 max-w-[1200px] items-center gap-2 px-4 sm:px-8">
          <Link to="/" aria-label="WRX home">
            <Logo />
          </Link>
          <nav className="ml-4 hidden items-center sm:flex" aria-label={t('Main')}>
            <NavLink to="/discover" className={link}>
              {t('Discover')}
            </NavLink>
            <a
              href="/api/v1/docs"
              className="rounded-md px-3 py-1.5 text-[13.5px] text-muted transition-colors hover:text-fg"
            >
              {t('API')}
            </a>
          </nav>
          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
              className="grid h-8 place-items-center rounded-md px-2 text-[12px] font-medium text-muted hover:bg-raised"
              aria-label={t('Change language')}
            >
              {lang === 'fr' ? 'EN' : 'FR'}
            </button>
            <button
              onClick={() => setDark(toggleTheme())}
              className="grid size-8 place-items-center rounded-md text-muted hover:bg-raised"
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
                  className="hidden px-3 text-[13.5px] text-muted hover:text-fg sm:block"
                >
                  {t('Sign in')}
                </Link>
                <Button size="sm" loading={demo.isPending} onClick={() => demo.mutate()}>
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
      <footer className="border-t border-line bg-surface">
        <div className="mx-auto grid max-w-[1200px] gap-10 px-4 py-14 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="grid content-start gap-4">
            <Logo className="text-[17px]" />
            <p className="max-w-[34ch] text-[13px] leading-relaxed text-muted">
              {t('Built by Imrane Adli on Cloudflare Workers.')}
            </p>
          </div>
          {[
            { h: t('Product'), items: [[t('Smart routing'), '/#features'], [t('QR codes'), '/#features'], [t('Analytics'), '/#features']] },
            { h: t('Connect'), items: [[t('Discover'), '/discover'], [t('People'), '/discover?kind=person'], [t('Startups'), '/discover?kind=startup']] },
            { h: t('Developers'), items: [[t('API reference'), '/api/v1/docs'], [t('Source code'), 'https://github.com/ADLI-Imrane/wrx-generator-v2']] },
          ].map((col) => (
            <div key={col.h} className="grid content-start gap-2.5">
              <p className="text-[12.5px] font-medium text-fg">{col.h}</p>
              {col.items.map(([label, href]) => (
                <a key={label} href={href} className="text-[13px] text-muted transition-colors hover:text-fg">
                  {label}
                </a>
              ))}
            </div>
          ))}
        </div>
        <div className="mx-auto flex max-w-[1200px] items-center justify-between border-t border-line px-4 py-5 text-[12px] text-faint sm:px-8">
          <span>© {new Date().getFullYear()} WRX</span>
          <a href="https://github.com/ADLI-Imrane/wrx-generator-v2" className="hover:text-fg">{t('Open source on GitHub')}</a>
        </div>
      </footer>
    </div>
  );
}
