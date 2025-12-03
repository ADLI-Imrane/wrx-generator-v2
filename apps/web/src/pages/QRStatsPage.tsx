import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQRCode, useQRCodeStats } from '../hooks/useQR';
import {
  ArrowLeftIcon,
  ArrowDownTrayIcon,
  GlobeAltIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  QrCodeIcon,
} from '@heroicons/react/24/outline';

type TimeRange = '7d' | '30d' | '90d' | 'all';

interface ScansByDay {
  date: string;
  scans: number;
}

interface ScansByCountry {
  country: string;
  code: string;
  scans: number;
}

interface ScansByDevice {
  device: string;
  scans: number;
}

interface ScansByOS {
  os: string;
  scans: number;
}

interface ScanLocation {
  city: string;
  country: string;
  lat: number;
  lng: number;
  scans: number;
}

interface QRStatsData {
  totalScans: number;
  uniqueScanners: number;
  scansByDay: ScansByDay[];
  scansByCountry: ScansByCountry[];
  scansByDevice: ScansByDevice[];
  scansByOS: ScansByOS[];
  scanLocations: ScanLocation[];
}

export function QRStatsPage() {
  const { id } = useParams<{ id: string }>();
  const { data: qrCode, isLoading: isLoadingQR, error: qrError } = useQRCode(id!);
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const { data: stats, isLoading: isLoadingStats } = useQRCodeStats(id!, timeRange);

  const handleDownload = () => {
    if (qrCode?.imageUrl) {
      const link = document.createElement('a');
      link.href = qrCode.imageUrl;
      link.download = `${qrCode.title || 'qr-code'}.png`;
      link.click();
    }
  };

  if (isLoadingQR) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="border-primary-500 h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
      </div>
    );
  }

  if (qrError || !qrCode) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-lg bg-red-50 p-6 text-center">
          <h2 className="text-lg font-semibold text-red-800">QR Code non trouvé</h2>
          <p className="mt-2 text-red-600">Ce QR code n'existe pas ou vous n'y avez pas accès.</p>
          <Link to="/qr-codes" className="btn btn-primary mt-4">
            Retour aux QR codes
          </Link>
        </div>
      </div>
    );
  }

  // Generate mock stats for demonstration (replace with real API data)
  const mockStats: QRStatsData = (stats as unknown as QRStatsData) || {
    totalScans: qrCode.scans || 0,
    uniqueScanners: Math.floor((qrCode.scans || 0) * 0.65),
    scansByDay: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0] as string,
      scans: Math.floor(Math.random() * 30),
    })),
    scansByCountry: [
      { country: 'France', code: 'FR', scans: 280 },
      { country: 'États-Unis', code: 'US', scans: 150 },
      { country: 'Canada', code: 'CA', scans: 95 },
      { country: 'Belgique', code: 'BE', scans: 60 },
      { country: 'Suisse', code: 'CH', scans: 45 },
    ],
    scansByDevice: [
      { device: 'Mobile', scans: 520 },
      { device: 'Desktop', scans: 80 },
      { device: 'Tablet', scans: 30 },
    ],
    scansByOS: [
      { os: 'iOS', scans: 320 },
      { os: 'Android', scans: 280 },
      { os: 'Windows', scans: 20 },
      { os: 'macOS', scans: 10 },
    ],
    scanLocations: [
      { city: 'Paris', country: 'FR', lat: 48.8566, lng: 2.3522, scans: 120 },
      { city: 'Lyon', country: 'FR', lat: 45.764, lng: 4.8357, scans: 85 },
      { city: 'New York', country: 'US', lat: 40.7128, lng: -74.006, scans: 65 },
      { city: 'Montreal', country: 'CA', lat: 45.5017, lng: -73.5673, scans: 55 },
      { city: 'Marseille', country: 'FR', lat: 43.2965, lng: 5.3698, scans: 45 },
    ],
  };

  const maxDailyScans = Math.max(...mockStats.scansByDay.map((d) => d.scans), 1);

  const deviceIcons: Record<string, React.ReactNode> = {
    Mobile: <DevicePhoneMobileIcon className="h-5 w-5" />,
    Desktop: <ComputerDesktopIcon className="h-5 w-5" />,
    Tablet: <DevicePhoneMobileIcon className="h-5 w-5" />,
  };

  const typeLabels: Record<string, string> = {
    url: 'URL',
    vcard: 'Carte de visite',
    wifi: 'WiFi',
    text: 'Texte',
    email: 'Email',
    phone: 'Téléphone',
    sms: 'SMS',
  };

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <div className="mb-4 flex items-start gap-4">
          <Link
            to="/qr-codes"
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>

          {/* QR Code Preview */}
          <div className="flex-shrink-0">
            {qrCode.imageUrl ? (
              <img
                src={qrCode.imageUrl}
                alt={qrCode.title}
                className="h-24 w-24 rounded-lg border border-gray-200"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-lg bg-gray-100">
                <QrCodeIcon className="h-12 w-12 text-gray-400" />
              </div>
            )}
          </div>

          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{qrCode.title}</h1>
            <p className="mt-1 text-sm text-gray-500">
              Type: {typeLabels[qrCode.type] || qrCode.type} • Créé le{' '}
              {new Date(qrCode.createdAt).toLocaleDateString('fr-FR')}
            </p>
            <div className="mt-2 flex gap-2">
              <button onClick={handleDownload} className="btn btn-outline btn-sm">
                <ArrowDownTrayIcon className="mr-1 h-4 w-4" />
                Télécharger
              </button>
              <Link to={`/qr-codes/${id}/edit`} className="btn btn-outline btn-sm">
                Modifier
              </Link>
            </div>
          </div>
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

      {isLoadingStats ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <div className="border-primary-500 h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
        </div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-sm text-gray-500">Total des scans</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">{mockStats.totalScans}</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-sm text-gray-500">Scanneurs uniques</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">{mockStats.uniqueScanners}</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-sm text-gray-500">Scans / jour (moy.)</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">
                {mockStats.scansByDay.length > 0
                  ? Math.round(
                      mockStats.scansByDay.reduce((acc, d) => acc + d.scans, 0) /
                        mockStats.scansByDay.length
                    )
                  : 0}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-sm text-gray-500">Taux mobile</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">
                {mockStats.totalScans > 0
                  ? Math.round(
                      ((mockStats.scansByDevice.find((d) => d.device === 'Mobile')?.scans || 0) /
                        mockStats.totalScans) *
                        100
                    )
                  : 0}
                %
              </p>
            </div>
          </div>

          {/* Scans Over Time */}
          <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Scans par jour</h2>
            <div className="h-48">
              <div className="flex h-full items-end gap-1">
                {mockStats.scansByDay.map((day, index) => (
                  <div
                    key={index}
                    className="group relative flex-1"
                    title={`${day.date}: ${day.scans} scans`}
                  >
                    <div
                      className="bg-primary-500 hover:bg-primary-600 w-full rounded-t transition-all"
                      style={{ height: `${(day.scans / maxDailyScans) * 100}%`, minHeight: '2px' }}
                    />
                    <div className="absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white group-hover:block">
                      {day.date}: {day.scans}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-2 flex justify-between text-xs text-gray-500">
              <span>{mockStats.scansByDay[0]?.date}</span>
              <span>{mockStats.scansByDay[mockStats.scansByDay.length - 1]?.date}</span>
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
                {mockStats.scansByCountry.map((item) => {
                  const percentage =
                    mockStats.totalScans > 0 ? (item.scans / mockStats.totalScans) * 100 : 0;
                  return (
                    <div key={item.code}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <span className="text-lg">{getFlagEmoji(item.code)}</span>
                          {item.country}
                        </span>
                        <span className="font-medium">{item.scans}</span>
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
                {mockStats.scansByDevice.map((item) => {
                  const percentage =
                    mockStats.totalScans > 0 ? (item.scans / mockStats.totalScans) * 100 : 0;
                  return (
                    <div key={item.device}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="flex items-center gap-2">
                          {deviceIcons[item.device]}
                          {item.device}
                        </span>
                        <span className="font-medium">
                          {item.scans} ({Math.round(percentage)}%)
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

            {/* By OS */}
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Par système d'exploitation
              </h2>
              <div className="space-y-3">
                {mockStats.scansByOS.map((item) => {
                  const percentage =
                    mockStats.totalScans > 0 ? (item.scans / mockStats.totalScans) * 100 : 0;
                  return (
                    <div key={item.os}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span>{item.os}</span>
                        <span className="font-medium">
                          {item.scans} ({Math.round(percentage)}%)
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

            {/* Top Locations */}
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Top villes</h2>
              <div className="space-y-3">
                {mockStats.scanLocations.map((item, index) => {
                  const percentage =
                    mockStats.totalScans > 0 ? (item.scans / mockStats.totalScans) * 100 : 0;
                  return (
                    <div key={index}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <span className="text-lg">{getFlagEmoji(item.country)}</span>
                          {item.city}
                        </span>
                        <span className="font-medium">
                          {item.scans} ({Math.round(percentage)}%)
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

          {/* QR Code Content Info */}
          <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Contenu du QR Code</h2>
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-sm font-medium text-gray-700">
                Type: {typeLabels[qrCode.type] || qrCode.type}
              </p>
              <p className="mt-2 break-all font-mono text-sm text-gray-600">{qrCode.content}</p>
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
