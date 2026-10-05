import { lazy, Suspense, useState } from 'react';
import { Link } from 'react-router';
import type { Range } from '@wrx/shared';
import { useAnalytics } from '@/hooks/queries';
import { useT } from '@/lib/i18n';
import { countryName, delta, flag, nf, relTime } from '@/lib/format';
import { AreaChart, BarList, Stat } from './charts';
import { ErrorState, ModuleLoader, Segmented } from './ui';

const WorldMap = lazy(() => import('./WorldMap').then((m) => ({ default: m.WorldMap })));

export function AnalyticsPanel({ linkId }: { linkId?: string }) {
  const { t, lang } = useT();
  const [range, setRange] = useState<Range>('30d');
  const q = useAnalytics(range, linkId);
  const [tab, setTab] = useState<'countries' | 'cities'>('countries');
  const [tech, setTech] = useState<'devices' | 'browsers' | 'os'>('devices');
  const [traffic, setTraffic] = useState<'referrers' | 'sources'>('referrers');

  if (q.error) return <ErrorState error={q.error} retry={() => q.refetch()} />;
  if (!q.data) return <ModuleLoader />;
  const a = q.data;
  const d = delta(a.total, a.previousTotal);
  const qr = a.sources.find((s) => s.key === 'qr')?.value ?? 0;
  const deviceLabel = (k: string) =>
    ({ mobile: t('Mobile'), desktop: t('Desktop'), tablet: t('Tablet') })[k] ?? k;
  const sourceLabel = (k: string) =>
    ({
      direct: t('Direct or typed'),
      referral: t('Another website'),
      qr: t('QR code scan'),
      bio: t('Profile page'),
    })[k] ?? k;

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented
          label={t('Period')}
          value={range}
          onChange={setRange}
          options={[
            { value: '24h', label: t('24 hours') },
            { value: '7d', label: t('7 days') },
            { value: '30d', label: t('30 days') },
            { value: '90d', label: t('90 days') },
          ]}
        />
        {q.isFetching && <span className="text-[12.5px] text-faint">{t('Updating…')}</span>}
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label={t('Clicks')}
          value={nf(a.total, lang)}
          tone={d > 0 ? 'up' : d < 0 ? 'down' : undefined}
          sub={
            a.previousTotal || a.total
              ? t('{d}% vs previous period', { d: d > 0 ? `+${d}` : d })
              : t('No clicks yet')
          }
        />
        <Stat
          label={t('Unique visitors')}
          value={nf(a.uniqueVisitors, lang)}
          sub={
            a.total
              ? t('{n} clicks per visitor', { n: (a.total / Math.max(1, a.uniqueVisitors)).toFixed(1) })
              : undefined
          }
        />
        <Stat
          label={t('QR code scans')}
          value={nf(qr, lang)}
          sub={a.total ? t('{p}% of all clicks', { p: Math.round((qr / a.total) * 100) }) : undefined}
        />
        <Stat
          label={t('Top country')}
          value={a.countries[0] ? `${flag(a.countries[0].key)} ${a.countries[0].key}` : '—'}
          sub={a.countries[0] ? countryName(a.countries[0].key, lang) : undefined}
        />
      </div>
      <section className="card p-5">
        <AreaChart series={a.series} hourly={range === '24h'} />
      </section>
      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <section className="card grid gap-4 p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[16px] font-semibold">{t('Where they are')}</h2>
            <Segmented
              label={t('Location')}
              value={tab}
              onChange={setTab}
              options={[
                { value: 'countries', label: t('Countries') },
                { value: 'cities', label: t('Cities') },
              ]}
            />
          </div>
          <Suspense fallback={<div className="aspect-[2/1] rounded-xl bg-raised" />}>
            <WorldMap data={a.countries} />
          </Suspense>
          {tab === 'countries' ? (
            <BarList
              items={a.countries}
              total={a.total}
              format={(k) => (
                <>
                  {flag(k)} {countryName(k, lang)}
                </>
              )}
            />
          ) : (
            <BarList items={a.cities} total={a.total} />
          )}
        </section>
        <div className="grid content-start gap-5">
          <section className="card grid gap-3 p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-[16px] font-semibold">{t('What they use')}</h2>
              <Segmented
                label={t('Technology')}
                value={tech}
                onChange={setTech}
                options={[
                  { value: 'devices', label: t('Devices') },
                  { value: 'browsers', label: t('Browsers') },
                  { value: 'os', label: 'OS' },
                ]}
              />
            </div>
            <BarList items={a[tech]} total={a.total} format={tech === 'devices' ? deviceLabel : undefined} />
          </section>
          <section className="card grid gap-3 p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-[16px] font-semibold">{t('How they arrive')}</h2>
              <Segmented
                label={t('Traffic')}
                value={traffic}
                onChange={setTraffic}
                options={[
                  { value: 'referrers', label: t('Websites') },
                  { value: 'sources', label: t('Channels') },
                ]}
              />
            </div>
            <BarList
              items={a[traffic]}
              total={a.total}
              format={
                traffic === 'sources' ? sourceLabel : (k) => (k === 'Unknown' ? t('Direct or typed') : k)
              }
            />
          </section>
        </div>
      </div>
      <div className={linkId ? 'grid' : 'grid gap-5 lg:grid-cols-2'}>
        {!linkId && (
          <section className="card grid gap-3 p-5">
            <h2 className="text-[16px] font-semibold">{t('Top links')}</h2>
            <BarList
              items={a.topLinks.map((l) => ({ key: l.id, value: l.clicks }))}
              total={a.total}
              format={(id) => {
                const l = a.topLinks.find((x) => x.id === id)!;
                return (
                  <Link to={`/app/links/${id}`} className="hover:text-accent">
                    {l.title || `/${l.slug}`}
                  </Link>
                );
              }}
            />
          </section>
        )}
        <section className="card grid content-start gap-3 p-5">
          <div className="flex items-center gap-2">
            <span className="size-2 animate-pulse rounded-full bg-signal" aria-hidden />
            <h2 className="text-[16px] font-semibold">{t('Latest clicks')}</h2>
          </div>
          {a.recent.length ? (
            <ul className="divide-y divide-line text-[13.5px]">
              {a.recent.slice(0, 8).map((r, i) => (
                <li key={i} className="flex items-center gap-3 py-2">
                  <span className="text-lg leading-none">{flag(r.country)}</span>
                  <span className="min-w-0 flex-1 truncate">
                    {r.city || (r.country ? countryName(r.country, lang) : t('Unknown place'))}{' '}
                    <span className="text-faint">
                      — {deviceLabel(r.device)}, {r.browser}
                    </span>
                  </span>
                  <span className="font-mono text-[12px] text-muted">/{r.slug}</span>
                  <span className="w-24 text-right text-[12px] text-faint">{relTime(r.at, lang)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-[13px] text-faint">
              {t('Share a link to see visits arrive here in real time.')}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
