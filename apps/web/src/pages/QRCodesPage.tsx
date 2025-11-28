import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQRCodes, useDeleteQR, useDownloadQR, useDuplicateQR } from '../hooks/useQR';
import { QRCard } from '../components/QRCard';
import { Modal } from '../components/Modal';
import { Plus, Search, Filter, SortAsc, SortDesc, QrCode } from 'lucide-react';
import type { QRCode as QRCodeType } from '@wrx/shared';

export function QRCodesPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<'createdAt' | 'scans' | 'title'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const [deleteModal, setDeleteModal] = useState<QRCodeType | null>(null);

  const { data, isLoading, refetch } = useQRCodes({
    page,
    limit: 10,
    search: search || undefined,
    type:
      typeFilter === 'all'
        ? undefined
        : (typeFilter as 'url' | 'vcard' | 'wifi' | 'text' | 'email' | 'phone' | 'sms'),
    sortBy,
    sortOrder,
  });

  const { mutate: deleteQR, isPending: isDeleting } = useDeleteQR();
  const { mutate: downloadQR } = useDownloadQR();
  const { mutate: duplicateQR } = useDuplicateQR();

  const handleDelete = () => {
    if (deleteModal) {
      deleteQR(deleteModal.id, {
        onSuccess: () => {
          setDeleteModal(null);
          refetch();
        },
      });
    }
  };

  const handleDownload = (qr: QRCodeType, format: 'png' | 'svg' | 'pdf') => {
    downloadQR({ id: qr.id, format });
  };

  const handleEdit = (qr: QRCodeType) => {
    window.location.href = `/qr-codes/${qr.id}/edit`;
  };

  const handleDuplicate = (qr: QRCodeType) => {
    duplicateQR(qr.id, {
      onSuccess: () => refetch(),
    });
  };

  const qrTypes = [
    { value: 'all', label: 'Tous les types' },
    { value: 'url', label: 'URL' },
    { value: 'vcard', label: 'VCard' },
    { value: 'wifi', label: 'WiFi' },
    { value: 'text', label: 'Texte' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Téléphone' },
    { value: 'sms', label: 'SMS' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes QR Codes</h1>
          <p className="mt-1 text-gray-600">Créez et gérez vos QR codes personnalisés</p>
        </div>
        <Link to="/qr-codes/new" className="btn btn-primary flex items-center gap-2">
          <Plus size={18} />
          Nouveau QR Code
        </Link>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col gap-4 md:flex-row">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Rechercher un QR code..."
              className="input w-full pl-10"
            />
          </div>

          {/* Type filter */}
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-400" />
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="input"
            >
              {qrTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="input"
            >
              <option value="createdAt">Date de création</option>
              <option value="scans">Nombre de scans</option>
              <option value="title">Titre</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="rounded-lg p-2 transition-colors hover:bg-gray-100"
            >
              {sortOrder === 'asc' ? (
                <SortAsc size={18} className="text-gray-600" />
              ) : (
                <SortDesc size={18} className="text-gray-600" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* QR Codes Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-xl border border-gray-200 bg-white"
            />
          ))}
        </div>
      ) : data?.data?.length === 0 ? (
        <div className="card py-12 text-center">
          <QrCode className="mx-auto text-gray-300" size={64} />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Aucun QR code trouvé</h3>
          <p className="mt-2 text-gray-500">
            {search
              ? 'Aucun QR code ne correspond à votre recherche.'
              : 'Commencez par créer votre premier QR code.'}
          </p>
          {!search && (
            <Link
              to="/qr-codes/new"
              className="btn btn-primary mt-6 inline-flex items-center gap-2"
            >
              <Plus size={18} />
              Créer un QR code
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {data?.data?.map((qr) => (
              <QRCard
                key={qr.id}
                qr={qr}
                onDownload={handleDownload}
                onEdit={handleEdit}
                onDelete={setDeleteModal}
                onDuplicate={handleDuplicate}
              />
            ))}
          </div>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Affichage de {(page - 1) * 10 + 1} à {Math.min(page * 10, data.total)} sur{' '}
                {data.total} QR codes
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="btn btn-outline disabled:opacity-50"
                >
                  Précédent
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === data.totalPages}
                  className="btn btn-outline disabled:opacity-50"
                >
                  Suivant
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete Modal */}
      <Modal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title="Supprimer le QR code"
        size="sm"
      >
        <p className="text-gray-600">
          Êtes-vous sûr de vouloir supprimer ce QR code ? Cette action est irréversible.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={() => setDeleteModal(null)} className="btn btn-outline">
            Annuler
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="btn bg-red-600 text-white hover:bg-red-700"
          >
            {isDeleting ? 'Suppression...' : 'Supprimer'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
