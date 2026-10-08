import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowUpRight, Check, Copy, QrCode, RefreshCw, Share2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import type { DigitalCardRecord } from '@wrx/shared';
import { useDigitalCard } from '../hooks/useDigitalCards';
import { supabase } from '../lib/supabase';
import {
  copyDigitalCardLink,
  getDigitalCardSharingTarget,
  isNativeDigitalCardShareAvailable,
  shareDigitalCard,
} from '../lib/digital-card-sharing';
import '../styles/digital-card-share.css';

/** Authenticated owner presentation for a published Digital Card. */
export function DigitalCardShareRoute() {
  const { id = '' } = useParams();
  const card = useDigitalCard(id, {
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  if (card.isLoading || card.isFetching) {
    return (
      <main className="tool-page digital-card-share">
        <div className="dc-share-state" role="status">
          Vérification de la publication de votre carte…
        </div>
      </main>
    );
  }

  if (card.isError || !card.data) {
    return (
      <main className="tool-page digital-card-share">
        <section className="dc-share-state dc-share-state-error" role="alert">
          <p>Cette carte est introuvable ou vous n’y avez pas accès.</p>
          <button className="dc-text-button" type="button" onClick={() => void card.refetch()}>
            <RefreshCw size={14} /> Réessayer
          </button>
          <Link className="dc-text-button" to="/digital-cards">Retour aux cartes numériques</Link>
        </section>
      </main>
    );
  }

  const target = getDigitalCardSharingTarget(card.data);
  if (!target) {
    return (
      <main className="tool-page digital-card-share">
        <section className="dc-share-state" role="status">
          <p>Cette carte doit être publiée avant de pouvoir être partagée.</p>
          <Link className="dc-text-button" to={`/digital-cards/${card.data.id}/edit`}>
            Ouvrir le brouillon
          </Link>
          <Link className="dc-text-button" to="/digital-cards">Retour aux cartes numériques</Link>
        </section>
      </main>
    );
  }

  return <PublishedDigitalCardShare card={card.data} />;
}

function PublishedDigitalCardShare({ card }: { card: DigitalCardRecord }) {
  const [notice, setNotice] = useState('');
  const target = getDigitalCardSharingTarget(card);
  const nativeShareAvailable = isNativeDigitalCardShareAvailable();
  const images = useShareModeImages(card);

  if (!target) return null;

  const publicPath = `/c/${encodeURIComponent(card.slug)}`;
  const share = async () => {
    setNotice('');
    const result = await shareDigitalCard(target);
    if (result === 'shared') setNotice('Lien partagé.');
    if (result === 'copied') setNotice('Lien copié.');
    if (result === 'unavailable') setNotice('Partage indisponible. Utilisez le lien affiché ci-dessous.');
  };
  const copyLink = async () => {
    setNotice('');
    setNotice(await copyDigitalCardLink(target.url) ? 'Lien copié.' : 'Copie impossible. Sélectionnez le lien affiché pour le copier.');
  };

  const { identity, visibility } = card.document;
  const showName = visibility.fullName && Boolean(identity.fullName.trim());
  const showRole = visibility.jobTitle && Boolean(identity.jobTitle?.trim());
  const showCompany = visibility.company && Boolean(identity.company?.trim());
  const initials = showName
    ? identity.fullName.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
    : 'WRX';

  return (
    <main className="tool-page digital-card-share">
      <div className="dc-share-topline">
        <Link className="dc-share-back" to="/digital-cards">
          <ArrowLeft size={16} aria-hidden="true" /> Mes cartes
        </Link>
        <span className="dc-kicker">WRX / IDENTITÉ NUMÉRIQUE</span>
      </div>

      <section
        className="dc-share-stage"
        style={{ '--dc-share-accent': card.document.brand.primaryColor } as React.CSSProperties}
        aria-labelledby="dc-share-title"
      >
        <div className="dc-share-identity">
          {visibility.avatar && identity.avatarPath && (
            <div className="dc-share-avatar">
              {images.data?.avatar ? (
                <img src={images.data.avatar} alt={showName ? identity.fullName : 'Photo de profil'} />
              ) : initials}
            </div>
          )}
          <div className="dc-share-identity-copy">
            <p className="dc-share-overline">PRÊTE À PRÉSENTER</p>
            <h1 id="dc-share-title">{showName ? identity.fullName : 'Votre carte numérique'}</h1>
            {(showRole || showCompany) && (
              <p className="dc-share-role">
                {[showRole ? identity.jobTitle : null, showCompany ? identity.company : null]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            )}
          </div>
          {visibility.companyLogo && identity.companyLogoPath && images.data?.logo && (
            <img className="dc-share-logo" src={images.data.logo} alt="Logo d’entreprise" />
          )}
        </div>

        <div className="dc-share-presentation">
          <div className="dc-share-qr-column">
            <div className="dc-share-qr-frame">
              <QRCodeSVG
                value={target.qrPayload}
                size={320}
                level="M"
                includeMargin
                title={showName ? `QR code pour ouvrir la carte de ${identity.fullName}` : 'QR code pour ouvrir la carte numérique'}
                data-testid="digital-card-share-qr"
                data-qr-payload={target.qrPayload}
              />
            </div>
            <p className="dc-share-scan-prompt">Scannez pour ouvrir ma carte</p>
            <code className="dc-share-url">{target.url}</code>
          </div>

          <div className="dc-share-actions" aria-label="Actions de partage">
            <button className="dc-share-primary" type="button" onClick={() => void share()}>
              <Share2 size={18} aria-hidden="true" />
              {nativeShareAvailable ? 'Partager' : 'Copier le lien'}
            </button>
            {nativeShareAvailable && (
              <button className="dc-share-secondary" type="button" onClick={() => void copyLink()}>
                {notice === 'Lien copié.' ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
                Copier le lien
              </button>
            )}
            <Link className="dc-share-open" to={publicPath} target="_blank" rel="noreferrer">
              <ArrowUpRight size={16} aria-hidden="true" /> Ouvrir la carte publique
            </Link>
            <p className="dc-share-notice" role="status" aria-live="polite">{notice}</p>
          </div>
        </div>

        <footer className="dc-share-footline">
          <span><QrCode size={13} aria-hidden="true" /> ADRESSE PUBLIQUE · STATIQUE</span>
          <span>SCAN → /c/{card.slug.slice(0, 8)}</span>
        </footer>
      </section>
    </main>
  );
}

function useShareModeImages(card: DigitalCardRecord) {
  const avatarPath = card.document.visibility.avatar ? card.document.identity.avatarPath : null;
  const logoPath = card.document.visibility.companyLogo ? card.document.identity.companyLogoPath : null;

  return useQuery({
    queryKey: ['digital-card-share-assets', card.id, avatarPath, logoPath],
    enabled: Boolean(avatarPath || logoPath),
    staleTime: 30 * 60 * 1000,
    queryFn: async () => {
      const [avatar, logo] = await Promise.all([
        avatarPath ? supabase.storage.from('avatars').createSignedUrl(avatarPath, 3600) : null,
        logoPath ? supabase.storage.from('avatars').createSignedUrl(logoPath, 3600) : null,
      ]);
      if (avatar?.error) throw avatar.error;
      if (logo?.error) throw logo.error;
      return { avatar: avatar?.data.signedUrl, logo: logo?.data.signedUrl };
    },
  });
}
