import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Copy, ExternalLink, MoreVertical, BarChart2, Edit, Trash2, QrCode } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import type { Link as LinkType } from '@wrx/shared';

interface LinkCardProps {
  link: LinkType;
  onCopy?: (shortUrl: string) => void;
  onEdit?: (link: LinkType) => void;
  onDelete?: (link: LinkType) => void;
  onGenerateQR?: (link: LinkType) => void;
}

export function LinkCard({ link, onCopy, onEdit, onDelete, onGenerateQR }: LinkCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const shortUrl = `${import.meta.env.VITE_SHORT_URL_BASE || 'http://localhost:3000/r'}/${link.slug}`;

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

  const handleCopy = async () => {
    // shortUrl already includes the protocol (http:// or https://)
    await navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    onCopy?.(shortUrl);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        {/* Info principale */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-medium text-gray-900">{link.title || shortUrl}</h3>
            {!link.isActive && (
              <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                Inactif
              </span>
            )}
          </div>

          <div className="mt-1 flex items-center gap-2">
            <a
              href={shortUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              {shortUrl}
            </a>
            <button
              onClick={handleCopy}
              className="rounded p-1 transition-colors hover:bg-gray-100"
              title="Copier le lien"
            >
              <Copy size={14} className={copied ? 'text-green-600' : 'text-gray-400'} />
            </button>
          </div>

          <p className="mt-1 truncate text-sm text-gray-500">{link.originalUrl}</p>

          <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <BarChart2 size={14} />
              {link.clicks} clics
            </span>
            <span>
              Créé {formatDistanceToNow(new Date(link.createdAt), { addSuffix: true, locale: fr })}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <a
            href={shortUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg p-2 transition-colors hover:bg-gray-100"
            title="Ouvrir le lien"
          >
            <ExternalLink size={18} className="text-gray-500" />
          </a>

          <Link
            to={`/links/${link.id}/stats`}
            className="rounded-lg p-2 transition-colors hover:bg-gray-100"
            title="Voir les statistiques"
          >
            <BarChart2 size={18} className="text-gray-500" />
          </Link>

          {/* Menu contextuel */}
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
                    onEdit?.(link);
                    setIsMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Edit size={16} />
                  Modifier
                </button>
                <button
                  onClick={() => {
                    onGenerateQR?.(link);
                    setIsMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <QrCode size={16} />
                  Générer QR Code
                </button>
                <hr className="my-1" />
                <button
                  onClick={() => {
                    onDelete?.(link);
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
      </div>
    </div>
  );
}
