import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCreateQR, useGenerateQRPreview, useDownloadQR } from '../hooks/useQR';
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

  // Style
  const [style, setStyle] = useState<QRStyle>({
    foregroundColor: '#000000',
    backgroundColor: '#FFFFFF',
    cornerRadius: 0,
    size: 300,
  });

  // Preview
  const [preview, setPreview] = useState<string | null>(null);

  // États
  const [createdQR, setCreatedQR] = useState<{ id: string; imageUrl: string } | null>(null);

  const { mutate: createQR, isPending, error } = useCreateQR();
  const { mutate: generatePreview, isPending: isGeneratingPreview } = useGenerateQRPreview();
  const { mutate: downloadQR, isPending: isDownloading } = useDownloadQR();

  // Générer le preview quand le contenu change
  useEffect(() => {
    if (content.length > 3) {
      const debounce = setTimeout(() => {
        generatePreview(
          {
            type: qrType,
            content,
            style,
          },
          {
            onSuccess: (previewData) => setPreview(previewData),
          }
        );
      }, 500);
      return () => clearTimeout(debounce);
    } else {
      setPreview(null);
    }
  }, [content, qrType, style, generatePreview]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    createQR(
      {
        type: qrType,
        title: title || undefined,
        content,
        style,
      },
      {
        onSuccess: (qr) => {
          setCreatedQR({
            id: qr.id,
            imageUrl: qr.imageUrl || preview || '',
          });
        },
      }
    );
  };

  const handleCreateAnother = () => {
    setCreatedQR(null);
    setContent('');
    setTitle('');
    setPreview(null);
  };

  const handleDownload = (format: 'png' | 'svg' | 'pdf') => {
    if (!createdQR) return;
    downloadQR({ id: createdQR.id, format, size: style.size });
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
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="card text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-gray-900">QR Code créé avec succès !</h2>
          <p className="mt-2 text-gray-600">Votre QR code est prêt à être téléchargé.</p>

          <div className="mt-6 flex justify-center">
            {createdQR.imageUrl ? (
              <img
                src={createdQR.imageUrl}
                alt="QR Code généré"
                className="h-64 w-64 rounded-lg border border-gray-200"
              />
            ) : (
              <div className="flex h-64 w-64 items-center justify-center rounded-lg bg-gray-100">
                <QrCode size={100} className="text-gray-400" />
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <button
              onClick={() => handleDownload('png')}
              disabled={isDownloading}
              className="btn btn-outline flex items-center gap-2"
            >
              {isDownloading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Download size={18} />
              )}
              PNG
            </button>
            <button
              onClick={() => handleDownload('svg')}
              disabled={isDownloading}
              className="btn btn-outline flex items-center gap-2"
            >
              {isDownloading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Download size={18} />
              )}
              SVG
            </button>
            <button
              onClick={() => handleDownload('pdf')}
              disabled={isDownloading}
              className="btn btn-outline flex items-center gap-2"
            >
              {isDownloading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Download size={18} />
              )}
              PDF
            </button>
          </div>

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
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/qr-codes')}
          className="rounded-lg p-2 transition-colors hover:bg-gray-100"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Créer un QR Code</h1>
          <p className="mt-1 text-gray-600">Personnalisez votre QR code selon vos besoins</p>
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-4 text-red-700">
          <AlertCircle size={20} />
          <span className="text-sm">{(error as Error).message}</span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Type de QR */}
          <div className="card">
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
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    qrType === type.value
                      ? 'border-primary-600 bg-primary-50 text-primary-600'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Titre */}
          <div className="card">
            <h3 className="mb-4 font-semibold text-gray-900">Titre (optionnel)</h3>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Mon QR code..."
              className="input w-full"
            />
          </div>

          {/* Contenu */}
          <div className="card">
            <h3 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
              <QrCode size={20} className="text-primary-600" />
              Contenu
            </h3>
            {qrType === 'text' || qrType === 'vcard' ? (
              <textarea
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
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={qrTypes.find((t) => t.value === qrType)?.placeholder}
                required
                className="input w-full"
              />
            )}
          </div>

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
                    value={style.foregroundColor}
                    onChange={(e) => setStyle({ ...style, foregroundColor: e.target.value })}
                    className="h-10 w-10 cursor-pointer rounded border border-gray-300"
                  />
                  <input
                    type="text"
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
                    value={style.backgroundColor}
                    onChange={(e) => setStyle({ ...style, backgroundColor: e.target.value })}
                    className="h-10 w-10 cursor-pointer rounded border border-gray-300"
                  />
                  <input
                    type="text"
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
                <span className="text-sm font-medium">{style.size}px</span>
              </div>
              <input
                type="range"
                min="100"
                max="500"
                step="50"
                value={style.size}
                onChange={(e) => setStyle({ ...style, size: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <button type="button" onClick={() => navigate('/qr-codes')} className="btn btn-outline">
              Annuler
            </button>
            <button type="submit" disabled={isPending || !content} className="btn btn-primary">
              {isPending ? 'Création...' : 'Créer le QR code'}
            </button>
          </div>
        </form>

        {/* Preview */}
        <div className="lg:sticky lg:top-6">
          <div className="card">
            <h3 className="mb-4 font-semibold text-gray-900">Aperçu</h3>
            <div
              className="flex items-center justify-center rounded-lg border-2 border-dashed border-gray-200 p-8"
              style={{ backgroundColor: style.backgroundColor }}
            >
              {isGeneratingPreview ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="border-primary-600 h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
                  <span className="text-sm text-gray-500">Génération...</span>
                </div>
              ) : preview ? (
                <img
                  src={preview}
                  alt="QR Code preview"
                  style={{ width: style.size, height: style.size, maxWidth: '100%' }}
                />
              ) : (
                <div className="text-center">
                  <QrCode size={100} className="mx-auto text-gray-300" />
                  <p className="mt-4 text-sm text-gray-500">Entrez du contenu pour voir l'aperçu</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
