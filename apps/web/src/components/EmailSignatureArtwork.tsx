import type { CSSProperties } from 'react';
import type { EmailSignatureAssetRecord, EmailSignatureDocumentV1 } from '@wrx/shared';
import { buildEmailSignaturePresentation, type EmailSignaturePresentationItem } from '../lib/email-signature-presentation';

const styleFor = (accentColor: string): CSSProperties => ({ '--signature-accent': accentColor } as CSSProperties);

export function EmailSignatureArtwork({ document, assets = [], compact = false }: { document: EmailSignatureDocumentV1; assets?: EmailSignatureAssetRecord[]; compact?: boolean }) {
  const presentation = buildEmailSignaturePresentation(document, assets);
  const identity = <div className="es-identity">
    {presentation.avatar && <img className="es-avatar" width={presentation.avatar.width} height={presentation.avatar.height} src={presentation.avatar.src} alt={presentation.avatar.alt} />}
    <div className="es-name-block">
      <strong className="es-name">{presentation.identity.fullName || 'Votre nom'}</strong>
      {presentation.identity.jobTitle && <span>{presentation.identity.jobTitle}</span>}
      {presentation.identity.company && <span className="es-company">{presentation.identity.company}</span>}
    </div>
    {presentation.companyLogo && <img className="es-logo" width={presentation.companyLogo.width} height={presentation.companyLogo.height} src={presentation.companyLogo.src} alt={presentation.companyLogo.alt} />}
  </div>;
  const items = [...presentation.contact, ...presentation.socials];
  const detail = (item: EmailSignaturePresentationItem) => <span key={item.key}><b>{item.label}</b>{' '}{item.href ? <a href={item.href} onClick={(event) => event.preventDefault()}>{item.text}</a> : item.text}</span>;

  return <div className={`email-signature-art es-template-${presentation.templateId}${compact ? ' is-compact' : ''}`} style={styleFor(presentation.accentColor)}>
    {presentation.templateId === 'inline'
      ? <div className="es-inline"><div className="es-inline-identity">{identity}</div>{items.length > 0 && <div className="es-contact">{items.map(detail)}</div>}</div>
      : <>{identity}{items.length > 0 && <div className="es-contact">{items.map(detail)}</div>}</>}
  </div>;
}
