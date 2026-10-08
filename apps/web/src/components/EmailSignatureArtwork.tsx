import type { CSSProperties } from 'react';
import type { EmailSignatureAssetRecord, EmailSignatureDocumentV1 } from '@wrx/shared';

const labels = { email: 'Email', phone: 'Téléphone', website: 'Site web', address: 'Adresse' } as const;
const socials = { linkedin: 'LinkedIn', github: 'GitHub', instagram: 'Instagram', x: 'X' } as const;

export function EmailSignatureArtwork({ document, assets = [], compact = false }: { document: EmailSignatureDocumentV1; assets?: EmailSignatureAssetRecord[]; compact?: boolean }) {
  const imageUrl = (kind: 'avatar' | 'companyLogo') => {
    const ref = document.images[kind];
    return ref && document.visibility[kind] ? assets.find((asset) => asset.id === ref.assetId)?.publicUrl : undefined;
  };
  const fields = (Object.keys(labels) as Array<keyof typeof labels>).filter((key) => document.visibility[key] && document.contact[key]);
  const socialFields = (Object.keys(socials) as Array<keyof typeof socials>).filter((key) => document.visibility[key] && document.socialLinks[key]);
  const style = { '--signature-accent': document.brand.accentColor ?? '#235EE7' } as CSSProperties;
  const avatar = imageUrl('avatar');
  const logo = imageUrl('companyLogo');
  const content = <>
    <div className="es-identity">
      {avatar && <img className="es-avatar" src={avatar} alt={document.images.avatar?.altText ?? ''} />}
      <div className="es-name-block">
        {document.visibility.fullName && <strong className="es-name">{document.identity.fullName || 'Votre nom'}</strong>}
        {(document.visibility.jobTitle && document.identity.jobTitle) && <span>{document.identity.jobTitle}</span>}
        {(document.visibility.company && document.identity.company) && <span className="es-company">{document.identity.company}</span>}
      </div>
      {logo && <img className="es-logo" src={logo} alt={document.images.companyLogo?.altText ?? ''} />}
    </div>
    {(fields.length > 0 || socialFields.length > 0) && <div className="es-contact">
      {fields.map((key) => <span key={key}><b>{labels[key]}</b> {document.contact[key]}</span>)}
      {socialFields.map((key) => <span key={key}><b>{socials[key]}</b> {document.socialLinks[key]}</span>)}
    </div>}
  </>;

  return <div className={`email-signature-art es-template-${document.templateId}${compact ? ' is-compact' : ''}`} style={style}>
    {document.templateId === 'inline' ? <div className="es-inline">{content}</div> : content}
  </div>;
}
