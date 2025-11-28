import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLinks, useDeleteLink } from '../hooks/useLinks';
import { LinkCard } from '../components/LinkCard';
import { Modal } from '../components/Modal';
import { Plus, Search, Filter, SortAsc, SortDesc, Link as LinkIcon } from 'lucide-react';
import type { Link as LinkType } from '@wrx/shared';

export function LinksPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<'createdAt' | 'clicks' | 'title'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined);

  const [deleteModal, setDeleteModal] = useState<LinkType | null>(null);

  const { data, isLoading, refetch } = useLinks({
    page,
    limit: 10,
    search: search || undefined,
    isActive: filterActive,
    sortBy,
    sortOrder,
  });

  const { mutate: deleteLink, isPending: isDeleting } = useDeleteLink();

  const handleDelete = () => {
    if (deleteModal) {
      deleteLink(deleteModal.id, {
        onSuccess: () => {
          setDeleteModal(null);
          refetch();
        },
      });
    }
  };

  const handleCopy = (_shortUrl: string) => {
    // Toast notification handled elsewhere
  };

  const handleEdit = (link: LinkType) => {
    // Navigate to edit page or open modal
    window.location.href = `/links/${link.id}/edit`;
  };

  const handleGenerateQR = (link: LinkType) => {
    // Navigate to QR generation with link prefilled
    window.location.href = `/qr-codes/new?url=${encodeURIComponent(link.originalUrl)}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes Liens</h1>
          <p className="mt-1 text-gray-600">Gérez tous vos liens courts</p>
        </div>
        <Link to="/links/new" className="btn btn-primary flex items-center gap-2">
          <Plus size={18} />
          Nouveau lien
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
              placeholder="Rechercher un lien..."
              className="input w-full pl-10"
            />
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-400" />
            <select
              value={filterActive === undefined ? 'all' : filterActive ? 'active' : 'inactive'}
              onChange={(e) => {
                const value = e.target.value;
                setFilterActive(value === 'all' ? undefined : value === 'active');
                setPage(1);
              }}
              className="input"
            >
              <option value="all">Tous les liens</option>
              <option value="active">Actifs</option>
              <option value="inactive">Inactifs</option>
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
              <option value="clicks">Nombre de clics</option>
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

      {/* Links List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-xl border border-gray-200 bg-white"
            />
          ))}
        </div>
      ) : data?.data?.length === 0 ? (
        <div className="card py-12 text-center">
          <LinkIcon className="mx-auto text-gray-300" size={64} />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Aucun lien trouvé</h3>
          <p className="mt-2 text-gray-500">
            {search
              ? 'Aucun lien ne correspond à votre recherche.'
              : 'Commencez par créer votre premier lien court.'}
          </p>
          {!search && (
            <Link to="/links/new" className="btn btn-primary mt-6 inline-flex items-center gap-2">
              <Plus size={18} />
              Créer un lien
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {data?.data?.map((link) => (
              <LinkCard
                key={link.id}
                link={link}
                onCopy={handleCopy}
                onEdit={handleEdit}
                onDelete={setDeleteModal}
                onGenerateQR={handleGenerateQR}
              />
            ))}
          </div>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Affichage de {(page - 1) * 10 + 1} à {Math.min(page * 10, data.total)} sur{' '}
                {data.total} liens
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
        title="Supprimer le lien"
        size="sm"
      >
        <p className="text-gray-600">
          Êtes-vous sûr de vouloir supprimer ce lien ? Cette action est irréversible.
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
