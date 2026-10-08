import {
  EMAIL_SIGNATURE_SCHEMA_VERSION,
  EMAIL_SIGNATURE_TEMPLATE_IDS,
  type EmailSignatureDocumentV1,
  type EmailSignatureImageKind,
} from '../types/email-signature';
import { BUSINESS_CARD_SOCIAL_PLATFORMS, type BusinessCardSocialPlatform } from '../types/business-card';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_PATTERN = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
const PHONE_PATTERN = /^[+()\d.\-\s]{5,32}$/;
const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

const KEYS = {
  document: ['schemaVersion', 'identity', 'contact', 'socialLinks', 'visibility', 'templateId', 'brand', 'images'],
  identity: ['fullName', 'jobTitle', 'company'],
  contact: ['email', 'phone', 'website', 'address'],
  visibility: [
    'fullName', 'jobTitle', 'company', 'email', 'phone', 'website', 'address',
    'linkedin', 'github', 'instagram', 'x', 'avatar', 'companyLogo',
  ],
  brand: ['accentColor'],
  images: ['avatar', 'companyLogo'],
  imageReference: ['assetId', 'altText'],
} as const;

export class EmailSignatureDocumentValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EmailSignatureDocumentValidationError';
  }
}

function fail(path: string, message: string): never {
  throw new EmailSignatureDocumentValidationError(`${path} ${message}.`);
}

function record(value: unknown, path: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return fail(path, 'must be an object');
  return value as Record<string, unknown>;
}

function exactKeys(value: Record<string, unknown>, allowed: readonly string[], required: readonly string[], path: string): void {
  for (const key of Object.keys(value)) if (!allowed.includes(key)) fail(`${path}.${key}`, 'is not supported');
  for (const key of required) if (!(key in value)) fail(`${path}.${key}`, 'is required');
}

function text(value: unknown, path: string, max: number, required = false): string | null {
  if (value === undefined || value === null) {
    if (required) return fail(path, 'is required');
    return null;
  }
  if (typeof value !== 'string') return fail(path, 'must be text or null');
  const normalized = value.trim();
  if (normalized.length > max) return fail(path, `must be at most ${max} characters`);
  for (const character of normalized) {
    const code = character.charCodeAt(0);
    if (code <= 0x08 || code === 0x0b || code === 0x0c || (code >= 0x0e && code <= 0x1f) || code === 0x7f) {
      return fail(path, 'contains unsupported control characters');
    }
  }
  if (required && !normalized) return fail(path, 'must not be empty');
  return normalized || null;
}

function httpsUrl(value: unknown, path: string): string | null {
  const raw = text(value, path, 500);
  if (!raw) return null;
  let url: URL;
  try {
    url = new URL(/^[a-z][a-z\d+.-]*:/i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return fail(path, 'must be a valid HTTPS URL');
  }
  if (url.protocol !== 'https:' || !url.hostname || url.username || url.password || /[%\s]/.test(url.hostname)) {
    return fail(path, 'must be a safe HTTPS URL');
  }
  return url.toString().replace(/\/$/, url.pathname === '/' && !url.search && !url.hash ? '' : '/');
}

function imageReference(value: unknown, path: string) {
  if (value === null) return null;
  const ref = record(value, path);
  exactKeys(ref, KEYS.imageReference, KEYS.imageReference, path);
  const assetId = text(ref['assetId'], `${path}.assetId`, 36, true) as string;
  if (!UUID_PATTERN.test(assetId)) return fail(`${path}.assetId`, 'must be a UUID');
  const altText = text(ref['altText'], `${path}.altText`, 160, true) as string;
  return { assetId: assetId.toLowerCase(), altText };
}

/** Parses the complete V1 shape and rejects unsupported keys (including raw HTML/CSS). */
export function parseEmailSignatureDocument(value: unknown): EmailSignatureDocumentV1 {
  const doc = record(value, 'document');
  exactKeys(doc, KEYS.document, KEYS.document, 'document');
  if (doc['schemaVersion'] !== EMAIL_SIGNATURE_SCHEMA_VERSION) fail('document.schemaVersion', 'is unsupported');

  const identity = record(doc['identity'], 'document.identity');
  exactKeys(identity, KEYS.identity, KEYS.identity, 'document.identity');
  const fullName = text(identity['fullName'], 'document.identity.fullName', 150, true) as string;

  const contact = record(doc['contact'], 'document.contact');
  exactKeys(contact, KEYS.contact, KEYS.contact, 'document.contact');
  const email = text(contact['email'], 'document.contact.email', 254);
  if (email && !EMAIL_PATTERN.test(email)) fail('document.contact.email', 'must be a valid email');
  const phone = text(contact['phone'], 'document.contact.phone', 32);
  if (phone && !PHONE_PATTERN.test(phone)) fail('document.contact.phone', 'must be a valid phone number');

  const social = record(doc['socialLinks'], 'document.socialLinks');
  exactKeys(social, BUSINESS_CARD_SOCIAL_PLATFORMS, [], 'document.socialLinks');
  const socialLinks: Partial<Record<BusinessCardSocialPlatform, string>> = {};
  for (const platform of BUSINESS_CARD_SOCIAL_PLATFORMS) {
    if (platform in social) {
      const url = httpsUrl(social[platform], `document.socialLinks.${platform}`);
      if (url) socialLinks[platform] = url;
    }
  }

  const visibility = record(doc['visibility'], 'document.visibility');
  exactKeys(visibility, KEYS.visibility, KEYS.visibility, 'document.visibility');
  const normalizedVisibility = {} as EmailSignatureDocumentV1['visibility'];
  for (const key of KEYS.visibility) {
    if (typeof visibility[key] !== 'boolean') fail(`document.visibility.${key}`, 'must be boolean');
    normalizedVisibility[key] = visibility[key] as boolean;
  }

  if (!EMAIL_SIGNATURE_TEMPLATE_IDS.includes(doc['templateId'] as EmailSignatureDocumentV1['templateId'])) {
    fail('document.templateId', 'is unsupported');
  }
  const brand = record(doc['brand'], 'document.brand');
  exactKeys(brand, KEYS.brand, KEYS.brand, 'document.brand');
  const accent = text(brand['accentColor'], 'document.brand.accentColor', 7);
  if (accent && !HEX_COLOR_PATTERN.test(accent)) fail('document.brand.accentColor', 'must be a six-digit hex color or null');

  const images = record(doc['images'], 'document.images');
  exactKeys(images, KEYS.images, KEYS.images, 'document.images');

  return {
    schemaVersion: EMAIL_SIGNATURE_SCHEMA_VERSION,
    identity: {
      fullName,
      jobTitle: text(identity['jobTitle'], 'document.identity.jobTitle', 120),
      company: text(identity['company'], 'document.identity.company', 150),
    },
    contact: {
      email,
      phone,
      website: httpsUrl(contact['website'], 'document.contact.website'),
      address: text(contact['address'], 'document.contact.address', 300),
    },
    socialLinks,
    visibility: normalizedVisibility,
    templateId: doc['templateId'] as EmailSignatureDocumentV1['templateId'],
    brand: { accentColor: accent?.toUpperCase() ?? null },
    images: {
      avatar: imageReference(images['avatar'], 'document.images.avatar'),
      companyLogo: imageReference(images['companyLogo'], 'document.images.companyLogo'),
    },
  };
}

export function normalizeEmailSignatureTitle(value: unknown): string {
  const title = text(value, 'title', 100, true) as string;
  return title;
}

export function getEmailSignatureImageAssetIds(document: EmailSignatureDocumentV1): string[] {
  return [...new Set([document.images.avatar?.assetId, document.images.companyLogo?.assetId].filter((id): id is string => Boolean(id)))];
}

export function normalizeEmailSignatureImageKind(value: unknown): EmailSignatureImageKind {
  if (value === 'avatar' || value === 'company-logo') return value;
  return fail('kind', 'must be avatar or company-logo');
}
