import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import { useParams } from 'react-router-dom';
import type { PublicDigitalCard } from '@wrx/shared';
import { ArrowUpRight, AtSign, Download, Globe2, MapPin, Phone, Share2, type LucideIcon } from 'lucide-react';
import { api } from '../lib/api';
import { createPublicDigitalCardVCard, publicDigitalCardUrl } from '../lib/digital-card-vcard';
import '../styles/public-digital-card.css';

const socialLabels = {
  linkedin: 'LinkedIn',
  github: 'GitHub',
  instagram: 'Instagram',
  x: 'X',
} as const;

function isNotFound(error: unknown): boolean {
  return error instanceof Error && /HTTP 404\b/.test(error.message);
}

function PublicUnavailable({ onRetry, retrying, unavailable }: { onRetry: () => void; retrying: boolean; unavailable: boolean }) {
  return (
    <main className="public-dc-state" aria-labelledby="public-dc-unavailable">
      <a className="public-dc-wordmark" href="/" aria-label="WRX — accueil">WRX<span>/</span></a>
      <p className="public-dc-kicker">IDENTITY / PUBLIC ROUTE</p>
      <h1 id="public-dc-unavailable">{unavailable ? 'Cette carte n’est pas disponible.' : 'Carte temporairement indisponible.'}</h1>
      <p>{unavailable ? 'Le lien est peut-être expiré ou la carte n’est pas publiée.' : 'La carte ne peut pas être chargée pour le moment.'}</p>
      <button className="public-dc-button public-dc-button-secondary" onClick={onRetry} disabled={retrying}>
        {retrying ? 'Vérification…' : 'Réessayer'}
      </button>
    </main>
  );
}

export function PublicDigitalCardPage() {
  const { slug = '' } = useParams();
  const [card, setCard] = useState<PublicDigitalCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [attempt, setAttempt] = useState(0);
  const [notice, setNotice] = useState('');
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setCard(null);
    setAvatarFailed(false);
    setLogoFailed(false);
    api.getPublic<PublicDigitalCard>(`/public/digital-cards/${encodeURIComponent(slug)}`)
      .then((result) => { if (active) setCard(result); })
      .catch((reason: unknown) => { if (active) setError(reason); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [slug, attempt]);

  const shareUrl = card ? publicDigitalCardUrl(card.slug) : '';
  const share = useCallback(async () => {
    if (!card) return;
    setNotice('');
    try {
      if (navigator.share) {
        await navigator.share({ title: card.identity.fullName, text: 'Carte numérique', url: shareUrl });
        setNotice('Lien partagé.');
        return;
      }
      await navigator.clipboard.writeText(shareUrl);
      setNotice('Lien copié.');
    } catch (reason) {
      if (reason instanceof Error && reason.name === 'AbortError') return;
      try {
        await navigator.clipboard.writeText(shareUrl);
        setNotice('Lien copié.');
      } catch {
        setNotice('Copiez le lien affiché pour le partager.');
      }
    }
  }, [card, shareUrl]);

  const downloadVCard = () => {
    if (!card) return;
    const blob = new Blob([createPublicDigitalCardVCard(card)], { type: 'text/vcard;charset=utf-8' });
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = `${card.identity.fullName.trim().replace(/[^\p{L}\p{N}-]+/gu, '-').replace(/^-|-$/g, '') || 'contact'}.vcf`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
  };

  if (loading) {
    return <main className="public-dc-state" aria-live="polite"><p className="public-dc-kicker">WRX / IDENTITY</p><h1>Ouverture de la carte…</h1></main>;
  }
  if (!card || error) {
    const notFound = isNotFound(error);
    return <PublicUnavailable onRetry={() => setAttempt((value) => value + 1)} retrying={loading} unavailable={notFound} />;
  }

  const { identity, contact, socialLinks, brand, presentation } = card;
  const style = { '--public-dc-accent': brand.primaryColor, '--public-dc-secondary': brand.secondaryColor ?? brand.primaryColor } as CSSProperties;
  const initials = identity.fullName.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  const contactItems: { label: string; value: string; href?: string; icon: LucideIcon }[] = [];
  if (contact.email) contactItems.push({ label: 'Email', value: contact.email, href: `mailto:${contact.email}`, icon: AtSign });
  if (contact.phone) contactItems.push({ label: 'Téléphone', value: contact.phone, href: `tel:${contact.phone.replace(/[^+\d]/g, '')}`, icon: Phone });
  if (contact.website) contactItems.push({ label: 'Site web', value: contact.website.replace(/^https?:\/\//, '').replace(/\/$/, ''), href: contact.website, icon: Globe2 });
  if (contact.address) contactItems.push({ label: 'Adresse', value: contact.address, icon: MapPin });
  const socials = Object.entries(socialLinks).filter((entry): entry is [keyof typeof socialLabels, string] => Boolean(entry[1]));

  return (
    <main className={`public-dc public-dc-${presentation.style}`} style={style}>
      <header className="public-dc-topline">
        <a className="public-dc-wordmark" href="/" aria-label="WRX — accueil">WRX<span>/</span></a>
        <span className="public-dc-kicker">DIGITAL IDENTITY <i aria-hidden="true">·</i> {identity.company ? identity.company.toUpperCase() : 'PUBLIC CARD'}</span>
        {identity.companyLogoUrl && !logoFailed ? <img className="public-dc-company-logo" src={identity.companyLogoUrl} alt={`Logo ${identity.company ?? ''}`} onError={() => setLogoFailed(true)} /> : <span className="public-dc-index">ID—{card.slug.slice(0, 6).toUpperCase()}</span>}
      </header>

      <section className="public-dc-layout" aria-labelledby="public-dc-name">
        <div className="public-dc-identity">
          <p className="public-dc-kicker">IDENTITY / 01</p>
          <div className="public-dc-person">
            {identity.avatarUrl && !avatarFailed ? <img className="public-dc-avatar" src={identity.avatarUrl} alt={identity.fullName} onError={() => setAvatarFailed(true)} /> : <div className="public-dc-avatar public-dc-initials" aria-hidden="true">{initials}</div>}
            <div className="public-dc-name-block">
              <h1 id="public-dc-name">{identity.fullName}</h1>
              {(identity.jobTitle || identity.company) && <p>{[identity.jobTitle, identity.company].filter(Boolean).join(' / ')}</p>}
            </div>
          </div>
          <div className="public-dc-actions">
            <button className="public-dc-button public-dc-button-primary" onClick={downloadVCard}><Download size={16} aria-hidden="true" /> Enregistrer le contact</button>
            <button className="public-dc-button public-dc-button-secondary" onClick={share}><Share2 size={16} aria-hidden="true" /> Partager</button>
          </div>
          <p className="public-dc-notice" aria-live="polite">{notice}</p>
          {notice === 'Copiez le lien affiché pour le partager.' && <a className="public-dc-share-url" href={shareUrl}>{shareUrl}</a>}
        </div>

        <div className="public-dc-details">
          <div className="public-dc-detail-heading"><p className="public-dc-kicker">CONTACT / 02</p><span>DIRECT</span></div>
          {contactItems.length > 0 ? <ul className="public-dc-contact-list">
            {contactItems.map(({ label, value, href, icon: Icon }) => <li key={label}>
              {href ? <a href={href} target={label === 'Site web' ? '_blank' : undefined} rel={label === 'Site web' ? 'noreferrer' : undefined} aria-label={`${label} : ${value}`}><Icon size={17} aria-hidden="true" /><span><small>{label}</small><strong>{value}</strong></span><ArrowUpRight size={15} aria-hidden="true" /></a> : <div className="public-dc-contact-static"><Icon size={17} aria-hidden="true" /><span><small>{label}</small><strong>{value}</strong></span></div>}
            </li>)}
          </ul> : <p className="public-dc-muted">Aucun contact direct affiché.</p>}

          {socials.length > 0 && <div className="public-dc-socials"><p className="public-dc-kicker">NETWORK / 03</p><nav aria-label="Réseaux sociaux">
            {socials.map(([platform, url]) => <a href={url} target="_blank" rel="noreferrer" key={platform}>{socialLabels[platform]}<ArrowUpRight size={13} aria-hidden="true" /></a>)}
          </nav></div>}
        </div>
      </section>

      <footer className="public-dc-footer"><span>WRX <i aria-hidden="true">/</i> DIGITAL CARD</span><span>IDENTITY IN MOTION</span></footer>
    </main>
  );
}

export default PublicDigitalCardPage;
