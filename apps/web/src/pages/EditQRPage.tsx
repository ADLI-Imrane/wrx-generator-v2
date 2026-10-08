import { Modal } from '../components/Modal';
import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQRCode, useUpdateQRCode, useDeleteQRCode } from '../hooks/useQR';
import { useLinks } from '../hooks/useLinks';
import { getManagedLinkStatus, isLinkEligibleForManagedQr, managedLinkStatusLabel } from '../lib/managed-qr';
import { ArrowLeftIcon, TrashIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

type QRType = 'url' | 'vcard' | 'wifi' | 'text' | 'email' | 'phone' | 'sms';

export function EditQRPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: qrCode, isLoading: isLoadingQR, error: loadError } = useQRCode(id!);
  const updateQRCode = useUpdateQRCode();
  const deleteQRCode = useDeleteQRCode();
  const { data: linksResponse, isLoading: isLoadingLinks, error: linksError } = useLinks({ page: 1, limit: 100 });
  const links = linksResponse?.data ?? [];
  const [mode, setMode] = useState<'direct' | 'managed'>('direct');
  const [selectedLinkId, setSelectedLinkId] = useState('');
  const selectedLink = links.find((link) => link.id === selectedLinkId)
    ?? (qrCode?.linkedLink?.id === selectedLinkId ? qrCode.linkedLink : undefined);

  const [formData, setFormData] = useState({
    title: '',
    type: 'url' as QRType,
    content: '',
    foregroundColor: '#000000',
    backgroundColor: '#FFFFFF',
    logoUrl: '',
    // Type-specific fields
    url: '',
    text: '',
    email: '',
    emailSubject: '',
    emailBody: '',
    phone: '',
    smsBody: '',
    wifiSsid: '',
    wifiPassword: '',
    wifiEncryption: 'WPA' as 'WPA' | 'WEP' | 'nopass',
    vcardName: '',
    vcardCompany: '',
    vcardPhone: '',
    vcardEmail: '',
    vcardWebsite: '',
    vcardAddress: '',
  });
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (qrCode) {
      setMode(qrCode.routingMode === 'managed_link' ? 'managed' : 'direct');
      setSelectedLinkId(qrCode.linkId || '');
      const style = qrCode.style || {};
      setFormData({
        title: qrCode.title || '',
        type: (qrCode.type as QRType) || 'url',
        content: qrCode.content || '',
        foregroundColor: style.foregroundColor || '#000000',
        backgroundColor: style.backgroundColor || '#FFFFFF',
        logoUrl: style.logoUrl || '',
        url: qrCode.type === 'url' ? qrCode.content || '' : '',
        text: qrCode.type === 'text' ? qrCode.content || '' : '',
        email: '',
        emailSubject: '',
        emailBody: '',
        phone: '',
        smsBody: '',
        wifiSsid: '',
        wifiPassword: '',
        wifiEncryption: 'WPA',
        vcardName: '',
        vcardCompany: '',
        vcardPhone: '',
        vcardEmail: '',
        vcardWebsite: '',
        vcardAddress: '',
      });

      if (qrCode.imageUrl) {
        setPreviewUrl(qrCode.imageUrl);
      }
    }
  }, [qrCode]);

  const generateContent = (): string => {
    switch (formData.type) {
      case 'url':
        return formData.url;
      case 'text':
        return formData.text;
      case 'email':
        return `mailto:${formData.email}?subject=${encodeURIComponent(formData.emailSubject)}&body=${encodeURIComponent(formData.emailBody)}`;
      case 'phone':
        return `tel:${formData.phone}`;
      case 'sms':
        return `sms:${formData.phone}${formData.smsBody ? `?body=${encodeURIComponent(formData.smsBody)}` : ''}`;
      case 'wifi':
        return `WIFI:T:${formData.wifiEncryption};S:${formData.wifiSsid};P:${formData.wifiPassword};;`;
      case 'vcard':
        return `BEGIN:VCARD
VERSION:3.0
N:${formData.vcardName}
ORG:${formData.vcardCompany}
TEL:${formData.vcardPhone}
EMAIL:${formData.vcardEmail}
URL:${formData.vcardWebsite}
ADR:${formData.vcardAddress}
END:VCARD`;
      default:
        return '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const content = generateContent();

    try {
      if (mode === 'managed' && (!selectedLink || (selectedLinkId !== qrCode?.linkId && !isLinkEligibleForManagedQr(selectedLink)))) return;

      await updateQRCode.mutateAsync({
        id: id!,
        data: {
          title: formData.title,
          type: mode === 'managed' ? 'url' : formData.type,
          ...(mode === 'managed'
            ? { linkId: selectedLink!.id }
            : qrCode?.routingMode === 'managed_link'
              ? { content, linkId: null }
              : { content }),
          style: {
            foregroundColor: formData.foregroundColor,
            backgroundColor: formData.backgroundColor,
            logoUrl: formData.logoUrl || undefined,
            style: 'squares',
            margin: 4,
          },
        },
      });
      navigate('/qr-codes');
    } catch {
      // Error handled by mutation
    }
  };

  const handleDelete = async () => {
    try {
      await deleteQRCode.mutateAsync(id!);
      navigate('/qr-codes');
    } catch {
      // Error handled by mutation
    }
  };

  const handleDownload = () => {
    if (previewUrl) {
      const link = document.createElement('a');
      link.href = previewUrl;
      link.download = `${formData.title || 'qr-code'}.png`;
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

  if (loadError || !qrCode) {
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

  const typeLabels: Record<QRType, string> = {
    url: 'URL',
    vcard: 'Carte de visite',
    wifi: 'WiFi',
    text: 'Texte',
    email: 'Email',
    phone: 'Téléphone',
    sms: 'SMS',
  };

  return (
    <div className="tool-page qr-tool">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/qr-codes"
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Modifier le QR Code</h1>
            <p className="text-sm text-gray-500">
              Créé le {new Date(qrCode.createdAt).toLocaleDateString('fr-FR')}
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

      <div className="qr-composer grid gap-6 lg:grid-cols-2">
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="card">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Informations</h2>

            <div className="mb-4">
              <label htmlFor="title" className="mb-1 block text-sm font-medium text-gray-700">
                Titre du QR Code *
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="input"
                placeholder="Mon QR Code"
                required
              />
            </div>

            <fieldset className="mb-4">
              <legend className="mb-2 text-sm font-medium text-gray-700">Mode du QR</legend>
              <div className="flex flex-wrap gap-3">
                <label className={`rounded-lg border px-3 py-2 ${mode === 'direct' ? 'border-primary-600 bg-primary-50' : 'border-gray-200'}`}>
                  <input type="radio" name="edit-qr-mode" checked={mode === 'direct'} onChange={() => {
                    if (mode === 'managed') setFormData((current) => ({ ...current, type: 'url', url: '' }));
                    setMode('direct');
                  }} className="mr-2 accent-blue-600" />
                  QR direct
                </label>
                <label className={`rounded-lg border px-3 py-2 ${mode === 'managed' ? 'border-amber-500 bg-amber-50' : 'border-gray-200'}`}>
                  <input type="radio" name="edit-qr-mode" checked={mode === 'managed'} onChange={() => {
                    setMode('managed');
                    setFormData((current) => ({ ...current, type: 'url' }));
                  }} className="mr-2 accent-amber-600" />
                  QR géré / dynamique
                </label>
              </div>
              {qrCode.routingMode === 'managed_link' && mode === 'direct' && (
                <p className="mt-3 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
                  Pour détacher ce QR, saisissez un nouveau contenu direct. Le lien actuel reste associé jusqu’à l’enregistrement.
                </p>
              )}
              {mode === 'managed' && (
                <p className="mt-3 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
                  Le QR imprimé reste identique. Le Lien WRX associé détermine la destination des prochains scans.
                </p>
              )}
            </fieldset>

            {mode === 'managed' && (
              <div className="mb-4 space-y-2">
                <label htmlFor="edit-managed-link" className="block text-sm font-medium text-gray-700">Lien WRX associé</label>
                {isLoadingLinks ? <p role="status" className="text-sm text-gray-600">Chargement de vos liens…</p> : linksError ? (
                  <p role="alert" className="text-sm text-red-700">Impossible de charger vos liens. Actualisez la page pour réessayer.</p>
                ) : (
                  <select id="edit-managed-link" value={selectedLinkId} onChange={(event) => setSelectedLinkId(event.target.value)} className="input w-full" required>
                    <option value="">Choisir un lien actif</option>
                    {qrCode.linkId && !links.some((link) => link.id === qrCode.linkId) && <option value={qrCode.linkId}>Lien associé indisponible</option>}
                    {links.map((link) => {
                      const status = getManagedLinkStatus(link);
                      return <option key={link.id} value={link.id} disabled={status !== 'active'}>{`${link.title || link.slug} · /r/${link.slug} · ${managedLinkStatusLabel(status)}${link.isPasswordProtected ? ' · protégé' : ''}`}</option>;
                    })}
                  </select>
                )}
                {selectedLink && (
                  <p className="break-all rounded border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
                    Destination actuelle : {selectedLink.originalUrl}{selectedLink.isPasswordProtected ? ' · protégé par mot de passe' : ''}
                  </p>
                )}
                {links.length === 0 && !isLoadingLinks && !linksError && <Link to="/links/new" className="btn btn-outline inline-flex min-h-11 items-center">Créer un lien WRX</Link>}
              </div>
            )}

            {mode === 'direct' && <div>
              <label htmlFor="type" className="mb-1 block text-sm font-medium text-gray-700">
                Type
              </label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as QRType })}
                className="input"
              >
                {Object.entries(typeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>}
          </div>

          {/* Type-specific Content */}
          {mode === 'direct' && <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Contenu</h2>

            {formData.type === 'url' && (
              <div>
                <label htmlFor="url" className="mb-1 block text-sm font-medium text-gray-700">
                  URL *
                </label>
                <input
                  type="url"
                  id="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="input"
                  placeholder="https://exemple.com"
                  required
                />
              </div>
            )}

            {formData.type === 'text' && (
              <div>
                <label htmlFor="text" className="mb-1 block text-sm font-medium text-gray-700">
                  Texte *
                </label>
                <textarea
                  id="text"
                  value={formData.text}
                  onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                  className="input min-h-[100px]"
                  placeholder="Votre texte ici..."
                  required
                />
              </div>
            )}

            {formData.type === 'email' && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
                    Adresse email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input"
                    placeholder="contact@exemple.com"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="emailSubject"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Sujet
                  </label>
                  <input
                    type="text"
                    id="emailSubject"
                    value={formData.emailSubject}
                    onChange={(e) => setFormData({ ...formData, emailSubject: e.target.value })}
                    className="input"
                    placeholder="Sujet du mail"
                  />
                </div>
                <div>
                  <label
                    htmlFor="emailBody"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Corps du message
                  </label>
                  <textarea
                    id="emailBody"
                    value={formData.emailBody}
                    onChange={(e) => setFormData({ ...formData, emailBody: e.target.value })}
                    className="input min-h-[80px]"
                    placeholder="Votre message..."
                  />
                </div>
              </div>
            )}

            {(formData.type === 'phone' || formData.type === 'sms') && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="phone" className="mb-1 block text-sm font-medium text-gray-700">
                    Numéro de téléphone *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input"
                    placeholder="+33612345678"
                    required
                  />
                </div>
                {formData.type === 'sms' && (
                  <div>
                    <label
                      htmlFor="smsBody"
                      className="mb-1 block text-sm font-medium text-gray-700"
                    >
                      Message SMS
                    </label>
                    <textarea
                      id="smsBody"
                      value={formData.smsBody}
                      onChange={(e) => setFormData({ ...formData, smsBody: e.target.value })}
                      className="input min-h-[80px]"
                      placeholder="Votre message SMS..."
                    />
                  </div>
                )}
              </div>
            )}

            {formData.type === 'wifi' && (
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="wifiSsid"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Nom du réseau (SSID) *
                  </label>
                  <input
                    type="text"
                    id="wifiSsid"
                    value={formData.wifiSsid}
                    onChange={(e) => setFormData({ ...formData, wifiSsid: e.target.value })}
                    className="input"
                    placeholder="MonWiFi"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="wifiPassword"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Mot de passe
                  </label>
                  <input
                    type="text"
                    id="wifiPassword"
                    value={formData.wifiPassword}
                    onChange={(e) => setFormData({ ...formData, wifiPassword: e.target.value })}
                    className="input"
                    placeholder="motdepasse123"
                  />
                </div>
                <div>
                  <label
                    htmlFor="wifiEncryption"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Sécurité
                  </label>
                  <select
                    id="wifiEncryption"
                    value={formData.wifiEncryption}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        wifiEncryption: e.target.value as 'WPA' | 'WEP' | 'nopass',
                      })
                    }
                    className="input"
                  >
                    <option value="WPA">WPA/WPA2</option>
                    <option value="WEP">WEP</option>
                    <option value="nopass">Sans mot de passe</option>
                  </select>
                </div>
              </div>
            )}

            {formData.type === 'vcard' && (
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="vcardName"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Nom complet *
                  </label>
                  <input
                    type="text"
                    id="vcardName"
                    value={formData.vcardName}
                    onChange={(e) => setFormData({ ...formData, vcardName: e.target.value })}
                    className="input"
                    placeholder="Jean Dupont"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="vcardCompany"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Entreprise
                  </label>
                  <input
                    type="text"
                    id="vcardCompany"
                    value={formData.vcardCompany}
                    onChange={(e) => setFormData({ ...formData, vcardCompany: e.target.value })}
                    className="input"
                    placeholder="Ma Société"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="vcardPhone"
                      className="mb-1 block text-sm font-medium text-gray-700"
                    >
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      id="vcardPhone"
                      value={formData.vcardPhone}
                      onChange={(e) => setFormData({ ...formData, vcardPhone: e.target.value })}
                      className="input"
                      placeholder="+33612345678"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="vcardEmail"
                      className="mb-1 block text-sm font-medium text-gray-700"
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      id="vcardEmail"
                      value={formData.vcardEmail}
                      onChange={(e) => setFormData({ ...formData, vcardEmail: e.target.value })}
                      className="input"
                      placeholder="jean@exemple.com"
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="vcardWebsite"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Site web
                  </label>
                  <input
                    type="url"
                    id="vcardWebsite"
                    value={formData.vcardWebsite}
                    onChange={(e) => setFormData({ ...formData, vcardWebsite: e.target.value })}
                    className="input"
                    placeholder="https://mon-site.com"
                  />
                </div>
                <div>
                  <label
                    htmlFor="vcardAddress"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Adresse
                  </label>
                  <input
                    type="text"
                    id="vcardAddress"
                    value={formData.vcardAddress}
                    onChange={(e) => setFormData({ ...formData, vcardAddress: e.target.value })}
                    className="input"
                    placeholder="123 Rue Example, 75001 Paris"
                  />
                </div>
              </div>
            )}
          </div>}

          {/* Style */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Style</h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="foregroundColor"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Couleur du QR
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    id="foregroundColor"
                    value={formData.foregroundColor}
                    onChange={(e) => setFormData({ ...formData, foregroundColor: e.target.value })}
                    className="h-10 w-14 cursor-pointer rounded border border-gray-300"
                  />
                  <input
                    type="text"
                    value={formData.foregroundColor}
                    onChange={(e) => setFormData({ ...formData, foregroundColor: e.target.value })}
                    className="input flex-1"
                    pattern="^#[0-9A-Fa-f]{6}$"
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="backgroundColor"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Couleur de fond
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    id="backgroundColor"
                    value={formData.backgroundColor}
                    onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                    className="h-10 w-14 cursor-pointer rounded border border-gray-300"
                  />
                  <input
                    type="text"
                    value={formData.backgroundColor}
                    onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                    className="input flex-1"
                    pattern="^#[0-9A-Fa-f]{6}$"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4">
              <label htmlFor="logoUrl" className="mb-1 block text-sm font-medium text-gray-700">
                URL du logo (optionnel)
              </label>
              <input
                type="url"
                id="logoUrl"
                value={formData.logoUrl}
                onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                className="input"
                placeholder="https://exemple.com/logo.png"
              />
            </div>
          </div>

          {/* Error Message */}
          {updateQRCode.error && (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
              {mode === 'managed'
                ? (/404|Link not found/i.test(updateQRCode.error.message)
                    ? 'Ce Lien WRX n’est plus disponible. Choisissez un autre lien actif.'
                    : 'L’association n’a pas pu être enregistrée. Vérifiez le lien choisi puis réessayez.')
                : updateQRCode.error.message || 'Erreur lors de la mise à jour'}
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex gap-3">
            <Link to="/qr-codes" className="btn btn-outline flex-1">
              Annuler
            </Link>
            <button
              type="submit"
              disabled={updateQRCode.isPending || (mode === 'managed' && (!selectedLink || (selectedLinkId !== qrCode.linkId && !isLinkEligibleForManagedQr(selectedLink))))}
              className="btn btn-primary flex-1"
            >
              {updateQRCode.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>

        {/* Preview */}
        <div className="qr-preview-panel">
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">{qrCode.routingMode === 'managed_link' ? 'Aperçu du QR stable' : 'Aperçu'}</h2>
              {previewUrl && (
                <button type="button" onClick={handleDownload} className="btn btn-outline btn-sm">
                  <ArrowDownTrayIcon className="mr-1 h-4 w-4" />
                  Télécharger
                </button>
              )}
            </div>

            <div
              className="wrx-qr-preview-frame flex aspect-square items-center justify-center rounded-lg border-2 border-dashed border-gray-200"
              style={{ backgroundColor: formData.backgroundColor }}
            >
              {previewUrl ? (
                <img src={previewUrl} alt="QR Code Preview" className="max-h-full max-w-full" />
              ) : (
                <p className="text-center text-gray-400">L'aperçu apparaîtra ici</p>
              )}
            </div>

            {qrCode.routingMode === 'managed_link' && (
              <p className="mt-3 text-center text-sm text-gray-600">
                Ce QR encode l’entrée WRX stable. La destination actuelle est contrôlée par le Lien WRX associé.
              </p>
            )}
            <div className="mt-4 text-center text-sm text-gray-500">
              <span className="font-medium">{qrCode.scans || 0}</span> scans au total
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Supprimer le QR Code ?" size="sm">
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
                disabled={deleteQRCode.isPending}
                className="btn flex-1 bg-red-600 text-white hover:bg-red-700"
              >
                {deleteQRCode.isPending ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
      </Modal>
    </div>
  );
}
