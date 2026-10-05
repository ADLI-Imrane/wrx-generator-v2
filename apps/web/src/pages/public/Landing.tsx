import { useState } from 'react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { Apple, Globe2, Smartphone, Split, MapPin, Lock, Timer, Download } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { api } from '@/lib/api';
import { nf } from '@/lib/format';
import { AssemblingQr } from '@/components/AssemblingQr';
import { Button, Badge } from '@/components/ui';
import { useDemoLogin } from '@/hooks/useDemoLogin';
import { useDiscover } from '@/hooks/queries';
import { ProfileTile } from '@/pages/public/Discover';

export default function Landing() {
  const { t, lang } = useT();
  const demo = useDemoLogin();
  const [url, setUrl] = useState('https://imrane-adli.pages.dev');
  const [debounced, setDebounced] = useState(url);
  const stats = useQuery({
    queryKey: ['stats'],
    queryFn: () =>
      api<{ links: number; clicks: number; profiles: number; opportunities: number }>('/public/stats'),
  });
  const people = useDiscover({});
  const slug = (
    'wrx' + Math.abs([...debounced].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7)).toString(36)
  ).slice(0, 7);

  return (
    <main>
      {/* Hero: the product, working, before any claim about it. */}
      <section className="mx-auto grid max-w-[1200px] items-center gap-12 px-4 pb-20 pt-14 sm:px-8 lg:grid-cols-[1.1fr_.9fr] lg:pt-20">
        <div className="grid gap-7">
          <h1 className="text-[44px] font-bold leading-[1.02] sm:text-[64px]">
            {t('Short links that know who is clicking.')}
          </h1>
          <p className="max-w-[56ch] text-[17px] text-muted">
            {t(
              'WRX shortens your links, turns them into designed QR codes, sends each visitor to the right page for their phone or country, and shows you every click as it happens. Your profile doubles as a business card that collects introductions.',
            )}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" variant="signal" loading={demo.isPending} onClick={() => demo.mutate()}>
              {t('Explore the live demo')}
            </Button>
            <Link to="/register">
              <Button size="lg" variant="secondary">
                {t('Create a free account')}
              </Button>
            </Link>
          </div>
          {!!stats.data?.links && (
            <p className="text-[13.5px] text-faint tabular">
              {t('{links} links created, {clicks} clicks routed and {profiles} public profiles so far.', {
                links: nf(stats.data.links, lang),
                clicks: nf(stats.data.clicks, lang),
                profiles: nf(stats.data.profiles, lang),
              })}
            </p>
          )}
        </div>

        <div className="relative grid justify-items-center gap-5 rounded-[28px] border border-line bg-surface p-6 shadow-[var(--shadow-lift)] sm:p-8">
          <label className="grid w-full gap-1.5">
            <span className="text-[13px] font-medium">{t('Paste any link')}</span>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onBlur={() => setDebounced(url)}
              onKeyDown={(e) => e.key === 'Enter' && setDebounced(url)}
              className="h-11 w-full rounded-[10px] border border-line bg-bg px-3 font-mono text-[13px] outline-none focus:border-accent"
              spellCheck={false}
            />
          </label>
          <div className="rounded-3xl bg-paper p-4 dark:bg-white">
            <AssemblingQr text={debounced} size={232} />
          </div>
          <div className="flex w-full items-center justify-between gap-3 rounded-[12px] bg-raised px-4 py-3">
            <span className="truncate font-mono text-[14px]">
              <span className="text-faint">wrx.app/</span>
              <span className="font-semibold">{slug}</span>
            </span>
            <Badge tone="signal">{t('Preview')}</Badge>
          </div>
          <p className="text-center text-[12.5px] text-faint">
            {t('This QR code is real — scan it. Sign up to keep the short link and its analytics.')}
          </p>
        </div>
      </section>

      {/* Routing: drawn as an actual route, because that is what the feature is. */}
      <section className="border-y border-line bg-surface">
        <div className="mx-auto grid max-w-[1200px] gap-10 px-4 py-20 sm:px-8 lg:grid-cols-[.8fr_1.2fr]">
          <div className="grid content-start gap-4">
            <h2 className="text-[34px] font-semibold">
              {t('One link, the right destination for everyone.')}
            </h2>
            <p className="text-muted">
              {t(
                'Rules run at the edge, in more than 300 cities, before the page even starts loading. Visitors never see a chooser screen.',
              )}
            </p>
            <ul className="mt-2 grid gap-3 text-[14.5px]">
              <li className="flex gap-3">
                <Lock className="mt-0.5 size-4 shrink-0 text-accent" />
                {t('Password-protect a link, or close it after a date or a number of clicks.')}
              </li>
              <li className="flex gap-3">
                <Timer className="mt-0.5 size-4 shrink-0 text-accent" />
                {t('Add UTM tags once; every destination inherits them.')}
              </li>
              <li className="flex gap-3">
                <Download className="mt-0.5 size-4 shrink-0 text-accent" />
                {t('Import 500 links from a spreadsheet, or create them from the REST API.')}
              </li>
            </ul>
          </div>
          <RouteDiagram />
        </div>
      </section>

      {/* Connect: real, live profiles from the directory. */}
      <section hidden={!people.data?.items.length} className="mx-auto max-w-[1200px] px-4 py-20 sm:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div className="grid max-w-[60ch] gap-3">
            <h2 className="text-[34px] font-semibold">{t('A profile that opens doors.')}</h2>
            <p className="text-muted">
              {t(
                'Your WRX profile is a page, a QR business card and a contact form in one. Startups post roles and fundraising calls, companies find talent, and every introduction lands in one inbox.',
              )}
            </p>
          </div>
          <Link to="/discover">
            <Button variant="secondary">{t('Browse the directory')}</Button>
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(people.data?.items ?? []).slice(0, 4).map((p) => (
            <ProfileTile key={p.handle} p={p} />
          ))}
        </div>
      </section>

      {/* Developers */}
      <section className="bg-ink text-white">
        <div className="mx-auto grid max-w-[1200px] items-center gap-10 px-4 py-20 sm:px-8 lg:grid-cols-2">
          <div className="grid gap-4">
            <h2 className="text-[34px] font-semibold">{t('Built for developers, too.')}</h2>
            <p className="text-white/70">
              {t(
                'Every feature is available through a documented REST API. Create a key in Settings and you are one request away from a short link.',
              )}
            </p>
            <a href="/api/v1/docs">
              <Button variant="signal">{t('Read the API reference')}</Button>
            </a>
          </div>
          <pre className="overflow-x-auto rounded-2xl bg-white/5 p-5 font-mono text-[13px] leading-relaxed text-white/85 ring-1 ring-white/10">
            <code>{`curl -X POST https://wrx.app/api/v1/links \\
  -H "Authorization: Bearer wrx_…" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://example.com/launch",
    "slug": "launch",
    "rules": [{ "type": "device",
                "devices": ["ios"],
                "url": "https://apps.apple.com/…" }]
  }'`}</code>
          </pre>
        </div>
      </section>
    </main>
  );
}

function RouteDiagram() {
  const { t } = useT();
  const dests = [
    { icon: <Apple className="size-4" />, when: t('iPhone visitors'), to: 'apps.apple.com/…' },
    { icon: <Smartphone className="size-4" />, when: t('Android visitors'), to: 'play.google.com/…' },
    { icon: <MapPin className="size-4" />, when: t('Visitors from Morocco'), to: 'example.ma/fr' },
    { icon: <Split className="size-4" />, when: t('50% of everyone else'), to: 'example.com/pricing-b' },
    { icon: <Globe2 className="size-4" />, when: t('Everyone else'), to: 'example.com/pricing' },
  ];
  return (
    <div className="grid items-center gap-4 sm:grid-cols-[auto_1fr]">
      <div className="justify-self-center rounded-2xl bg-ink px-5 py-4 font-mono text-[15px] text-white shadow-[var(--shadow-lift)] dark:bg-accent dark:text-ink">
        wrx.app/<span className="text-signal dark:text-ink dark:font-bold">launch</span>
      </div>
      <ol className="relative grid gap-2.5 sm:border-l-2 sm:border-dashed sm:border-line sm:pl-6">
        {dests.map((d, i) => (
          <li
            key={i}
            className="relative flex items-center gap-3 rounded-[12px] border border-line bg-bg px-4 py-3"
          >
            <span className="absolute -left-[26px] hidden h-0.5 w-6 bg-line sm:block" aria-hidden />
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent">
              {d.icon}
            </span>
            <span className="text-[14px] font-medium">{d.when}</span>
            <span className="ml-auto truncate font-mono text-[12.5px] text-muted">{d.to}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
