import {
  parseEmailSignatureDocument,
  type EmailSignatureAssetRecord,
  type EmailSignatureDocumentV1,
  type EmailSignatureTemplateId,
} from '@wrx/shared';

export interface EmailSignaturePresentationItem {
  key: string;
  label: string;
  text: string;
  href?: string;
}

export interface EmailSignaturePresentationImage {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export interface EmailSignaturePresentation {
  templateId: EmailSignatureTemplateId;
  accentColor: string;
  identity: {
    fullName: string;
    jobTitle: string | null;
    company: string | null;
  };
  avatar: EmailSignaturePresentationImage | null;
  companyLogo: EmailSignaturePresentationImage | null;
  contact: EmailSignaturePresentationItem[];
  socials: EmailSignaturePresentationItem[];
}

const CONTACT_LABELS = { email: 'Email', phone: 'Téléphone', website: 'Site web', address: 'Adresse' } as const;
const SOCIAL_LABELS = { linkedin: 'LinkedIn', github: 'GitHub', instagram: 'Instagram', x: 'X' } as const;
const EMAIL_ASSET_PATH = /^\/storage\/v1\/object\/public\/email-signature-assets\/v1\/[a-f\d]{64}\.(?:png|jpg)$/i;

function resolvePublicImage(
  assetId: string | undefined,
  expectedKind: 'avatar' | 'company-logo',
  alt: string,
  assets: EmailSignatureAssetRecord[],
): EmailSignaturePresentationImage | null {
  if (!assetId) return null;
  const asset = assets.find((candidate) => candidate.id === assetId && candidate.kind === expectedKind);
  if (!asset || !['image/png', 'image/jpeg'].includes(asset.contentType)) return null;

  try {
    const url = new URL(asset.publicUrl);
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || !EMAIL_ASSET_PATH.test(url.pathname)) return null;
    return expectedKind === 'avatar'
      ? { src: url.toString(), alt: alt || 'Photo', width: 56, height: 56 }
      : { src: url.toString(), alt: alt || 'Logo', width: 120, height: 48 };
  } catch {
    return null;
  }
}

function safeHttpsUrl(value: string): string | undefined {
  try {
    const url = new URL(/^[a-z][a-z\d+.-]*:/i.test(value) ? value : `https://${value}`);
    if (url.protocol !== 'https:' || !url.hostname || url.username || url.password) return undefined;
    return url.toString();
  } catch {
    return undefined;
  }
}

function safeMailto(value: string): string | undefined {
  return /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value) ? `mailto:${value}` : undefined;
}

function safeTel(value: string): string | undefined {
  if (!/^[+()\d.\-\s]{5,32}$/.test(value)) return undefined;
  const number = value.replace(/[().\-\s]/g, '');
  return number.replace(/(?!^\+)[+]/g, '') ? `tel:${number.replace(/(?!^\+)[+]/g, '')}` : undefined;
}

export function buildEmailSignaturePresentation(
  input: EmailSignatureDocumentV1,
  assets: EmailSignatureAssetRecord[] = [],
  options: { strict?: boolean } = {},
): EmailSignaturePresentation {
  // The editor is tolerant while a field is mid-edit; copy/export requests strict V1 validation.
  let document = input;
  try {
    document = parseEmailSignatureDocument(input);
  } catch (error) {
    if (options.strict) throw error;
  }
  const contact: EmailSignaturePresentationItem[] = [];
  if (document.visibility.email && document.contact.email) {
    const href = safeMailto(document.contact.email);
    if (href) contact.push({ key: 'email', label: CONTACT_LABELS.email, text: document.contact.email, href });
  }
  if (document.visibility.phone && document.contact.phone) {
    const href = safeTel(document.contact.phone);
    if (href) contact.push({ key: 'phone', label: CONTACT_LABELS.phone, text: document.contact.phone, href });
  }
  if (document.visibility.website && document.contact.website) {
    const href = safeHttpsUrl(document.contact.website);
    if (href) contact.push({ key: 'website', label: CONTACT_LABELS.website, text: document.contact.website, href });
  }
  if (document.visibility.address && document.contact.address) {
    contact.push({ key: 'address', label: CONTACT_LABELS.address, text: document.contact.address });
  }

  const socials: EmailSignaturePresentationItem[] = [];
  for (const [key, label] of Object.entries(SOCIAL_LABELS) as Array<[keyof typeof SOCIAL_LABELS, string]>) {
    const value = document.socialLinks[key];
    if (!document.visibility[key] || !value) continue;
    const href = safeHttpsUrl(value);
    if (href) socials.push({ key, label, text: value, href });
  }

  return {
    templateId: document.templateId,
    accentColor: document.brand.accentColor && /^#[0-9a-f]{6}$/i.test(document.brand.accentColor) ? document.brand.accentColor.toUpperCase() : '#235EE7',
    identity: {
      fullName: document.visibility.fullName ? document.identity.fullName : '',
      jobTitle: document.visibility.jobTitle ? document.identity.jobTitle : null,
      company: document.visibility.company ? document.identity.company : null,
    },
    avatar: document.visibility.avatar
      ? resolvePublicImage(document.images.avatar?.assetId, 'avatar', document.images.avatar?.altText ?? '', assets)
      : null,
    companyLogo: document.visibility.companyLogo
      ? resolvePublicImage(document.images.companyLogo?.assetId, 'company-logo', document.images.companyLogo?.altText ?? '', assets)
      : null,
    contact,
    socials,
  };
}
