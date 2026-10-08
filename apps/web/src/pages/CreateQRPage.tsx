import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useCreateQR, useDownloadQR } from '../hooks/useQR';
import { useLinks } from '../hooks/useLinks';
import { getManagedLinkStatus, isLinkEligibleForManagedQr, managedLinkStatusLabel } from '../lib/managed-qr';
import type { Link as LinkType } from '@wrx/shared';
import {
  QrCode,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Download,
  Palette,
  Image,
  Type,
  Loader2,
  Check,
} from 'lucide-react';

type QRType = 'url' | 'text' | 'vcard' | 'wifi' | 'email' | 'phone' | 'sms';

interface QRStyle {
  foregroundColor: string;
  backgroundColor: string;
  cornerRadius: number;
  size: number;
}

export function CreateQRPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Type et contenu
  const [qrType, setQrType] = useState<QRType>('url');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState(searchParams.get('url') || '');
  const [mode, setMode] = useState<'direct' | 'managed'>(searchParams.has('linkId') ? 'managed' : 'direct');
  const [selectedLinkId, setSelectedLinkId] = useState(searchParams.get('linkId') || '');

  // Style
  const [style, setStyle] = useState<QRStyle>({
    foregroundColor: '#000000',
    backgroundColor: '#FFFFFF',
    cornerRadius: 0,
    size: 300,
  });

  // États
  const [createdQR, setCreatedQR] = useState<{ id: string; imageUrl: string; managed: boolean } | null>(null);
  const [downloadedFormat, setDownloadedFormat] = useState<'png' | 'svg' | 'pdf' | null>(null);
  const [downloadError, setDownloadError] = useState('');

  const { mutate: createQR, isPending, error } = useCreateQR();
  const { mutateAsync: downloadQR, isPending: isDownloading } = useDownloadQR();
  const { data: linksResponse, isLoading: isLoadingLinks, error: linksError } = useLinks({ page: 1, limit: 100 });
  const links = linksResponse?.data ?? [];
  const selectedLink = links.find((link) => link.id === selectedLinkId);
  const eligibleLinks = links.filter(isLinkEligibleForManagedQr);
  const createErrorMessage = error
    ? mode === 'managed'
      ? (/404|Link not found/i.test(error.message)
          ? 'Ce Lien WRX n’est plus disponible. Choisissez un autre lien actif.'
          : 'L’association n’a pas pu être enregistrée. Vérifiez le lien choisi puis réessayez.')
      : error.message
    : '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'managed' && !selectedLink) return;

    createQR(
      mode === 'managed' && selectedLink
        ? { type: 'url', title: title || undefined, content: selectedLink.originalUrl, linkId: selectedLink.id, style }
        : { type: qrType, title: title || undefined, content, style },
      {
        onSuccess: (qr) => {
          window.scrollTo({ top: 0, behavior: 'instant' });
          setCreatedQR({
            id: qr.id,
            imageUrl: qr.imageUrl || '',
            managed: mode === 'managed',
          });
        },
      }
    );
  };

  const handleCreateAnother = () => {
    setCreatedQR(null);
    setContent('');
    setTitle('');
  };

  const handleDownload = async (format: 'png' | 'svg' | 'pdf') => {
    if (!createdQR) return;
    try {
      await downloadQR({ id: createdQR.id, format, size: style.size });
      setDownloadedFormat(format);
      setDownloadError('');
      window.setTimeout(() => setDownloadedFormat(null), 1800);
    } catch {
      setDownloadError('Le téléchargement a échoué. Réessayez dans un instant.');
    }
  };

  const qrTypes: { value: QRType; label: string; placeholder: string }[] = [
    { value: 'url', label: 'URL', placeholder: 'https://exemple.com' },
    { value: 'text', label: 'Texte', placeholder: 'Votre texte ici...' },
    { value: 'email', label: 'Email', placeholder: 'contact@exemple.com' },
    { value: 'phone', label: 'Téléphone', placeholder: '+33 6 12 34 56 78' },
    { value: 'sms', label: 'SMS', placeholder: '+33 6 12 34 56 78' },
    { value: 'wifi', label: 'WiFi', placeholder: 'SSID:MonWifi;T:WPA;P:motdepasse;;' },
    { value: 'vcard', label: 'vCard', placeholder: 'BEGIN:VCARD...' },
  ];

  // Success state
  if (createdQR) {
    return (
      <div className="qr-success mx-auto max-w-2xl space-y-6">
        <div className="card text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-gray-900">Votre code est prêt.</h2>
          <p className="mt-2 text-gray-600">
            {createdQR.managed
              ? 'Ce QR géré reste identique ; les prochains scans suivront la destination actuelle du Lien WRX associé.'
              : 'Votre QR code est prêt à être téléchargé.'}
          </p>

          <div className="mt-6 flex justify-center">
            {createdQR.imageUrl ? (
              <div className="wrx-qr-stage h-64 w-64 rounded-lg border border-gray-200">
                <img src={createdQR.imageUrl} alt="QR Code généré" className="wrx-qr-assembled h-full w-full" />
                <span aria-hidden="true" className="wrx-qr-scan" />
              </div>
            ) : (
              <div className="flex h-64 w-64 items-center justify-center rounded-lg bg-gray-100">
                <QrCode size={100} className="text-gray-400" />
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <button
              onClick={() => void handleDownload('png')}
              disabled={isDownloading}
              className="btn btn-outline flex items-center gap-2"
            >
              {isDownloading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : downloadedFormat === 'png' ? (
                <Check size={18} />
              ) : (
                <Download size={18} />
              )}
              {downloadedFormat === 'png' ? 'Téléchargé' : 'PNG'}
            </button>
            <button
              onClick={() => void handleDownload('svg')}
              disabled={isDownloading}
              className="btn btn-outline flex items-center gap-2"
            >
              {isDownloading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : downloadedFormat === 'svg' ? (
                <Check size={18} />
              ) : (
                <Download size={18} />
              )}
              {downloadedFormat === 'svg' ? 'Téléchargé' : 'SVG'}
            </button>
            <button
              onClick={() => void handleDownload('pdf')}
              disabled={isDownloading}
              className="btn btn-outline flex items-center gap-2"
            >
              {isDownloading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : downloadedFormat === 'pdf' ? (
                <Check size={18} />
              ) : (
                <Download size={18} />
              )}
              {downloadedFormat === 'pdf' ? 'Téléchargé' : 'PDF'}
            </button>
          </div>

          {downloadError && <p role="alert" className="mt-4 text-sm text-red-700">{downloadError}</p>}

          <div className="mt-6 flex justify-center gap-4">
            <button onClick={handleCreateAnother} className="btn btn-outline">
              Créer un autre QR code
            </button>
            <button onClick={() => navigate('/qr-codes')} className="btn btn-primary">
              Voir tous mes QR codes
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tool-page qr-tool space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/qr-codes')}
          className="rounded-lg p-2 transition-colors hover:bg-gray-100"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Votre contenu prend forme.</h1>
          <p className="mt-1 text-gray-600">Choisissez un contenu. Regardez votre code se construire.</p>
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-4 text-red-700">
          <AlertCircle size={20} />
          <span className="text-sm">{createErrorMessage}</span>
        </div>
      )}

      <div className="qr-composer grid gap-6 lg:grid-cols-2">
        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <fieldset className="card">
            <legend className="mb-3 font-semibold text-gray-900">Mode du QR</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className={`cursor-pointer rounded-lg border p-3 ${mode === 'direct' ? 'border-primary-600 bg-primary-50' : 'border-gray-200'}`}>
                <input
                  type="radio"
                  name="qr-mode"
                  value="direct"
                  checked={mode === 'direct'}
                  onChange={() => { setMode('direct'); setQrType('url'); if (searchParams.has('linkId')) setContent(''); }}
                  className="mr-2 accent-blue-600"
                />
                <span className="font-medium text-gray-900">QR direct</span>
                <span className="mt-1 block pl-6 text-sm text-gray-600">Le contenu est encodé selon le type choisi.</span>
              </label>
              <label className={`cursor-pointer rounded-lg border p-3 ${mode === 'managed' ? 'border-amber-500 bg-amber-50' : 'border-gray-200'}`}>
                <input
                  type="radio"
                  name="qr-mode"
                  value="managed"
                  checked={mode === 'managed'}
                  onChange={() => { setMode('managed'); setQrType('url'); setContent(''); }}
                  className="mr-2 accent-amber-600"
                />
                <span className="font-medium text-gray-900">QR géré / dynamique</span>
                <span className="mt-1 block pl-6 text-sm text-gray-600">Le QR reste identique ; le Lien WRX contrôle sa destination.</span>
              </label>
            </div>
            {mode === 'managed' && (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                <p>Après l’enregistrement, ce QR utilisera une adresse WRX stable. Changer la destination du lien ne nécessite pas de réimprimer le QR. Il peut cesser de résoudre si le lien est désactivé ou expire. Sa suppression est bloquée tant qu’un QR y est associé.</p>
              </div>
            )}
          </fieldset>

          {mode === 'managed' && (
            <div className="card space-y-3">
              <label htmlFor="managed-link" className="block font-semibold text-gray-900">Lien WRX associé</label>
              {isLoadingLinks ? (
                <p role="status" className="text-sm text-gray-600">Chargement de vos liens…</p>
              ) : linksError ? (
                <p role="alert" className="text-sm text-red-700">Impossible de charger vos liens. Réessayez après avoir actualisé la page.</p>
              ) : eligibleLinks.length > 0 ? (
                <select id="managed-link" value={selectedLinkId} onChange={(event) => setSelectedLinkId(event.target.value)} className="input w-full" required>
                  <option value="">Choisir un lien actif</option>
                  {links.map((link: LinkType) => {
                    const status = getManagedLinkStatus(link);
                    const label = `${link.title || link.slug} · /r/${link.slug} · ${managedLinkStatusLabel(status)}${link.isPasswordProtected ? ' · protégé' : ''}`;
                    return <option key={link.id} value={link.id} disabled={status !== 'active'}>{label}</option>;
                  })}
                </select>
              ) : (
                <div className="space-y-3 text-sm text-gray-700">
                  <p>{links.length ? 'Aucun de vos liens n’est actuellement actif et disponible pour un QR géré.' : 'Créez d’abord un Lien WRX pour pouvoir lui associer un QR géré.'}</p>
                  <Link to="/links/new" className="btn btn-outline inline-flex min-h-11 items-center">Créer un lien WRX</Link>
                </div>
              )}
              {selectedLink && isLinkEligibleForManagedQr(selectedLink) && (
                <div className="rounded border border-gray-200 bg-gray-50 p-3 text-sm">
                  <p className="font-medium text-gray-900">{selectedLink.title || selectedLink.slug}</p>
                  <p className="mt-1 break-all text-gray-600">Destination : {selectedLink.originalUrl}</p>
                  <p className="mt-1 text-gray-600">/r/{selectedLink.slug}{selectedLink.isPasswordProtected ? ' · protégé par mot de passe' : ''}</p>
                </div>
              )}
            </div>
          )}

          {/* Type de QR */}
          {mode === 'direct' && <div className="card">
            <h3 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
              <Type size={20} className="text-primary-600" />
              Type de QR Code
            </h3>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {qrTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => {
                    setQrType(type.value);
                    setContent('');
                  }}
                  aria-pressed={qrType === type.value}
                  className={`wrx-type-control rounded-lg border px-3 py-2 text-sm font-medium ${
                    qrType === type.value
                      ? 'border-primary-600 bg-primary-50 text-primary-600'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>}

          {/* Titre */}
          <div className="card">
            <h3 className="mb-4 font-semibold text-gray-900">Titre (optionnel)</h3>
            <input
              type="text"
              aria-label="Titre du QR code"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Mon QR code..."
              className="input w-full"
            />
          </div>

          {/* Contenu */}
          {mode === 'direct' && <div className="card">
            <h3 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
              <QrCode size={20} className="text-primary-600" />
              Contenu
            </h3>
            {qrType === 'text' || qrType === 'vcard' ? (
              <textarea
                aria-label="Contenu du QR code"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={qrTypes.find((t) => t.value === qrType)?.placeholder}
                rows={4}
                required
                className="input w-full"
              />
            ) : (
              <input
                type={qrType === 'email' ? 'email' : qrType === 'url' ? 'url' : 'text'}
                aria-label="Contenu du QR code"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={qrTypes.find((t) => t.value === qrType)?.placeholder}
                required
                className="input w-full"
              />
            )}
          </div>}

          {/* Couleurs */}
          <div className="card">
            <h3 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
              <Palette size={20} className="text-primary-600" />
              Couleurs
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm text-gray-600">Couleur du QR</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    aria-label="Couleur du QR"
                    value={style.foregroundColor}
                    onChange={(e) => setStyle({ ...style, foregroundColor: e.target.value })}
                    className="h-10 w-10 cursor-pointer rounded border border-gray-300"
                  />
                  <input
                    type="text"
                    aria-label="Couleur du QR"
                    value={style.foregroundColor}
                    onChange={(e) => setStyle({ ...style, foregroundColor: e.target.value })}
                    className="input flex-1"
                  />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm text-gray-600">Couleur de fond</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    aria-label="Couleur de fond"
                    value={style.backgroundColor}
                    onChange={(e) => setStyle({ ...style, backgroundColor: e.target.value })}
                    className="h-10 w-10 cursor-pointer rounded border border-gray-300"
                  />
                  <input
                    type="text"
                    aria-label="Couleur de fond"
                    value={style.backgroundColor}
                    onChange={(e) => setStyle({ ...style, backgroundColor: e.target.value })}
                    className="input flex-1"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Taille */}
          <div className="card">
            <h3 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
              <Image size={20} className="text-primary-600" />
              Taille
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Taille du QR code</span>
                <span key={style.size} className="wrx-length-number text-xl">{style.size}<small className="ml-0.5 text-xs font-normal text-slate-500">px</small></span>
              </div>
              <input
                type="range"
                aria-label="Taille du QR code"
                min="100"
                max="500"
                step="50"
                value={style.size}
                onChange={(e) => setStyle({ ...style, size: parseInt(e.target.value) })}
                style={{ '--wrx-range-progress': `${((style.size - 100) / 400) * 100}%` } as React.CSSProperties}
                className="wrx-range w-full"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <button type="button" onClick={() => navigate('/qr-codes')} className="btn btn-outline">
              Annuler
            </button>
            <button type="submit" disabled={isPending || (mode === 'managed' ? !selectedLink || !isLinkEligibleForManagedQr(selectedLink) : !content)} className="btn btn-primary">
              {isPending ? 'Création...' : 'Créer le QR code'}
            </button>
          </div>
        </form>

        {/* Preview */}
        <div className="qr-preview-panel">
          <div className="card">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="font-semibold text-gray-900">Aperçu</h3>
              <span role="status" className={`wrx-qr-status text-xs font-medium ${content ? 'text-emerald-700' : 'text-slate-500'}`}>
                {content ? 'QR prêt' : 'En attente'}
              </span>
            </div>
            <div
              className="wrx-qr-preview-frame flex items-center justify-center rounded-lg border-2 border-dashed border-gray-200 p-8"
              style={{ backgroundColor: style.backgroundColor }}
            >
              {mode === 'managed' ? (
                <div className="max-w-sm text-center">
                  <QrCode size={76} className="mx-auto text-amber-500" aria-hidden="true" />
                  <p className="mt-4 font-medium text-gray-900">Aperçu après enregistrement</p>
                  <p className="mt-2 text-sm text-gray-600">L’adresse QR stable est attribuée à la création. Vous pourrez ensuite prévisualiser et télécharger le QR qui sera réellement imprimé.</p>
                </div>
              ) : content ? (
                <div className="wrx-qr-stage" style={{ width: style.size, maxWidth: '100%', backgroundColor: style.backgroundColor }}>
                  <QRCodeSVG value={content} size={style.size} fgColor={style.foregroundColor} bgColor={style.backgroundColor} includeMargin title="Aperçu du QR code" />
                </div>
              ) : (
                <div className="text-center">
                  <QrCode size={100} className="mx-auto text-gray-300" />
                  <p className="mt-4 text-sm text-gray-500">Entrez du contenu pour voir l'aperçu</p>
                </div>
              )}
            </div>
            <p className="qr-preview-note">APERÇU EN DIRECT / PRÊT POUR LE MONDE RÉEL</p>
          </div>
        </div>
      </div>
    </div>
  );
}
