import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateLink } from '../hooks/useLinks';
import {
  Link as LinkIcon,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Copy,
  ExternalLink,
  Calendar,
  Lock,
  Shuffle,
  Sparkles,
} from 'lucide-react';

export function CreateLinkPage() {
  const navigate = useNavigate();

  const [originalUrl, setOriginalUrl] = useState('');
  const [title, setTitle] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [useCustomSlug, setUseCustomSlug] = useState(false);
  const [expiresAt, setExpiresAt] = useState('');
  const [password, setPassword] = useState('');
  const [usePassword, setUsePassword] = useState(false);

  const [createdLink, setCreatedLink] = useState<{
    shortUrl: string;
    slug: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const { mutate: createLink, isPending, error } = useCreateLink();

  const generateRandomSlug = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let slug = '';
    for (let i = 0; i < 6; i++) {
      slug += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCustomSlug(slug);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      originalUrl,
      title: title || undefined,
      slug: useCustomSlug && customSlug ? customSlug : undefined,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      password: usePassword && password ? password : undefined,
    };

    createLink(data, {
      onSuccess: (link) => {
        const shortUrl = `${import.meta.env.VITE_SHORT_URL_BASE || 'http://localhost:3000'}/${link.slug}`;
        setCreatedLink({ shortUrl, slug: link.slug });
      },
    });
  };

  const handleCopy = async () => {
    if (createdLink) {
      await navigator.clipboard.writeText(createdLink.shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCreateAnother = () => {
    setCreatedLink(null);
    setOriginalUrl('');
    setTitle('');
    setCustomSlug('');
    setUseCustomSlug(false);
    setExpiresAt('');
    setPassword('');
    setUsePassword(false);
  };

  // Success state
  if (createdLink) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="card text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-gray-900">Lien créé avec succès !</h2>
          <p className="mt-2 text-gray-600">Votre lien court est prêt à être partagé.</p>

          <div className="mt-6 rounded-lg bg-gray-50 p-4">
            <label className="mb-2 block text-sm font-medium text-gray-700">Votre lien court</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={createdLink.shortUrl}
                className="input flex-1 bg-white text-center font-mono"
              />
              <button
                onClick={handleCopy}
                className={`btn ${copied ? 'bg-green-600 text-white' : 'btn-primary'}`}
              >
                {copied ? <CheckCircle size={18} /> : <Copy size={18} />}
              </button>
              <a
                href={createdLink.shortUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline"
              >
                <ExternalLink size={18} />
              </a>
            </div>
          </div>

          <div className="mt-6 flex justify-center gap-4">
            <button onClick={handleCreateAnother} className="btn btn-outline">
              <Sparkles size={18} />
              Créer un autre lien
            </button>
            <button onClick={() => navigate('/links')} className="btn btn-primary">
              Voir tous mes liens
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/links')}
          className="rounded-lg p-2 transition-colors hover:bg-gray-100"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Créer un lien court</h1>
          <p className="mt-1 text-gray-600">Raccourcissez vos URLs longues en un clic</p>
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-4 text-red-700">
          <AlertCircle size={20} />
          <span className="text-sm">{(error as Error).message}</span>
        </div>
      )}

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* URL originale */}
        <div className="card">
          <h3 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
            <LinkIcon size={20} className="text-primary-600" />
            URL à raccourcir
          </h3>
          <input
            type="url"
            value={originalUrl}
            onChange={(e) => setOriginalUrl(e.target.value)}
            placeholder="https://exemple.com/une-tres-longue-url-a-raccourcir"
            required
            className="input w-full"
          />
        </div>

        {/* Titre (optionnel) */}
        <div className="card">
          <h3 className="mb-4 font-semibold text-gray-900">Titre (optionnel)</h3>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Mon lien vers..."
            className="input w-full"
          />
          <p className="mt-2 text-xs text-gray-500">
            Un titre pour vous aider à identifier ce lien dans votre dashboard.
          </p>
        </div>

        {/* Slug personnalisé */}
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Slug personnalisé</h3>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={useCustomSlug}
                onChange={(e) => setUseCustomSlug(e.target.checked)}
                className="text-primary-600 rounded border-gray-300"
              />
              <span className="text-sm text-gray-600">Personnaliser</span>
            </label>
          </div>
          {useCustomSlug && (
            <div className="flex items-center gap-2">
              <div className="flex flex-1 items-center rounded-lg border border-gray-300 bg-gray-50">
                <span className="px-3 text-sm text-gray-500">
                  {import.meta.env.VITE_SHORT_URL_BASE || 'http://localhost:3000/r'}/
                </span>
                <input
                  type="text"
                  value={customSlug}
                  onChange={(e) =>
                    setCustomSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                  }
                  placeholder="mon-lien"
                  pattern="^[a-z0-9-]+$"
                  maxLength={50}
                  className="flex-1 border-0 bg-transparent px-2 py-2.5 outline-none"
                />
              </div>
              <button
                type="button"
                onClick={generateRandomSlug}
                className="btn btn-outline flex items-center gap-2"
              >
                <Shuffle size={18} />
                Générer
              </button>
            </div>
          )}
          <p className="mt-2 text-xs text-gray-500">
            Lettres minuscules, chiffres et tirets uniquement. Si vide, un slug sera généré
            automatiquement.
          </p>
        </div>

        {/* Date d'expiration */}
        <div className="card">
          <div className="mb-4 flex items-center gap-2">
            <Calendar size={20} className="text-primary-600" />
            <h3 className="font-semibold text-gray-900">Date d'expiration (optionnel)</h3>
          </div>
          <input
            type="datetime-local"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            min={new Date().toISOString().slice(0, 16)}
            className="input w-full"
          />
          <p className="mt-2 text-xs text-gray-500">
            Le lien sera automatiquement désactivé après cette date.
          </p>
        </div>

        {/* Protection par mot de passe */}
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock size={20} className="text-primary-600" />
              <h3 className="font-semibold text-gray-900">Protection par mot de passe</h3>
            </div>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={usePassword}
                onChange={(e) => setUsePassword(e.target.checked)}
                className="text-primary-600 rounded border-gray-300"
              />
              <span className="text-sm text-gray-600">Activer</span>
            </label>
          </div>
          {usePassword && (
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mot de passe pour accéder au lien"
              className="input w-full"
            />
          )}
          <p className="mt-2 text-xs text-gray-500">
            Les visiteurs devront entrer ce mot de passe pour accéder à l'URL originale.
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <button type="button" onClick={() => navigate('/links')} className="btn btn-outline">
            Annuler
          </button>
          <button type="submit" disabled={isPending || !originalUrl} className="btn btn-primary">
            {isPending ? 'Création...' : 'Créer le lien'}
          </button>
        </div>
      </form>
    </div>
  );
}
