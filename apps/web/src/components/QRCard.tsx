import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Download, MoreVertical, BarChart2, Edit, Trash2, Copy } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { QRCode } from '@wrx/shared';

interface QRCardProps {
  qr: QRCode;
  onDownload?: (qr: QRCode, format: 'png' | 'svg' | 'pdf') => void;
  onEdit?: (qr: QRCode) => void;
  onDelete?: (qr: QRCode) => void;
  onDuplicate?: (qr: QRCode) => void;
}

export function QRCard({ qr, onDownload, onEdit, onDelete, onDuplicate }: QRCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fermer le menu si on clique ailleurs
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      url: 'URL',
      vcard: 'VCard',
      wifi: 'WiFi',
      text: 'Texte',
      email: 'Email',
      phone: 'Téléphone',
      sms: 'SMS',
    };
    return labels[type] || type;
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md">
      <div className="flex gap-4">
        {/* Aperçu QR */}
        <div className="flex-shrink-0">
          <div
            className="flex h-24 w-24 items-center justify-center rounded-lg bg-gray-100"
            style={{
              backgroundColor: qr.style?.backgroundColor || '#ffffff',
            }}
          >
            {qr.imageUrl ? (
              <img
                src={qr.imageUrl}
                alt={qr.title || 'QR Code'}
                className="h-full w-full object-contain p-1"
              />
            ) : (
              <div className="h-16 w-16 rounded bg-gray-200"></div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="truncate font-medium text-gray-900">
                {qr.title || `QR Code ${qr.id.slice(0, 8)}`}
              </h3>
              <span className="mt-1 inline-block rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                {getTypeLabel(qr.type)}
              </span>
            </div>

            {/* Menu actions */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="rounded-lg p-2 transition-colors hover:bg-gray-100"
              >
                <MoreVertical size={18} className="text-gray-500" />
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 top-full z-10 mt-1 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                  <button
                    onClick={() => {
                      onEdit?.(qr);
                      setIsMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Edit size={16} />
                    Modifier
                  </button>
                  <button
                    onClick={() => {
                      onDuplicate?.(qr);
                      setIsMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Copy size={16} />
                    Dupliquer
                  </button>
                  <hr className="my-1" />
                  <div className="px-4 py-1 text-xs font-medium uppercase text-gray-400">
                    Télécharger
                  </div>
                  <button
                    onClick={() => {
                      onDownload?.(qr, 'png');
                      setIsMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Download size={16} />
                    PNG
                  </button>
                  <button
                    onClick={() => {
                      onDownload?.(qr, 'svg');
                      setIsMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Download size={16} />
                    SVG
                  </button>
                  <button
                    onClick={() => {
                      onDownload?.(qr, 'pdf');
                      setIsMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Download size={16} />
                    PDF
                  </button>
                  <hr className="my-1" />
                  <button
                    onClick={() => {
                      onDelete?.(qr);
                      setIsMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={16} />
                    Supprimer
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
            <Link
              to={`/qr-codes/${qr.id}/stats`}
              className="hover:text-primary-600 flex items-center gap-1"
            >
              <BarChart2 size={14} />
              {qr.scans || 0} scans
            </Link>
            {qr.createdAt && !isNaN(new Date(qr.createdAt).getTime()) && (
              <span>
                Créé {formatDistanceToNow(new Date(qr.createdAt), { addSuffix: true, locale: fr })}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
