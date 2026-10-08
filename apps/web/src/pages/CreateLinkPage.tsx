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
  ArrowRight,
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
    originalUrl: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState('');

  const { mutate: createLink, isPending, error } = useCreateLink();
  let destinationHost = '';
  try {
    const parsed = new URL(originalUrl);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') destinationHost = parsed.hostname;
  } catch {
    // The native URL input provides the validation message.
  }

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
          window.scrollTo({ top: 0, behavior: 'instant' });
        setCreatedLink({ shortUrl: link.shortUrl, slug: link.slug, originalUrl });
      },
    });
  };

  const handleCopy = async () => {
    if (createdLink) {
      try {
        await navigator.clipboard.writeText(createdLink.shortUrl);
        setCopied(true);
        setCopyError('');
        window.setTimeout(() => setCopied(false), 1800);
      } catch {
        setCopyError('Le presse-papiers est inaccessible. Copiez le lien depuis le champ.');
      }
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
      <div className="tool-page link-tool space-y-6">
        <div className="card wrx-link-success text-left">
          <div role="status" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.14em] text-emerald-700"><CheckCircle size={16} /> Lien créé</div>
          <h2 className="mt-3 text-2xl font-bold text-gray-900">Une destination. Un lien plus net.</h2>
          <p className="mt-1 text-sm text-gray-600">Votre lien est prêt à être partagé.</p>

          <div className="wrx-link-result mt-7">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Destination</p>
            <p className="wrx-link-source mt-2 truncate font-mono text-sm text-slate-600" title={createdLink.originalUrl}>{createdLink.originalUrl}</p>
            <div aria-hidden="true" className="wrx-link-route my-4"><span className="wrx-link-route-packet" /><ArrowRight size={17} /></div>
            <label htmlFor="created-short-link" className="text-xs font-semibold uppercase tracking-wider text-cyan-800">Lien WRX</label>
            <p className="wrx-link-resolved mt-2 break-all font-mono text-xl font-semibold text-slate-950 sm:text-2xl">{createdLink.shortUrl}</p>
            <div className="mt-5 flex items-center gap-2">
              <input
                id="created-short-link"
                type="text"
                readOnly
                value={createdLink.shortUrl}
                className="input min-w-0 flex-1 bg-white font-mono"
              />
              <button
                onClick={handleCopy}
                aria-live="polite"
                className={`btn wrx-copy-action ${copied ? 'bg-green-700 text-white' : 'btn-primary'}`}
                data-copied={copied}
                aria-label={copied ? 'Lien copié' : 'Copier le lien court'}
              >
                {copied ? <CheckCircle size={18} /> : <Copy size={18} />}
                <span className="hidden sm:inline">{copied ? 'Copié' : 'Copier'}</span>
              </button>
              <a
                href={createdLink.shortUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline"
                aria-label="Ouvrir le lien court"
              >
                <ExternalLink size={18} />
              </a>
            </div>
            {copyError && <p role="alert" className="mt-2 text-left text-sm text-red-700">{copyError}</p>}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
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
    <div className="tool-page link-tool space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/links')}
          className="rounded-lg p-2 transition-colors hover:bg-gray-100"
        >
          <ArrowLeft size={20} aria-label="Retour aux liens" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Une adresse. Plus directe.</h1>
          <p className="mt-1 text-gray-600">Définissez la destination. WRX s’occupe du raccourci.</p>
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
      <form onSubmit={handleSubmit} className="link-composer">
        {/* URL originale */}
        <div className="card">
          <h3 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
            <LinkIcon size={20} className="text-primary-600" />
            URL à raccourcir
          </h3>
          <input
            type="url"
            aria-label="URL à raccourcir"
            value={originalUrl}
            onChange={(e) => setOriginalUrl(e.target.value)}
            placeholder="https://exemple.com/une-tres-longue-url-a-raccourcir"
            required
            className="input w-full"
          />
          {destinationHost && <p role="status" className="wrx-input-recognized mt-3 flex items-center gap-2 text-xs font-medium text-cyan-800"><span className="wrx-input-pulse" /> Destination détectée · {destinationHost}</p>}
        </div>

        {/* Titre (optionnel) */}
        <div className="card">
          <h3 className="mb-4 font-semibold text-gray-900">Titre (optionnel)</h3>
          <input
            type="text"
            aria-label="Titre du lien"
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
                  aria-label="Slug personnalisé"
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
            aria-label="Date d’expiration"
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
              aria-label="Protection par mot de passe"
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
          <button type="submit" disabled={isPending || !originalUrl} className="btn btn-primary wrx-shorten-button" data-pending={isPending}>
            {isPending ? 'Raccourcissement…' : 'Créer le lien'} <ArrowRight size={17} />
          </button>
        </div>
      </form>
    </div>
  );
}
