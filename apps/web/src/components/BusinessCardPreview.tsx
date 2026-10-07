import { useQuery } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowDownLeft, ArrowUpRight, Building2, Mail, MapPin, Phone, Globe2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { BusinessCardDocument } from '@wrx/shared';
import { BUSINESS_CARD_MANAGED_QR_NOTICE, businessCardQrPayload } from './businessCardPreview.data';

function useCardImages(document: BusinessCardDocument) {
  const avatarPath = document.identity.avatarPath;
  const logoPath = document.identity.companyLogoPath;
  return useQuery({
    queryKey: ['business-card-assets', avatarPath, logoPath],
    enabled: !!(avatarPath || logoPath),
    staleTime: 30 * 60 * 1000,
    queryFn: async () => {
      const [avatar, logo] = await Promise.all([
        avatarPath ? supabase.storage.from('avatars').createSignedUrl(avatarPath, 3600) : null,
        logoPath ? supabase.storage.from('avatars').createSignedUrl(logoPath, 3600) : null,
      ]);
      if (avatar?.error) throw avatar.error;
      if (logo?.error) throw logo.error;
      return {
        avatar: avatar?.data.signedUrl,
        logo: logo?.data.signedUrl,
      };
    },
  });
}

function CardIdentity({ document, avatarUrl, logoUrl }: {
  document: BusinessCardDocument;
  avatarUrl?: string;
  logoUrl?: string;
}) {
  const { identity: person, visibility: show } = document;
  return (
    <>
      <div className="bc-preview-identity">
        {show.avatar && avatarUrl && <img className="bc-preview-avatar" src={avatarUrl} alt="" />}
        <div className="bc-preview-name-block">
          {show.fullName && <strong>{person.fullName || 'Votre nom'}</strong>}
          {show.jobTitle && person.jobTitle && <span>{person.jobTitle}</span>}
          {show.company && person.company && <span className="bc-preview-company">{person.company}</span>}
        </div>
        {show.companyLogo && logoUrl && <img className="bc-preview-logo" src={logoUrl} alt="" />}
      </div>
      <div className="bc-preview-contacts">
        {show.email && person.email && <span><Mail size={12} />{person.email}</span>}
        {show.phone && person.phone && <span><Phone size={12} />{person.phone}</span>}
        {show.website && person.website && <span><Globe2 size={12} />{person.website.replace(/^https?:\/\//, '')}</span>}
        {show.address && person.address && <span><MapPin size={12} />{person.address}</span>}
      </div>
      <div className="bc-preview-socials">
        {(['linkedin', 'github', 'instagram', 'x'] as const).filter((key) => show[key] && person.socialLinks[key]).map((key) => (
          <span key={key} title={person.socialLinks[key]}>{key === 'x' ? 'X' : key[0]?.toUpperCase() + key.slice(1)}: {person.socialLinks[key]?.replace(/^https?:\/\/(?:www\.)?/, '').replace(/^(?:linkedin\.com\/in|github\.com|instagram\.com|(?:x|twitter)\.com)\//, '')}</span>
        ))}
      </div>
    </>
  );
}

function BusinessCardFace({ document, side, avatarUrl, logoUrl, exportRef, assetsState }: {
  document: BusinessCardDocument;
  side: 'front' | 'back';
  avatarUrl?: string;
  logoUrl?: string;
  exportRef?: React.Ref<HTMLDivElement>;
  assetsState: 'loading' | 'ready' | 'error';
}) {
  const payload = businessCardQrPayload(document);
  const { identity, visibility, brand } = document;
  const unsupportedQr = visibility.qr && document.qr?.mode === 'managed' && document.sides.back.composition !== 'contact';
  const initials = identity.fullName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'WR';

  if (side === 'back') {
    if (!document.sides.back.enabled) return <div ref={exportRef} data-assets-state={assetsState} className="bc-preview-disabled">Verso non activé</div>;
    return (
      <div ref={exportRef} data-assets-state={assetsState} data-qr-state={unsupportedQr ? 'unsupported' : 'ready'} className={`bc-face bc-back bc-back-${document.sides.back.composition} bc-template-${document.templateKey}${exportRef ? ' bc-export-face' : ''}`} style={{ '--bc-primary': brand.primaryColor, '--bc-secondary': brand.secondaryColor || '#E7E9E1' } as React.CSSProperties}>
        <div className="bc-back-mark" aria-hidden="true">{identity.company || initials}</div>
        {(document.sides.back.composition === 'qr' || document.sides.back.composition === 'contact-qr') && visibility.qr && payload && (
          <div className="bc-preview-qr"><QRCodeSVG value={payload} size={100} level="M" includeMargin /></div>
        )}
        {document.sides.back.composition !== 'qr' && <CardIdentity document={document} avatarUrl={avatarUrl} logoUrl={logoUrl} />}
        {document.sides.back.composition === 'qr' && payload && <p className="bc-back-caption">{document.qr?.mode === 'static' && document.qr.type === 'vcard' ? 'Scannez pour enregistrer le contact' : 'Scannez pour consulter le contenu'}</p>}
        {!payload && visibility.qr && document.sides.back.composition !== 'contact' && <p className="bc-qr-empty" title={unsupportedQr ? BUSINESS_CARD_MANAGED_QR_NOTICE : undefined}>{unsupportedQr ? 'QR géré indisponible · version statique uniquement' : 'Configurez un QR statique pour l’afficher ici.'}</p>}
      </div>
    );
  }

  return (
    <div ref={exportRef} data-assets-state={assetsState} className={`bc-face bc-front bc-template-${document.templateKey}${exportRef ? ' bc-export-face' : ''}`} style={{ '--bc-primary': brand.primaryColor, '--bc-secondary': brand.secondaryColor || '#E7E9E1' } as React.CSSProperties}>
      <div className="bc-front-rule" aria-hidden="true" />
      {document.templateKey === 'monogram' && <div className="bc-monogram" aria-hidden="true">{initials}</div>}
      {document.sides.front.composition === 'brand' ? (
        <div className="bc-brand-face">
          {visibility.companyLogo && logoUrl && <img className="bc-preview-logo" src={logoUrl} alt="" />}
          {visibility.company && identity.company && <strong>{identity.company}</strong>}
          <span>{visibility.fullName ? identity.fullName : ''}</span>
          {visibility.website && identity.website && <small>{identity.website.replace(/^https?:\/\//, '')}</small>}
        </div>
      ) : <CardIdentity document={document} avatarUrl={avatarUrl} logoUrl={logoUrl} />}
      <span className="bc-preview-edition" aria-hidden="true">WRX · {document.templateKey}</span>
      {document.templateKey === 'editorial' && <span className="bc-editorial-index" aria-hidden="true">01—04</span>}
      {document.templateKey === 'bold' && <span className="bc-bold-arrow" aria-hidden="true"><ArrowUpRight size={18} /></span>}
      {document.templateKey === 'minimal' && <span className="bc-minimal-arrow" aria-hidden="true"><ArrowDownLeft size={15} /></span>}
      {document.templateKey === 'classic' && <span className="bc-classic-company" aria-hidden="true"><Building2 size={13} /></span>}
    </div>
  );
}

export function BusinessCardArtwork({ document, side, exportRef }: {
  document: BusinessCardDocument;
  side: 'front' | 'back';
  exportRef?: React.Ref<HTMLDivElement>;
}) {
  const { data: images, isLoading, isError } = useCardImages(document);
  const needsAssets = !!(document.identity.avatarPath || document.identity.companyLogoPath);
  const assetsState = isError ? 'error' : !needsAssets || images ? 'ready' : isLoading ? 'loading' : 'error';
  return <BusinessCardFace document={document} side={side} avatarUrl={images?.avatar} logoUrl={images?.logo} exportRef={exportRef} assetsState={assetsState} />;
}

export function BusinessCardPreview({ document, side, onSideChange, compact = false, hideSideSwitch = false }: {
  document: BusinessCardDocument;
  side: 'front' | 'back';
  onSideChange: (side: 'front' | 'back') => void;
  compact?: boolean;
  hideSideSwitch?: boolean;
}) {
  return (
    <section className={`bc-preview-panel${compact ? ' is-compact' : ''}`} aria-label="Aperçu de la carte">
      <div className="bc-preview-toolbar">
        <span className="bc-overline">APERÇU EN DIRECT</span>
        {!hideSideSwitch && <div className="bc-side-switch" role="group" aria-label="Face de la carte">
          {(['front', 'back'] as const).map((value) => (
            <button key={value} type="button" aria-pressed={side === value} onClick={() => onSideChange(value)}>
              {value === 'front' ? 'Recto' : 'Verso'}
            </button>
          ))}
        </div>}
      </div>
      <div className="bc-preview-stage">
        <BusinessCardArtwork document={document} side={side} />
      </div>
      <p className="bc-preview-footnote">Format de visite · aperçu à l’échelle</p>
    </section>
  );
}
