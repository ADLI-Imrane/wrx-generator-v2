import { useQuery } from '@tanstack/react-query';
import { Building2, Globe2, Mail, MapPin, Phone } from 'lucide-react';
import type { DigitalCardDocumentV1 } from '@wrx/shared';
import { supabase } from '../lib/supabase';

function useDigitalCardImages(document: DigitalCardDocumentV1) {
  const { avatarPath, companyLogoPath } = document.identity;
  return useQuery({
    queryKey: [
      'digital-card-preview-assets',
      avatarPath,
      companyLogoPath,
      document.visibility.avatar,
      document.visibility.companyLogo,
    ],
    enabled: Boolean(
      (avatarPath && document.visibility.avatar) ||
      (companyLogoPath && document.visibility.companyLogo)
    ),
    staleTime: 30 * 60 * 1000,
    queryFn: async () => {
      const [avatar, logo] = await Promise.all([
        avatarPath && document.visibility.avatar
          ? supabase.storage.from('avatars').createSignedUrl(avatarPath, 3600)
          : null,
        companyLogoPath && document.visibility.companyLogo
          ? supabase.storage.from('avatars').createSignedUrl(companyLogoPath, 3600)
          : null,
      ]);
      if (avatar?.error) throw avatar.error;
      if (logo?.error) throw logo.error;
      return { avatar: avatar?.data.signedUrl, logo: logo?.data.signedUrl };
    },
  });
}

const socials = ['linkedin', 'github', 'instagram', 'x'] as const;

export function DigitalCardPreview({
  document,
  title,
}: {
  document: DigitalCardDocumentV1;
  title: string;
}) {
  const { data: images, isError, isLoading } = useDigitalCardImages(document);
  const { identity, contact, visibility, brand, presentation } = document;
  const visibleSocials = socials.filter((key) => visibility[key] && document.socialLinks[key]);
  return (
    <section
      className={`dc-preview dc-preview-${presentation.style}`}
      style={
        {
          '--dc-primary': brand.primaryColor,
          '--dc-secondary': brand.secondaryColor || brand.primaryColor,
        } as React.CSSProperties
      }
      aria-label="Aperçu de la carte numérique"
    >
      <div className="dc-preview-topline">
        <span>
          WRX <i>/</i> IDENTITÉ NUMÉRIQUE
        </span>
        <span>APERÇU · {title || 'Sans titre'}</span>
      </div>
      <div className="dc-preview-brandline" aria-hidden="true">
        <span />
        <Building2 size={15} />
      </div>
      <div className="dc-preview-identity">
        {visibility.avatar && identity.avatarPath && (
          <div className="dc-avatar">
            {images?.avatar ? (
              <img src={images.avatar} alt="" />
            ) : (
              identity.fullName.slice(0, 1).toUpperCase()
            )}
          </div>
        )}
        <div className="dc-preview-copy">
          {visibility.company && identity.company && (
            <p className="dc-company">{identity.company}</p>
          )}
          {visibility.fullName && <h2>{identity.fullName || 'Votre nom'}</h2>}
          {visibility.jobTitle && identity.jobTitle && (
            <p className="dc-role">{identity.jobTitle}</p>
          )}
        </div>
        {visibility.companyLogo && identity.companyLogoPath && (
          <div className="dc-logo">
            {images?.logo ? <img src={images.logo} alt="" /> : <Building2 size={20} />}
          </div>
        )}
      </div>
      {(isLoading || isError) && (identity.avatarPath || identity.companyLogoPath) && (
        <p className="dc-asset-status" role={isError ? 'status' : 'status'}>
          {isLoading
            ? 'Chargement des images privées…'
            : 'Une image privée est indisponible dans l’aperçu.'}
        </p>
      )}
      <div className="dc-save-contact" aria-label="Aperçu de l’action Enregistrer le contact">
        <span>
          <i>＋</i> Enregistrer le contact
        </span>
        <small>APERÇU · DISPONIBLE EN PHASE 3D</small>
      </div>
      <div className="dc-contact-list">
        {visibility.phone && contact.phone && (
          <PreviewContact icon={<Phone size={16} />} value={contact.phone} />
        )}
        {visibility.email && contact.email && (
          <PreviewContact icon={<Mail size={16} />} value={contact.email} />
        )}
        {visibility.website && contact.website && (
          <PreviewContact
            icon={<Globe2 size={16} />}
            value={contact.website.replace(/^https?:\/\//, '')}
          />
        )}
        {visibility.address && contact.address && (
          <PreviewContact icon={<MapPin size={16} />} value={contact.address} />
        )}
      </div>
      {visibleSocials.length > 0 && (
        <div className="dc-social-list">
          {visibleSocials.map((key) => (
            <span key={key}>
              {key === 'x' ? 'X' : key.charAt(0).toUpperCase() + key.slice(1)} ·{' '}
              {socialHandle(document.socialLinks[key] || '')} <b aria-hidden="true">↗</b>
            </span>
          ))}
        </div>
      )}
      <footer className="dc-preview-foot">
        <span>WRX · DIGITAL CARD</span>
        <span>IDENTITY / 01</span>
      </footer>
    </section>
  );
}

function socialHandle(value: string) {
  const path = value
    .replace(/^https?:\/\/(?:www\.)?/i, '')
    .replace(/\/+$/, '')
    .split('/');
  return path.at(-1) || value;
}

function PreviewContact({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <div className="dc-contact-item">
      <span aria-hidden="true">{icon}</span>
      <span>{value}</span>
    </div>
  );
}
