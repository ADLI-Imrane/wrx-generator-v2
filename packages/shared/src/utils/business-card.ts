import {
  BUSINESS_CARD_QR_TYPES,
  BUSINESS_CARD_SCHEMA_VERSION,
  BUSINESS_CARD_SOCIAL_PLATFORMS,
  BUSINESS_CARD_TEMPLATE_KEYS,
  type BusinessCardDocument,
  type BusinessCardIdentitySnapshot,
  type BusinessCardQrType,
  type BusinessCardSocialPlatform,
  type BusinessCardTemplateKey,
  type BusinessCardVisibility,
} from '../types/business-card';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const COLOR_PATTERN = /^#[0-9a-f]{6}$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[+()\d.\-\s]{7,32}$/;

const TEXT_LIMITS = {
  fullName: 150,
  jobTitle: 120,
  company: 150,
  email: 254,
  phone: 32,
  website: 500,
  address: 300,
} as const;

const VISIBILITY_KEYS = [
  'fullName',
  'jobTitle',
  'company',
  'email',
  'phone',
  'website',
  'address',
  'linkedin',
  'github',
  'instagram',
  'x',
  'avatar',
  'companyLogo',
  'qr',
] as const satisfies readonly (keyof BusinessCardVisibility)[];
const IDENTITY_KEYS = [
  'fullName',
  'jobTitle',
  'company',
  'email',
  'phone',
  'website',
  'address',
  'socialLinks',
  'avatarPath',
  'companyLogoPath',
] as const;

export class BusinessCardDocumentValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BusinessCardDocumentValidationError';
  }
}

function fail(path: string, message: string): never {
  throw new BusinessCardDocumentValidationError(`${path} ${message}`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assertRecord(value: unknown, path: string): asserts value is Record<string, unknown> {
  if (!isRecord(value)) fail(path, 'must be an object.');
}

function assertKeys(
  value: Record<string, unknown>,
  allowed: readonly string[],
  required: readonly string[],
  path: string
) {
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) fail(`${path}.${key}`, 'is not supported.');
  }
  for (const key of required) {
    if (!(key in value)) fail(`${path}.${key}`, 'is required.');
  }
}

function optionalText(value: unknown, path: string, maxLength: number): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') fail(path, 'must be text or null.');
  const normalized = value.trim();
  if (normalized.length > maxLength) fail(path, `must be at most ${maxLength} characters.`);
  return normalized || null;
}

function requiredText(value: unknown, path: string, maxLength: number): string {
  const normalized = optionalText(value, path, maxLength);
  if (!normalized) fail(path, 'is required.');
  return normalized;
}

function normalizeUrl(value: unknown, path: string, maxLength = 500): string | null {
  const raw = optionalText(value, path, maxLength);
  if (raw === null) return null;
  const candidate = /^[a-z][a-z\d+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`;
  if (candidate.length > maxLength) fail(path, `must be at most ${maxLength} characters.`);
  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return fail(path, 'must be a valid HTTP or HTTPS URL.');
  }
  if (
    !['http:', 'https:'].includes(parsed.protocol) ||
    !parsed.hostname ||
    /[%\s]/.test(parsed.hostname) ||
    parsed.username ||
    parsed.password
  ) {
    return fail(path, 'must be a valid HTTP or HTTPS URL without credentials.');
  }
  return parsed
    .toString()
    .replace(/\/$/, parsed.pathname === '/' && !parsed.search && !parsed.hash ? '' : '/');
}

function optionalColor(value: unknown, path: string, required = false): string | null {
  if (value === undefined || value === null || value === '') {
    if (required) fail(path, 'is required.');
    return null;
  }
  if (typeof value !== 'string' || !COLOR_PATTERN.test(value.trim())) {
    return fail(path, 'must be a six-digit hex color.');
  }
  return value.trim().toUpperCase();
}

function optionalAssetPath(value: unknown, path: string): string | null {
  const normalized = optionalText(value, path, 255);
  if (normalized === null) return null;
  const segments = normalized.split('/');
  if (
    normalized.includes('://') ||
    normalized.includes('\\') ||
    normalized.includes('%') ||
    segments.length < 2 ||
    !UUID_PATTERN.test(segments[0] ?? '') ||
    segments.some(
      (segment) => !segment || segment === '.' || segment === '..' || !/^[\w.-]+$/.test(segment)
    )
  ) {
    return fail(path, 'must be a safe private storage object path, not a URL.');
  }
  return normalized;
}

function normalizeIdentity(value: unknown): BusinessCardIdentitySnapshot {
  const path = 'document.identity';
  assertRecord(value, path);
  assertKeys(value, IDENTITY_KEYS, ['fullName', 'socialLinks'], path);

  const socialLinks: Partial<Record<BusinessCardSocialPlatform, string>> = {};
  const inputSocialLinks = value['socialLinks'];
  assertRecord(inputSocialLinks, `${path}.socialLinks`);
  assertKeys(inputSocialLinks, BUSINESS_CARD_SOCIAL_PLATFORMS, [], `${path}.socialLinks`);
  for (const platform of BUSINESS_CARD_SOCIAL_PLATFORMS) {
    if (platform in inputSocialLinks) {
      const url = normalizeUrl(inputSocialLinks[platform], `${path}.socialLinks.${platform}`);
      if (url) socialLinks[platform] = url;
    }
  }

  const email = optionalText(value['email'], `${path}.email`, TEXT_LIMITS.email);
  if (email && !EMAIL_PATTERN.test(email)) fail(`${path}.email`, 'must be a valid email address.');
  const phone = optionalText(value['phone'], `${path}.phone`, TEXT_LIMITS.phone);
  if (phone && !PHONE_PATTERN.test(phone)) fail(`${path}.phone`, 'must be a valid phone number.');

  return {
    fullName: requiredText(value['fullName'], `${path}.fullName`, TEXT_LIMITS.fullName),
    jobTitle: optionalText(value['jobTitle'], `${path}.jobTitle`, TEXT_LIMITS.jobTitle),
    company: optionalText(value['company'], `${path}.company`, TEXT_LIMITS.company),
    email,
    phone,
    website: normalizeUrl(value['website'], `${path}.website`),
    address: optionalText(value['address'], `${path}.address`, TEXT_LIMITS.address),
    socialLinks,
    avatarPath: optionalAssetPath(value['avatarPath'], `${path}.avatarPath`),
    companyLogoPath: optionalAssetPath(value['companyLogoPath'], `${path}.companyLogoPath`),
  };
}

function normalizeVisibility(value: unknown): BusinessCardVisibility {
  const path = 'document.visibility';
  assertRecord(value, path);
  assertKeys(value, VISIBILITY_KEYS, VISIBILITY_KEYS, path);
  const result = {} as BusinessCardVisibility;
  for (const key of VISIBILITY_KEYS) {
    if (typeof value[key] !== 'boolean') fail(`${path}.${key}`, 'must be a boolean.');
    result[key] = value[key] as boolean;
  }
  return result;
}

function normalizeQr(value: unknown): BusinessCardDocument['qr'] {
  if (value === undefined || value === null) return undefined;
  const path = 'document.qr';
  assertRecord(value, path);
  if (value['mode'] === 'managed') {
    assertKeys(value, ['mode', 'qrCodeId'], ['mode', 'qrCodeId'], path);
    if (typeof value['qrCodeId'] !== 'string' || !UUID_PATTERN.test(value['qrCodeId'])) {
      fail(`${path}.qrCodeId`, 'must be a valid QR code ID.');
    }
    return { mode: 'managed', qrCodeId: value['qrCodeId'] };
  }
  if (value['mode'] === 'static') {
    assertKeys(value, ['mode', 'type', 'content'], ['mode', 'type', 'content'], path);
    if (!BUSINESS_CARD_QR_TYPES.includes(value['type'] as BusinessCardQrType)) {
      fail(`${path}.type`, 'is not a supported QR type.');
    }
    let content = requiredText(value['content'], `${path}.content`, 2048);
    if (value['type'] === 'url') content = normalizeUrl(content, `${path}.content`, 2048) ?? '';
    if (value['type'] === 'email' && !EMAIL_PATTERN.test(content)) {
      fail(`${path}.content`, 'must be a valid email address for an email QR.');
    }
    return { mode: 'static', type: value['type'] as BusinessCardQrType, content };
  }
  return fail(`${path}.mode`, 'must be static or managed.');
}

/** Validates and normalizes the strictly versioned, JSON-safe V1 document. */
export function parseBusinessCardDocument(value: unknown): BusinessCardDocument {
  const path = 'document';
  assertRecord(value, path);
  assertKeys(
    value,
    ['schemaVersion', 'templateKey', 'identity', 'visibility', 'brand', 'sides', 'qr'],
    ['schemaVersion', 'templateKey', 'identity', 'visibility', 'brand', 'sides'],
    path
  );

  if (value['schemaVersion'] !== BUSINESS_CARD_SCHEMA_VERSION) {
    fail(`${path}.schemaVersion`, `must be ${BUSINESS_CARD_SCHEMA_VERSION}.`);
  }
  if (!BUSINESS_CARD_TEMPLATE_KEYS.includes(value['templateKey'] as BusinessCardTemplateKey)) {
    fail(`${path}.templateKey`, 'is not an available template.');
  }

  const brand = value['brand'];
  assertRecord(brand, `${path}.brand`);
  assertKeys(brand, ['primaryColor', 'secondaryColor'], ['primaryColor'], `${path}.brand`);

  const sides = value['sides'];
  assertRecord(sides, `${path}.sides`);
  assertKeys(sides, ['front', 'back'], ['front', 'back'], `${path}.sides`);
  assertRecord(sides['front'], `${path}.sides.front`);
  assertKeys(sides['front'], ['composition'], ['composition'], `${path}.sides.front`);
  if (!['identity', 'brand'].includes(String(sides['front']['composition']))) {
    fail(`${path}.sides.front.composition`, 'is not supported.');
  }
  assertRecord(sides['back'], `${path}.sides.back`);
  assertKeys(
    sides['back'],
    ['enabled', 'composition'],
    ['enabled', 'composition'],
    `${path}.sides.back`
  );
  if (typeof sides['back']['enabled'] !== 'boolean') {
    fail(`${path}.sides.back.enabled`, 'must be a boolean.');
  }
  if (!['contact', 'qr', 'contact-qr'].includes(String(sides['back']['composition']))) {
    fail(`${path}.sides.back.composition`, 'is not supported.');
  }

  const qr = normalizeQr(value['qr']);
  if (
    qr &&
    (!sides['back']['enabled'] ||
      !['qr', 'contact-qr'].includes(String(sides['back']['composition'])))
  ) {
    fail(`${path}.qr`, 'requires an enabled back configured to show a QR code.');
  }

  return {
    schemaVersion: BUSINESS_CARD_SCHEMA_VERSION,
    templateKey: value['templateKey'] as BusinessCardTemplateKey,
    identity: normalizeIdentity(value['identity']),
    visibility: normalizeVisibility(value['visibility']),
    brand: {
      primaryColor: optionalColor(
        brand['primaryColor'],
        `${path}.brand.primaryColor`,
        true
      ) as string,
      secondaryColor: optionalColor(brand['secondaryColor'], `${path}.brand.secondaryColor`),
    },
    sides: {
      front: { composition: sides['front']['composition'] as 'identity' | 'brand' },
      back: {
        enabled: sides['back']['enabled'] as boolean,
        composition: sides['back']['composition'] as 'contact' | 'qr' | 'contact-qr',
      },
    },
    ...(qr ? { qr } : {}),
  };
}

export function normalizeBusinessCardTitle(value: unknown): string {
  if (typeof value !== 'string') fail('title', 'must be text.');
  const title = value.trim();
  if (!title || title.length > 100) fail('title', 'must be between 1 and 100 characters.');
  return title;
}

export function assertBusinessCardAssetsOwned(
  document: BusinessCardDocument,
  userId: string
): void {
  for (const assetPath of [document.identity.avatarPath, document.identity.companyLogoPath]) {
    if (assetPath && assetPath.split('/')[0] !== userId) {
      fail('document.identity asset path', 'must belong to the current user.');
    }
  }
}
