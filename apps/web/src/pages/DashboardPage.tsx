import { Link } from 'react-router-dom';
import { useLinks } from '../hooks/useLinks';
import { useQRCodes } from '../hooks/useQR';
import { useAuthStore } from '../stores/auth.store';
import { Link as LinkIcon, QrCode, BarChart2, TrendingUp, Plus, ArrowRight } from 'lucide-react';
import { LinkCard } from '../components/LinkCard';
import { QRCard } from '../components/QRCard';

export function DashboardPage() {
  const { profile } = useAuthStore();
  const { data: linksData, isLoading: linksLoading } = useLinks({ limit: 5 });
  const { data: qrData, isLoading: qrLoading } = useQRCodes({ limit: 5 });

  // Stats calculées
  const totalLinks = linksData?.total || 0;
  const totalQRCodes = qrData?.total || 0;
  const totalClicks = linksData?.data?.reduce((acc, link) => acc + link.clicks, 0) || 0;
  const totalScans = qrData?.data?.reduce((acc, qr) => acc + (qr.scans || 0), 0) || 0;

  const stats = [
    {
      label: 'Total Liens',
      value: totalLinks,
      icon: LinkIcon,
      color: 'bg-blue-500',
      change: '+12%',
      trend: 'up',
    },
    {
      label: 'Total QR Codes',
      value: totalQRCodes,
      icon: QrCode,
      color: 'bg-purple-500',
      change: '+8%',
      trend: 'up',
    },
    {
      label: 'Total Clics',
      value: totalClicks,
      icon: BarChart2,
      color: 'bg-green-500',
      change: '+23%',
      trend: 'up',
    },
    {
      label: 'Total Scans',
      value: totalScans,
      icon: TrendingUp,
      color: 'bg-orange-500',
      change: '+15%',
      trend: 'up',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Bonjour, {profile?.fullName?.split(' ')[0] || 'Utilisateur'} 👋
          </h1>
          <p className="mt-1 text-gray-600">Voici un aperçu de votre activité</p>
        </div>
        <div className="flex gap-3">
          <Link to="/links/new" className="btn btn-outline flex items-center gap-2">
            <Plus size={18} />
            Nouveau lien
          </Link>
          <Link to="/qr-codes/new" className="btn btn-primary flex items-center gap-2">
            <QrCode size={18} />
            Nouveau QR
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.label}</p>
                <p className="mt-1 text-3xl font-bold text-gray-900">
                  {stat.value.toLocaleString()}
                </p>
              </div>
              <div className={`p-3 ${stat.color} rounded-lg`}>
                <stat.icon size={24} className="text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1">
              <TrendingUp size={16} className="text-green-500" />
              <span className="text-sm font-medium text-green-600">{stat.change}</span>
              <span className="text-sm text-gray-500">vs mois dernier</span>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Links & QR Codes */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Links */}
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Liens récents</h2>
            <Link
              to="/links"
              className="text-primary-600 hover:text-primary-700 flex items-center gap-1 text-sm"
            >
              Voir tout <ArrowRight size={14} />
            </Link>
          </div>

          {linksLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-lg bg-gray-100" />
              ))}
            </div>
          ) : linksData?.data?.length === 0 ? (
            <div className="py-8 text-center">
              <LinkIcon className="mx-auto text-gray-300" size={48} />
              <p className="mt-2 text-gray-500">Aucun lien créé</p>
              <Link to="/links/new" className="btn btn-primary mt-4 inline-flex items-center gap-2">
                <Plus size={18} />
                Créer votre premier lien
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {linksData?.data?.slice(0, 3).map((link) => (
                <LinkCard key={link.id} link={link} />
              ))}
            </div>
          )}
        </div>

        {/* Recent QR Codes */}
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">QR Codes récents</h2>
            <Link
              to="/qr-codes"
              className="text-primary-600 hover:text-primary-700 flex items-center gap-1 text-sm"
            >
              Voir tout <ArrowRight size={14} />
            </Link>
          </div>

          {qrLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-lg bg-gray-100" />
              ))}
            </div>
          ) : qrData?.data?.length === 0 ? (
            <div className="py-8 text-center">
              <QrCode className="mx-auto text-gray-300" size={48} />
              <p className="mt-2 text-gray-500">Aucun QR code créé</p>
              <Link
                to="/qr-codes/new"
                className="btn btn-primary mt-4 inline-flex items-center gap-2"
              >
                <Plus size={18} />
                Créer votre premier QR code
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {qrData?.data?.slice(0, 3).map((qr) => (
                <QRCard key={qr.id} qr={qr} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Actions rapides</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Link
            to="/links/new"
            className="flex flex-col items-center rounded-lg bg-gray-50 p-4 transition-colors hover:bg-gray-100"
          >
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <LinkIcon className="text-blue-600" size={24} />
            </div>
            <span className="text-sm font-medium text-gray-900">Créer un lien</span>
          </Link>

          <Link
            to="/qr-codes/new"
            className="flex flex-col items-center rounded-lg bg-gray-50 p-4 transition-colors hover:bg-gray-100"
          >
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
              <QrCode className="text-purple-600" size={24} />
            </div>
            <span className="text-sm font-medium text-gray-900">Créer un QR code</span>
          </Link>

          <Link
            to="/analytics"
            className="flex flex-col items-center rounded-lg bg-gray-50 p-4 transition-colors hover:bg-gray-100"
          >
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <BarChart2 className="text-green-600" size={24} />
            </div>
            <span className="text-sm font-medium text-gray-900">Voir analytiques</span>
          </Link>

          <Link
            to="/settings"
            className="flex flex-col items-center rounded-lg bg-gray-50 p-4 transition-colors hover:bg-gray-100"
          >
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
              <TrendingUp className="text-orange-600" size={24} />
            </div>
            <span className="text-sm font-medium text-gray-900">Paramètres</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
