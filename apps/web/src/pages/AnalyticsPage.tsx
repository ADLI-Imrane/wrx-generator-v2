import { useState } from 'react';
import { Link } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { AnimatedNumber } from '../components/AnimatedNumber';
import {
  ChartBarIcon,
  LinkIcon,
  QrCodeIcon,
  GlobeAltIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';

type TimeRange = '7d' | '30d' | '90d' | 'all';

interface AnalyticsData {
  overview: {
    totalLinks: number;
    totalQrCodes: number;
    totalClicks: number;
    totalScans: number;
    clicksChange: number;
    scansChange: number;
  };
  clicksByDay: { date: string; clicks: number; scans: number }[];
  topLinks: { id: string; title: string; slug: string; clicks: number }[];
  topQrCodes: { id: string; name: string; type: string; scans: number }[];
  clicksByCountry: { country: string; code: string; clicks: number }[];
  clicksByDevice: { device: string; clicks: number }[];
  clicksByReferrer: { referrer: string; clicks: number }[];
}

function useAnalytics(timeRange: TimeRange) {
  return useQuery({
    queryKey: ['analytics', timeRange],
    placeholderData: keepPreviousData,
    queryFn: async (): Promise<AnalyticsData> => {
      return api.get<AnalyticsData>(`/analytics?timeRange=${timeRange}`);
    },
  });
}

export function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const { data, isLoading, isFetching, error, refetch } = useAnalytics(timeRange);

  const analytics: AnalyticsData = data || {
    overview: { totalLinks: 0, totalQrCodes: 0, totalClicks: 0, totalScans: 0, clicksChange: 0, scansChange: 0 },
    clicksByDay: [],
    topLinks: [],
    topQrCodes: [],
    clicksByCountry: [],
    clicksByDevice: [],
    clicksByReferrer: [],
  };

  const maxDailyClicks = Math.max(...analytics.clicksByDay.map((d) => d.clicks + d.scans), 1);
  const hasActivity = analytics.clicksByDay.some((day) => day.clicks > 0 || day.scans > 0);

  const deviceIcons: Record<string, React.ReactNode> = {
    Mobile: <DevicePhoneMobileIcon className="h-5 w-5" />,
    Desktop: <ComputerDesktopIcon className="h-5 w-5" />,
    Tablet: <DevicePhoneMobileIcon className="h-5 w-5" />,
  };

  if (error) {
    return (
      <div role="alert" className="rounded-lg bg-red-50 p-6 text-center">
        <h2 className="text-lg font-semibold text-red-800">Erreur de chargement</h2>
        <p className="mt-2 text-red-600">Impossible de charger les analyses. Vérifiez que l’API WRX est démarrée.</p>
        <button type="button" className="btn btn-primary mt-4" onClick={() => { void refetch(); }}>Réessayer</button>
      </div>
    );
  }

  return (
    <div className="analytics-workspace space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vos signaux. En clair.</h1>
          <p className="text-sm text-gray-500">Vue d'ensemble de vos performances</p>
        </div>

        {/* Time Range Selector */}
        <div className="flex flex-wrap gap-2">
          {[
            { value: '7d', label: '7 jours' },
            { value: '30d', label: '30 jours' },
            { value: '90d', label: '90 jours' },
            { value: 'all', label: 'Tout' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setTimeRange(option.value as TimeRange)}
              aria-pressed={timeRange === option.value}
              className={`wrx-period-button rounded-lg px-3 py-1.5 text-sm font-medium ${
                timeRange === option.value
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {option.label}
            </button>
          ))}
          {isFetching && !isLoading && <span role="status" className="self-center text-xs text-cyan-800">Actualisation…</span>}
        </div>
      </div>

      {isLoading ? (
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="border-primary-500 h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
        </div>
      ) : (
        <>
          {/* Overview Cards */}
          <div className="analytics-metrics grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-100 p-2">
                  <LinkIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Liens créés</p>
                  <p className="text-2xl font-bold text-gray-900"><AnimatedNumber value={analytics.overview.totalLinks} /></p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-purple-100 p-2">
                  <QrCodeIcon className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">QR Codes</p>
                  <p className="text-2xl font-bold text-gray-900">
                    <AnimatedNumber value={analytics.overview.totalQrCodes} />
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-100 p-2">
                  <ChartBarIcon className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500">Total clics</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold text-gray-900">
                      <AnimatedNumber value={analytics.overview.totalClicks} />
                    </p>
                    <span
                      className={`flex items-center text-xs font-medium ${
                        analytics.overview.clicksChange >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {analytics.overview.clicksChange === 0 ? (
                        <span aria-label="Aucune variation mesurable">—</span>
                      ) : (
                        <>
                          {analytics.overview.clicksChange > 0 ? (
                            <ArrowTrendingUpIcon className="mr-0.5 h-3 w-3" />
                          ) : (
                            <ArrowTrendingDownIcon className="mr-0.5 h-3 w-3" />
                          )}
                          {Math.abs(analytics.overview.clicksChange)}%
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-orange-100 p-2">
                  <QrCodeIcon className="h-5 w-5 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500">Total scans</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold text-gray-900">
                      <AnimatedNumber value={analytics.overview.totalScans} />
                    </p>
                    <span
                      className={`flex items-center text-xs font-medium ${
                        analytics.overview.scansChange >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {analytics.overview.scansChange === 0 ? (
                        <span aria-label="Aucune variation mesurable">—</span>
                      ) : (
                        <>
                          {analytics.overview.scansChange > 0 ? (
                            <ArrowTrendingUpIcon className="mr-0.5 h-3 w-3" />
                          ) : (
                            <ArrowTrendingDownIcon className="mr-0.5 h-3 w-3" />
                          )}
                          {Math.abs(analytics.overview.scansChange)}%
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Chart */}
          <div className="analytics-chart rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Activité par jour</h2>
            <div className="mb-2 flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1.5">
                <span className="bg-primary-500 h-3 w-3 rounded" />
                Clics
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-orange-400" />
                Scans
              </span>
            </div>
            <div className="h-64">
              {hasActivity ? (
                <div key={`${timeRange}-${analytics.clicksByDay.length}`} className="wrx-chart-reveal flex h-full items-end gap-1">
                  {analytics.clicksByDay.map((day, index) => (
                    <div
                      key={index}
                      className="group relative flex h-full flex-1 flex-col items-center justify-end gap-0.5 outline-offset-2"
                      tabIndex={0}
                      role="img"
                      aria-label={`${day.date} : ${day.clicks} clics, ${day.scans} scans`}
                      onClick={(event) => event.currentTarget.focus()}
                    >
                      <div
                        className="w-full rounded-t bg-orange-400 transition-all hover:bg-orange-500"
                        style={{ height: `${(day.scans / maxDailyClicks) * 100}%`, minHeight: day.scans > 0 ? '1px' : 0 }}
                      />
                      <div
                        className="bg-primary-500 hover:bg-primary-600 w-full rounded-t transition-all"
                        style={{
                          height: `${(day.clicks / maxDailyClicks) * 100}%`,
                          minHeight: day.clicks > 0 ? '1px' : 0,
                        }}
                      />
                      <div className="absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white group-hover:block group-focus:block">
                        {day.date}
                        <br />
                        Clics: {day.clicks}
                        <br />
                        Scans: {day.scans}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div role="status" className="analytics-empty flex h-full flex-col items-center justify-center text-sm text-gray-500">
                  <ChartBarIcon className="mb-4 h-8 w-8" />
                  <strong>Aucune activité enregistrée sur cette période.</strong>
                  <p>Les clics et les scans de vos ressources apparaîtront ici.</p>
                </div>
              )}
            </div>
            <div className="mt-2 flex justify-between text-xs text-gray-500">
              <span>{analytics.clicksByDay[0]?.date}</span>
              <span>{analytics.clicksByDay[analytics.clicksByDay.length - 1]?.date}</span>
            </div>
          </div>

          {/* Top Performers */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Top Links */}
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Top liens</h2>
                <Link to="/links" className="text-primary-600 hover:text-primary-700 text-sm">
                  Voir tout →
                </Link>
              </div>
              <div className="space-y-3">
                {analytics.topLinks.length === 0 && <p className="text-sm text-gray-500">Aucun lien pour cette période.</p>}
                {analytics.topLinks.map((link, index) => (
                  <Link
                    key={link.id}
                    to={`/links/${link.id}/stats`}
                    className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-gray-50"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded bg-gray-100 text-xs font-medium text-gray-600">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-gray-900">{link.title}</p>
                      <p className="text-xs text-gray-500">/{link.slug}</p>
                    </div>
                    <span className="font-semibold text-gray-900">
                      {link.clicks.toLocaleString()}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Top QR Codes */}
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Top QR codes</h2>
                <Link to="/qr-codes" className="text-primary-600 hover:text-primary-700 text-sm">
                  Voir tout →
                </Link>
              </div>
              <div className="space-y-3">
                {analytics.topQrCodes.length === 0 && <p className="text-sm text-gray-500">Aucun QR code pour cette période.</p>}
                {analytics.topQrCodes.map((qr, index) => (
                  <Link
                    key={qr.id}
                    to={`/qr-codes/${qr.id}/stats`}
                    className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-gray-50"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded bg-gray-100 text-xs font-medium text-gray-600">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-gray-900">{qr.name}</p>
                      <p className="text-xs text-gray-500">{qr.type}</p>
                    </div>
                    <span className="font-semibold text-gray-900">{qr.scans.toLocaleString()}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Geographic & Device Stats */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* By Country */}
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                <GlobeAltIcon className="h-5 w-5" />
                Par pays
              </h2>
              <div className="space-y-3">
                {(analytics.overview.totalClicks === 0 || analytics.clicksByCountry.length === 0) && <p className="text-sm text-gray-500">Aucune donnée de localisation pour cette période.</p>}
                {analytics.overview.totalClicks > 0 && analytics.clicksByCountry.map((item) => {
                  const percentage =
                    analytics.overview.totalClicks > 0
                      ? (item.clicks / analytics.overview.totalClicks) * 100
                      : 0;
                  return (
                    <div key={item.code}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="flex items-center gap-2">
                          {getFlagEmoji(item.code) && <span aria-hidden="true" className="text-base">{getFlagEmoji(item.code)}</span>}
                          {item.country}
                        </span>
                        <span className="font-medium">{item.clicks.toLocaleString()}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="bg-primary-500 h-full rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* By Device */}
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                <DevicePhoneMobileIcon className="h-5 w-5" />
                Par appareil
              </h2>
              <div className="space-y-3">
                {(analytics.overview.totalClicks === 0 || analytics.clicksByDevice.length === 0) && <p className="text-sm text-gray-500">Aucune donnée appareil pour cette période.</p>}
                {analytics.overview.totalClicks > 0 && analytics.clicksByDevice.map((item) => {
                  const percentage =
                    analytics.overview.totalClicks > 0
                      ? (item.clicks / analytics.overview.totalClicks) * 100
                      : 0;
                  return (
                    <div key={item.device}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="flex items-center gap-2">
                          {deviceIcons[item.device]}
                          {item.device}
                        </span>
                        <span className="font-medium">{Math.round(percentage)}%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-green-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* By Referrer */}
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Par source</h2>
              <div className="space-y-3">
                {(analytics.overview.totalClicks === 0 || analytics.clicksByReferrer.length === 0) && <p className="text-sm text-gray-500">Aucune source référente pour cette période.</p>}
                {analytics.overview.totalClicks > 0 && analytics.clicksByReferrer.map((item) => {
                  const percentage =
                    analytics.overview.totalClicks > 0
                      ? (item.clicks / analytics.overview.totalClicks) * 100
                      : 0;
                  return (
                    <div key={item.referrer}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span>{item.referrer}</span>
                        <span className="font-medium">{item.clicks.toLocaleString()}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-purple-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Helper function to get flag emoji from country code
function getFlagEmoji(countryCode: string): string {
  if (!/^[A-Z]{2}$/i.test(countryCode) || countryCode.toUpperCase() === 'XX') return '';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}
