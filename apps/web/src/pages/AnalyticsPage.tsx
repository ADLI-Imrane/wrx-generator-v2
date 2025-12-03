import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
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
    queryFn: async (): Promise<AnalyticsData> => {
      return api.get<AnalyticsData>(`/analytics?timeRange=${timeRange}`);
    },
  });
}

export function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const { data, isLoading, error } = useAnalytics(timeRange);

  // Mock data for demonstration
  const mockData: AnalyticsData = data || {
    overview: {
      totalLinks: 47,
      totalQrCodes: 23,
      totalClicks: 12847,
      totalScans: 3421,
      clicksChange: 15.3,
      scansChange: -2.1,
    },
    clicksByDay: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0] as string,
      clicks: Math.floor(Math.random() * 500 + 200),
      scans: Math.floor(Math.random() * 150 + 50),
    })),
    topLinks: [
      { id: '1', title: 'Campagne Summer Sale', slug: 'summer-sale', clicks: 2847 },
      { id: '2', title: 'Newsletter Signup', slug: 'newsletter', clicks: 1932 },
      { id: '3', title: 'Product Launch', slug: 'new-product', clicks: 1654 },
      { id: '4', title: 'Blog Article', slug: 'blog-seo', clicks: 1287 },
      { id: '5', title: 'Social Media Bio', slug: 'socials', clicks: 987 },
    ],
    topQrCodes: [
      { id: '1', name: 'Menu Restaurant', type: 'url', scans: 1245 },
      { id: '2', name: 'Carte de visite', type: 'vcard', scans: 876 },
      { id: '3', name: 'WiFi Invités', type: 'wifi', scans: 654 },
      { id: '4', name: 'Promo Event', type: 'url', scans: 432 },
      { id: '5', name: 'Feedback Form', type: 'url', scans: 214 },
    ],
    clicksByCountry: [
      { country: 'France', code: 'FR', clicks: 5420 },
      { country: 'États-Unis', code: 'US', clicks: 3210 },
      { country: 'Canada', code: 'CA', clicks: 1540 },
      { country: 'Belgique', code: 'BE', clicks: 980 },
      { country: 'Suisse', code: 'CH', clicks: 720 },
    ],
    clicksByDevice: [
      { device: 'Mobile', clicks: 7250 },
      { device: 'Desktop', clicks: 4820 },
      { device: 'Tablet', clicks: 777 },
    ],
    clicksByReferrer: [
      { referrer: 'Direct', clicks: 4520 },
      { referrer: 'Google', clicks: 3180 },
      { referrer: 'Facebook', clicks: 2340 },
      { referrer: 'Twitter', clicks: 1560 },
      { referrer: 'Instagram', clicks: 1247 },
    ],
  };

  const maxDailyClicks = Math.max(...mockData.clicksByDay.map((d) => d.clicks + d.scans), 1);

  const deviceIcons: Record<string, React.ReactNode> = {
    Mobile: <DevicePhoneMobileIcon className="h-5 w-5" />,
    Desktop: <ComputerDesktopIcon className="h-5 w-5" />,
    Tablet: <DevicePhoneMobileIcon className="h-5 w-5" />,
  };

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-6 text-center">
        <h2 className="text-lg font-semibold text-red-800">Erreur de chargement</h2>
        <p className="mt-2 text-red-600">Impossible de charger les analyses.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500">Vue d'ensemble de vos performances</p>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2">
          {[
            { value: '7d', label: '7 jours' },
            { value: '30d', label: '30 jours' },
            { value: '90d', label: '90 jours' },
            { value: 'all', label: 'Tout' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setTimeRange(option.value as TimeRange)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                timeRange === option.value
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="border-primary-500 h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
        </div>
      ) : (
        <>
          {/* Overview Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-100 p-2">
                  <LinkIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Liens actifs</p>
                  <p className="text-2xl font-bold text-gray-900">{mockData.overview.totalLinks}</p>
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
                    {mockData.overview.totalQrCodes}
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
                      {mockData.overview.totalClicks.toLocaleString()}
                    </p>
                    <span
                      className={`flex items-center text-xs font-medium ${
                        mockData.overview.clicksChange >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {mockData.overview.clicksChange >= 0 ? (
                        <ArrowTrendingUpIcon className="mr-0.5 h-3 w-3" />
                      ) : (
                        <ArrowTrendingDownIcon className="mr-0.5 h-3 w-3" />
                      )}
                      {Math.abs(mockData.overview.clicksChange)}%
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
                      {mockData.overview.totalScans.toLocaleString()}
                    </p>
                    <span
                      className={`flex items-center text-xs font-medium ${
                        mockData.overview.scansChange >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {mockData.overview.scansChange >= 0 ? (
                        <ArrowTrendingUpIcon className="mr-0.5 h-3 w-3" />
                      ) : (
                        <ArrowTrendingDownIcon className="mr-0.5 h-3 w-3" />
                      )}
                      {Math.abs(mockData.overview.scansChange)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Chart */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
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
              <div className="flex h-full items-end gap-1">
                {mockData.clicksByDay.map((day, index) => (
                  <div
                    key={index}
                    className="group relative flex flex-1 flex-col items-center justify-end gap-0.5"
                  >
                    <div
                      className="w-full rounded-t bg-orange-400 transition-all hover:bg-orange-500"
                      style={{ height: `${(day.scans / maxDailyClicks) * 100}%`, minHeight: '1px' }}
                    />
                    <div
                      className="bg-primary-500 hover:bg-primary-600 w-full rounded-t transition-all"
                      style={{
                        height: `${(day.clicks / maxDailyClicks) * 100}%`,
                        minHeight: '1px',
                      }}
                    />
                    <div className="absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white group-hover:block">
                      {day.date}
                      <br />
                      Clics: {day.clicks}
                      <br />
                      Scans: {day.scans}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-2 flex justify-between text-xs text-gray-500">
              <span>{mockData.clicksByDay[0]?.date}</span>
              <span>{mockData.clicksByDay[mockData.clicksByDay.length - 1]?.date}</span>
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
                {mockData.topLinks.map((link, index) => (
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
                {mockData.topQrCodes.map((qr, index) => (
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
                {mockData.clicksByCountry.map((item) => {
                  const percentage =
                    mockData.overview.totalClicks > 0
                      ? (item.clicks / mockData.overview.totalClicks) * 100
                      : 0;
                  return (
                    <div key={item.code}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <span className="text-base">{getFlagEmoji(item.code)}</span>
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
                {mockData.clicksByDevice.map((item) => {
                  const percentage =
                    mockData.overview.totalClicks > 0
                      ? (item.clicks / mockData.overview.totalClicks) * 100
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
                {mockData.clicksByReferrer.map((item) => {
                  const percentage =
                    mockData.overview.totalClicks > 0
                      ? (item.clicks / mockData.overview.totalClicks) * 100
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
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}
