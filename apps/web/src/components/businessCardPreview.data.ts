import type { BusinessCardDocument, BusinessCardTemplateKey } from '@wrx/shared';

export const BUSINESS_CARD_MANAGED_QR_NOTICE = 'Cette carte contient un QR géré, non pris en charge dans cette version. Remplacez-le par un QR statique ou retirez-le avant d’exporter le verso.';

export const businessCardTemplates: {
  key: BusinessCardTemplateKey;
  name: string;
  note: string;
  mark: string;
}[] = [
  { key: 'classic', name: 'Ligne claire', note: 'Équilibre professionnel', mark: '01' },
  { key: 'minimal', name: 'Essentiel', note: 'Typographie & espace', mark: '02' },
  { key: 'editorial', name: 'Éditorial', note: 'Composition asymétrique', mark: '03' },
  { key: 'monogram', name: 'Monogramme', note: 'Initiales en signature', mark: '04' },
  { key: 'bold', name: 'Contraste', note: 'Marque affirmée', mark: '05' },
];

export function businessCardQrPayload(document: BusinessCardDocument): string | null {
  const qr = document.qr;
  if (!qr || qr.mode !== 'static') return null;
  if (qr.type === 'email') return `mailto:${qr.content}`;
  if (qr.type === 'phone') return `tel:${qr.content}`;
  if (qr.type !== 'vcard') return qr.content;
  const identity = document.identity;
  const fullName = identity.fullName.replace(/[\r\n;]/g, ' ');
  const lines = ['BEGIN:VCARD', 'VERSION:3.0', `FN:${fullName}`];
  if (identity.company) lines.push(`ORG:${identity.company.replace(/[\r\n;]/g, ' ')}`);
  if (identity.jobTitle) lines.push(`TITLE:${identity.jobTitle.replace(/[\r\n;]/g, ' ')}`);
  if (identity.email) lines.push(`EMAIL:${identity.email}`);
  if (identity.phone) lines.push(`TEL:${identity.phone}`);
  if (identity.website) lines.push(`URL:${identity.website}`);
  lines.push('END:VCARD');
  return lines.join('\n');
}
