import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLink } from '../hooks/useLinks';
import {
  ArrowLeftIcon,
  ArrowTopRightOnSquareIcon,
  ClipboardIcon,
  CheckIcon,
  GlobeAltIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
} from '@heroicons/react/24/outline';

type TimeRange = '7d' | '30d' | '90d' | 'all';

interface StatsData {
  totalClicks: number;
  uniqueVisitors: number;
  clicksByDay: { date: string; clicks: number }[];
  clicksByCountry: { country: string; code: string; clicks: number }[];
  clicksByDevice: { device: string; clicks: number }[];
  clicksByBrowser: { browser: string; clicks: number }[];
  clicksByReferrer: { referrer: string; clicks: number }[];
}

export function LinkStatsPage() {
  const { id } = useParams<{ id: string }>();
  const { data: link, isLoading: isLoadingLink, error: linkError } = useLink(id!);
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    if (link) {
      const shortUrl = `${window.location.origin}/s/${link.slug}`;
      await navigator.clipboard.writeText(shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoadingLink) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="border-primary-500 h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
      </div>
    );
  }

  if (linkError || !link) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-lg bg-red-50 p-6 text-center">
          <h2 className="text-lg font-semibold text-red-800">Lien non trouvé</h2>
          <p className="mt-2 text-red-600">Ce lien n'existe pas ou vous n'y avez pas accès.</p>
          <Link to="/links" className="btn btn-primary mt-4">
            Retour aux liens
          </Link>
        </div>
      </div>
    );
  }

  const shortUrl = `${window.location.origin}/s/${link.slug}`;

  // Generate mock stats based on link data and timeRange
  const generateMockStats = (): StatsData => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
    const totalClicks = link.clicks || 0;

    return {
      totalClicks,
      uniqueVisitors: Math.floor(totalClicks * 0.7),
      clicksByDay: Array.from({ length: days }, (_, i) => ({
        date: new Date(Date.now() - (days - 1 - i) * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0] as string,
        clicks: Math.floor(Math.random() * 50),
      })),
      clicksByCountry: [
        { country: 'France', code: 'FR', clicks: Math.floor(totalClicks * 0.35) },
        { country: 'États-Unis', code: 'US', clicks: Math.floor(totalClicks * 0.18) },
        { country: 'Canada', code: 'CA', clicks: Math.floor(totalClicks * 0.09) },
        { country: 'Belgique', code: 'BE', clicks: Math.floor(totalClicks * 0.07) },
        { country: 'Suisse', code: 'CH', clicks: Math.floor(totalClicks * 0.05) },
      ],
      clicksByDevice: [
        { device: 'Mobile', clicks: Math.floor(totalClicks * 0.55) },
        { device: 'Desktop', clicks: Math.floor(totalClicks * 0.4) },
        { device: 'Tablet', clicks: Math.floor(totalClicks * 0.05) },
      ],
      clicksByBrowser: [
        { browser: 'Chrome', clicks: Math.floor(totalClicks * 0.47) },
        { browser: 'Safari', clicks: Math.floor(totalClicks * 0.29) },
        { browser: 'Firefox', clicks: Math.floor(totalClicks * 0.13) },
        { browser: 'Edge', clicks: Math.floor(totalClicks * 0.08) },
        { browser: 'Autre', clicks: Math.floor(totalClicks * 0.03) },
      ],
      clicksByReferrer: [
        { referrer: 'Direct', clicks: Math.floor(totalClicks * 0.37) },
        { referrer: 'Google', clicks: Math.floor(totalClicks * 0.23) },
        { referrer: 'Facebook', clicks: Math.floor(totalClicks * 0.19) },
        { referrer: 'Twitter', clicks: Math.floor(totalClicks * 0.13) },
        { referrer: 'LinkedIn', clicks: Math.floor(totalClicks * 0.08) },
      ],
    };
  };

  const stats = generateMockStats();
  const maxDailyClicks = Math.max(...stats.clicksByDay.map((d) => d.clicks), 1);

  const deviceIcons: Record<string, React.ReactNode> = {
    Mobile: <DevicePhoneMobileIcon className="h-5 w-5" />,
    Desktop: <ComputerDesktopIcon className="h-5 w-5" />,
    Tablet: <DevicePhoneMobileIcon className="h-5 w-5" />,
  };

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <div className="mb-4 flex items-center gap-4">
          <Link
            to="/links"
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">
              {link.title || 'Statistiques du lien'}
            </h1>
            <div className="mt-1 flex items-center gap-2">
              <code className="text-primary-600 rounded bg-gray-100 px-2 py-1 text-sm">
                {shortUrl}
              </code>
              <button
                onClick={copyToClipboard}
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                title="Copier"
              >
                {copied ? (
                  <CheckIcon className="h-4 w-4 text-green-500" />
                ) : (
                  <ClipboardIcon className="h-4 w-4" />
                )}
              </button>
              <a
                href={link.originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                title="Ouvrir l'URL de destination"
              >
                <ArrowTopRightOnSquareIcon className="h-4 w-4" />
              </a>
            </div>
          </div>
          <Link to={`/links/${id}/edit`} className="btn btn-outline">
            Modifier
          </Link>
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

      {/* Key Metrics */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Total des clics</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">{stats.totalClicks}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Visiteurs uniques</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">{stats.uniqueVisitors}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Taux de retour</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">
            {stats.totalClicks > 0
              ? Math.round((1 - stats.uniqueVisitors / stats.totalClicks) * 100)
              : 0}
            %
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Créé le</p>
          <p className="mt-1 text-xl font-bold text-gray-900">
            {new Date(link.createdAt).toLocaleDateString('fr-FR')}
          </p>
        </div>
      </div>

      {/* Clicks Over Time */}
      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Clics par jour</h2>
        <div className="h-48">
          <div className="flex h-full items-end gap-1">
            {stats.clicksByDay.map((day, index) => (
              <div
                key={index}
                className="group relative flex-1"
                title={`${day.date}: ${day.clicks} clics`}
              >
                <div
                  className="bg-primary-500 hover:bg-primary-600 w-full rounded-t transition-all"
                  style={{ height: `${(day.clicks / maxDailyClicks) * 100}%`, minHeight: '2px' }}
                />
                <div className="absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white group-hover:block">
                  {day.date}: {day.clicks}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-2 flex justify-between text-xs text-gray-500">
          <span>{stats.clicksByDay[0]?.date}</span>
          <span>{stats.clicksByDay[stats.clicksByDay.length - 1]?.date}</span>
        </div>
      </div>

      {/* Detailed Stats Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* By Country */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <GlobeAltIcon className="h-5 w-5" />
            Par pays
          </h2>
          <div className="space-y-3">
            {stats.clicksByCountry.map((item) => {
              const percentage =
                stats.totalClicks > 0 ? (item.clicks / stats.totalClicks) * 100 : 0;
              return (
                <div key={item.code}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="text-lg">{getFlagEmoji(item.code)}</span>
                      {item.country}
                    </span>
                    <span className="font-medium">{item.clicks}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-100">
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
            {stats.clicksByDevice.map((item) => {
              const percentage =
                stats.totalClicks > 0 ? (item.clicks / stats.totalClicks) * 100 : 0;
              return (
                <div key={item.device}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="flex items-center gap-2">
                      {deviceIcons[item.device]}
                      {item.device}
                    </span>
                    <span className="font-medium">
                      {item.clicks} ({Math.round(percentage)}%)
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-100">
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

        {/* By Browser */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Par navigateur</h2>
          <div className="space-y-3">
            {stats.clicksByBrowser.map((item) => {
              const percentage =
                stats.totalClicks > 0 ? (item.clicks / stats.totalClicks) * 100 : 0;
              return (
                <div key={item.browser}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{item.browser}</span>
                    <span className="font-medium">
                      {item.clicks} ({Math.round(percentage)}%)
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-blue-500"
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
            {stats.clicksByReferrer.map((item) => {
              const percentage =
                stats.totalClicks > 0 ? (item.clicks / stats.totalClicks) * 100 : 0;
              return (
                <div key={item.referrer}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{item.referrer}</span>
                    <span className="font-medium">
                      {item.clicks} ({Math.round(percentage)}%)
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-100">
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
