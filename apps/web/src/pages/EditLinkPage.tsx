import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useLink, useUpdateLink, useDeleteLink } from '../hooks/useLinks';
import { ArrowLeftIcon, TrashIcon, ClipboardIcon, CheckIcon } from '@heroicons/react/24/outline';

export function EditLinkPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: link, isLoading: isLoadingLink, error: loadError } = useLink(id!);
  const updateLink = useUpdateLink();
  const deleteLink = useDeleteLink();

  const [formData, setFormData] = useState({
    originalUrl: '',
    slug: '',
    title: '',
    description: '',
    expiresAt: '',
    password: '',
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (link) {
      setFormData({
        originalUrl: link.originalUrl || '',
        slug: link.slug || '',
        title: link.title || '',
        description: link.description || '',
        expiresAt: link.expiresAt ? new Date(link.expiresAt).toISOString().slice(0, 16) : '',
        password: '',
      });
    }
  }, [link]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const updateData: Record<string, unknown> = {
      originalUrl: formData.originalUrl,
      title: formData.title || null,
      description: formData.description || null,
      expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null,
    };

    // Only include password if it was changed
    if (formData.password) {
      updateData['password'] = formData.password;
    }

    try {
      await updateLink.mutateAsync({ id: id!, data: updateData });
      navigate('/links');
    } catch {
      // Error handled by mutation
    }
  };

  const handleDelete = async () => {
    try {
      await deleteLink.mutateAsync(id!);
      navigate('/links');
    } catch {
      // Error handled by mutation
    }
  };

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

  if (loadError || !link) {
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

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/links"
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Modifier le lien</h1>
            <p className="text-sm text-gray-500">
              Créé le {new Date(link.createdAt).toLocaleDateString('fr-FR')}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="btn btn-outline text-red-600 hover:border-red-300 hover:bg-red-50"
        >
          <TrashIcon className="mr-2 h-4 w-4" />
          Supprimer
        </button>
      </div>

      {/* Short URL Display */}
      <div className="bg-primary-50 mb-6 rounded-lg p-4">
        <label className="text-primary-700 mb-1 block text-sm font-medium">URL raccourcie</label>
        <div className="flex items-center gap-2">
          <code className="text-primary-800 flex-1 rounded bg-white px-3 py-2 font-mono text-sm">
            {shortUrl}
          </code>
          <button
            onClick={copyToClipboard}
            className="bg-primary-600 hover:bg-primary-700 rounded-lg p-2 text-white"
            title="Copier"
          >
            {copied ? <CheckIcon className="h-5 w-5" /> : <ClipboardIcon className="h-5 w-5" />}
          </button>
        </div>
        <div className="text-primary-600 mt-2 text-sm">
          <span className="font-medium">{link.clicks || 0}</span> clics au total
        </div>
      </div>

      {/* Edit Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          {/* Original URL */}
          <div className="mb-4">
            <label htmlFor="originalUrl" className="mb-1 block text-sm font-medium text-gray-700">
              URL de destination *
            </label>
            <input
              type="url"
              id="originalUrl"
              value={formData.originalUrl}
              onChange={(e) => setFormData({ ...formData, originalUrl: e.target.value })}
              className="input"
              placeholder="https://exemple.com/ma-longue-url"
              required
            />
          </div>

          {/* Slug (readonly) */}
          <div className="mb-4">
            <label htmlFor="slug" className="mb-1 block text-sm font-medium text-gray-700">
              Slug (non modifiable)
            </label>
            <input
              type="text"
              id="slug"
              value={formData.slug}
              className="input bg-gray-50"
              disabled
            />
            <p className="mt-1 text-xs text-gray-500">
              Le slug ne peut pas être modifié après création.
            </p>
          </div>

          {/* Title */}
          <div className="mb-4">
            <label htmlFor="title" className="mb-1 block text-sm font-medium text-gray-700">
              Titre (optionnel)
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input"
              placeholder="Mon lien important"
            />
          </div>

          {/* Description */}
          <div className="mb-4">
            <label htmlFor="description" className="mb-1 block text-sm font-medium text-gray-700">
              Description (optionnel)
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input min-h-[80px]"
              placeholder="Description du lien..."
            />
          </div>

          {/* Expiration */}
          <div className="mb-4">
            <label htmlFor="expiresAt" className="mb-1 block text-sm font-medium text-gray-700">
              Date d'expiration (optionnel)
            </label>
            <input
              type="datetime-local"
              id="expiresAt"
              value={formData.expiresAt}
              onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
              className="input"
              min={new Date().toISOString().slice(0, 16)}
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
              Nouveau mot de passe (optionnel)
            </label>
            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="input"
              placeholder="Laisser vide pour ne pas changer"
            />
            <p className="mt-1 text-xs text-gray-500">
              {link.passwordHash
                ? 'Ce lien est protégé. Entrez un nouveau mot de passe pour le changer.'
                : 'Ajoutez un mot de passe pour protéger ce lien.'}
            </p>
          </div>
        </div>

        {/* Error Message */}
        {updateLink.error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
            {(updateLink.error as Error).message || 'Erreur lors de la mise à jour'}
          </div>
        )}

        {/* Submit Buttons */}
        <div className="flex gap-3">
          <Link to="/links" className="btn btn-outline flex-1">
            Annuler
          </Link>
          <button type="submit" disabled={updateLink.isPending} className="btn btn-primary flex-1">
            {updateLink.isPending ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
        </div>
      </form>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <h3 className="text-lg font-semibold text-gray-900">Supprimer le lien ?</h3>
            <p className="mt-2 text-gray-600">
              Cette action est irréversible. Toutes les statistiques associées seront également
              supprimées.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn btn-outline flex-1"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLink.isPending}
                className="btn flex-1 bg-red-600 text-white hover:bg-red-700"
              >
                {deleteLink.isPending ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
