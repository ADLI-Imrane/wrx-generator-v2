import {
  DIGITAL_CARD_PRESENTATION_STYLES,
  DIGITAL_CARD_SCHEMA_VERSION,
  DIGITAL_CARD_SOCIAL_PLATFORMS,
  type DigitalCardDocumentV1,
} from '../types/digital-card';
import type { BusinessCardSocialPlatform } from '../types/business-card';

const COLOR_PATTERN = /^#[0-9a-f]{6}$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[+()\d.\-\s]{7,32}$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const KEYS = {
  document: ['schemaVersion', 'identity', 'contact', 'socialLinks', 'visibility', 'brand', 'presentation'],
  identity: ['fullName', 'jobTitle', 'company', 'avatarPath', 'companyLogoPath'],
  contact: ['email', 'phone', 'website', 'address'],
  visibility: [
    'fullName', 'jobTitle', 'company', 'avatar', 'companyLogo', 'email', 'phone', 'website',
    'address', 'linkedin', 'github', 'instagram', 'x',
  ],
  brand: ['primaryColor', 'secondaryColor'],
  presentation: ['style'],
} as const;

const TEXT_LIMITS = {
  fullName: 150,
  jobTitle: 120,
  company: 150,
  email: 254,
  phone: 32,
  address: 300,
} as const;

export class DigitalCardDocumentValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DigitalCardDocumentValidationError';
  }
}

function fail(path: string, message: string): never {
  throw new DigitalCardDocumentValidationError(`${path} ${message}.`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assertRecord(value: unknown, path: string): asserts value is Record<string, unknown> {
  if (!isRecord(value)) fail(path, 'must be an object');
}

function assertKeys(
  value: Record<string, unknown>,
  allowed: readonly string[],
  required: readonly string[],
  path: string
): void {
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) fail(`${path}.${key}`, 'is not supported');
  }
  for (const key of required) {
    if (!(key in value)) fail(`${path}.${key}`, 'is required');
  }
}

function optionalText(value: unknown, path: string, maxLength: number): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') fail(path, 'must be text or null');
  const normalized = value.trim();
  if (normalized.length > maxLength) fail(path, `must be at most ${maxLength} characters`);
  return normalized || null;
}

function normalizeUrl(value: unknown, path: string): string | null {
  const raw = optionalText(value, path, 500);
  if (!raw) return null;
  const candidate = /^[a-z][a-z\d+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`;
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return fail(path, 'must be a valid HTTP or HTTPS URL');
  }
  if (
    !['http:', 'https:'].includes(url.protocol) || !url.hostname || /[%\s]/.test(url.hostname) ||
    url.username || url.password ||
    (/\/storage\/v1\/object\/(?:sign|authenticated)\//i.test(url.pathname) && url.searchParams.has('token'))
  ) {
    return fail(path, 'must be a safe HTTP or HTTPS URL');
  }
  const normalized = url.toString();
  return normalized.endsWith('/') && url.pathname === '/' && !url.search && !url.hash
    ? normalized.slice(0, -1)
    : normalized;
}

function normalizeColor(value: unknown, path: string, required: boolean): string | null {
  if (value === undefined || value === null || value === '') {
    if (required) fail(path, 'is required');
    return null;
  }
  if (typeof value !== 'string' || !COLOR_PATTERN.test(value.trim())) {
    return fail(path, 'must be a six-digit hex color');
  }
  return value.trim().toUpperCase();
}

function normalizeAssetPath(value: unknown, path: string): string | null {
  const normalized = optionalText(value, path, 255);
  if (!normalized) return null;
  const segments = normalized.split('/');
  if (
    normalized.includes('://') || normalized.includes('\\') || normalized.includes('%') ||
    segments.length !== 2 || !UUID_PATTERN.test(segments[0] ?? '') ||
    !/^[\w.-]+$/.test(segments[1] ?? '') || segments[1] === '.' || segments[1] === '..'
  ) {
    return fail(path, 'must be a safe owner-scoped storage path, not a URL');
  }
  return normalized;
}

/** Strictly validates and returns a normalized, URL-free Digital Card V1 document. */
export function parseDigitalCardDocument(value: unknown): DigitalCardDocumentV1 {
  assertRecord(value, 'document');
  assertKeys(value, KEYS.document, KEYS.document, 'document');
  if (value['schemaVersion'] !== DIGITAL_CARD_SCHEMA_VERSION) {
    fail('document.schemaVersion', `must be ${DIGITAL_CARD_SCHEMA_VERSION}`);
  }

  const identity = value['identity'];
  assertRecord(identity, 'document.identity');
  assertKeys(identity, KEYS.identity, KEYS.identity, 'document.identity');
  const fullName = optionalText(identity['fullName'], 'document.identity.fullName', TEXT_LIMITS.fullName);
  const jobTitle = optionalText(identity['jobTitle'], 'document.identity.jobTitle', TEXT_LIMITS.jobTitle);
  const company = optionalText(identity['company'], 'document.identity.company', TEXT_LIMITS.company);

  const contact = value['contact'];
  assertRecord(contact, 'document.contact');
  assertKeys(contact, KEYS.contact, KEYS.contact, 'document.contact');
  const email = optionalText(contact['email'], 'document.contact.email', TEXT_LIMITS.email);
  if (email && !EMAIL_PATTERN.test(email)) fail('document.contact.email', 'must be a valid email');
  const phone = optionalText(contact['phone'], 'document.contact.phone', TEXT_LIMITS.phone);
  if (phone && !PHONE_PATTERN.test(phone)) fail('document.contact.phone', 'must be a valid phone number');

  const socialLinks = value['socialLinks'];
  assertRecord(socialLinks, 'document.socialLinks');
  assertKeys(socialLinks, DIGITAL_CARD_SOCIAL_PLATFORMS, [], 'document.socialLinks');
  const normalizedSocialLinks: Partial<Record<BusinessCardSocialPlatform, string>> = {};
  for (const platform of DIGITAL_CARD_SOCIAL_PLATFORMS) {
    if (platform in socialLinks) {
      const url = normalizeUrl(socialLinks[platform], `document.socialLinks.${platform}`);
      if (url) normalizedSocialLinks[platform] = url;
    }
  }

  const visibility = value['visibility'];
  assertRecord(visibility, 'document.visibility');
  assertKeys(visibility, KEYS.visibility, KEYS.visibility, 'document.visibility');
  const normalizedVisibility = {} as DigitalCardDocumentV1['visibility'];
  for (const key of KEYS.visibility) {
    if (typeof visibility[key] !== 'boolean') fail(`document.visibility.${key}`, 'must be boolean');
    normalizedVisibility[key] = visibility[key] as boolean;
  }

  const brand = value['brand'];
  assertRecord(brand, 'document.brand');
  assertKeys(brand, KEYS.brand, KEYS.brand, 'document.brand');
  const primaryColor = normalizeColor(brand['primaryColor'], 'document.brand.primaryColor', true);
  const secondaryColor = normalizeColor(brand['secondaryColor'], 'document.brand.secondaryColor', false);

  const presentation = value['presentation'];
  assertRecord(presentation, 'document.presentation');
  assertKeys(presentation, KEYS.presentation, KEYS.presentation, 'document.presentation');
  if (!DIGITAL_CARD_PRESENTATION_STYLES.includes(presentation['style'] as 'light' | 'dark')) {
    fail('document.presentation.style', 'is not supported');
  }

  return {
    schemaVersion: DIGITAL_CARD_SCHEMA_VERSION,
    identity: {
      fullName: fullName ?? '',
      jobTitle,
      company,
      avatarPath: normalizeAssetPath(identity['avatarPath'], 'document.identity.avatarPath'),
      companyLogoPath: normalizeAssetPath(identity['companyLogoPath'], 'document.identity.companyLogoPath'),
    },
    contact: {
      email,
      phone,
      website: normalizeUrl(contact['website'], 'document.contact.website'),
      address: optionalText(contact['address'], 'document.contact.address', TEXT_LIMITS.address),
    },
    socialLinks: normalizedSocialLinks,
    visibility: normalizedVisibility,
    brand: {
      primaryColor: primaryColor as string,
      secondaryColor,
    },
    presentation: { style: presentation['style'] as 'light' | 'dark' },
  };
}

export function normalizeDigitalCardTitle(value: unknown): string {
  if (typeof value !== 'string') fail('title', 'must be text');
  const title = value.trim();
  if (!title || title.length > 100) fail('title', 'must be between 1 and 100 characters');
  return title;
}

export function assertDigitalCardAssetsOwned(document: DigitalCardDocumentV1, userId: string): void {
  for (const path of [document.identity.avatarPath, document.identity.companyLogoPath]) {
    if (path && path.split('/')[0] !== userId) {
      fail('document identity asset', 'must belong to the current user');
    }
  }
}

/** Drafts may be incomplete; publication requires a visible name and one visible contact path. */
export function assertDigitalCardPublishable(document: DigitalCardDocumentV1): void {
  if (!document.visibility.fullName || !document.identity.fullName.trim()) {
    fail('document.identity.fullName', 'must be visible and non-empty before publishing');
  }
  const hasContact = Boolean(
    (document.visibility.email && document.contact.email) ||
    (document.visibility.phone && document.contact.phone) ||
    (document.visibility.website && document.contact.website) ||
    (document.visibility.linkedin && document.socialLinks.linkedin) ||
    (document.visibility.github && document.socialLinks.github) ||
    (document.visibility.instagram && document.socialLinks.instagram) ||
    (document.visibility.x && document.socialLinks.x)
  );
  if (!hasContact) fail('document', 'must expose at least one contact method before publishing');
}
