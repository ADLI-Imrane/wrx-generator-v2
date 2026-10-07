import {
  DIGITAL_CARD_SCHEMA_VERSION,
  parseDigitalCardDocument,
  type BusinessCardDocument,
  type DigitalCardDocumentV1,
} from '@wrx/shared';
import type { UserProfile } from '@wrx/shared';

const defaultVisibility: DigitalCardDocumentV1['visibility'] = {
  fullName: true,
  jobTitle: true,
  company: true,
  avatar: false,
  companyLogo: false,
  email: false,
  phone: false,
  website: false,
  address: false,
  linkedin: false,
  github: false,
  instagram: false,
  x: false,
};

export function blankDigitalCardDocument(): DigitalCardDocumentV1 {
  return {
    schemaVersion: DIGITAL_CARD_SCHEMA_VERSION,
    identity: {
      fullName: '',
      jobTitle: null,
      company: null,
      avatarPath: null,
      companyLogoPath: null,
    },
    contact: { email: null, phone: null, website: null, address: null },
    socialLinks: {},
    visibility: { ...defaultVisibility },
    brand: { primaryColor: '#235EE7', secondaryColor: null },
    presentation: { style: 'light' },
  };
}

function profileAssetPath(
  url: string | undefined,
  ownerId: string | undefined,
  file: 'avatar' | 'company-logo'
) {
  if (!url || !ownerId) return null;
  try {
    const path = new URL(url).pathname;
    const encoded = path.match(/\/storage\/v1\/object\/(?:sign|public)\/avatars\/(.+)$/)?.[1];
    const objectPath = encoded ? decodeURIComponent(encoded) : '';
    return objectPath === `${ownerId}/${file}` ? objectPath : null;
  } catch {
    return null;
  }
}

export function digitalCardFromProfile(
  profile: UserProfile | null | undefined,
  ownerId?: string,
  authEmail?: string
): DigitalCardDocumentV1 {
  const document = blankDigitalCardDocument();
  if (!profile) {
    document.contact.email = authEmail || null;
    return document;
  }
  document.identity = {
    fullName: profile.fullName ?? '',
    jobTitle: profile.jobTitle ?? null,
    company: profile.company ?? null,
    avatarPath: profileAssetPath(profile.avatarUrl, ownerId, 'avatar'),
    companyLogoPath: profileAssetPath(profile.companyLogoUrl, ownerId, 'company-logo'),
  };
  document.contact = {
    email: profile.email || authEmail || null,
    phone: profile.phone ?? null,
    website: profile.website ?? null,
    address: profile.address ?? null,
  };
  document.socialLinks = {
    ...(profile.linkedinUrl ? { linkedin: profile.linkedinUrl } : {}),
    ...(profile.githubUrl ? { github: profile.githubUrl } : {}),
    ...(profile.instagramUrl ? { instagram: profile.instagramUrl } : {}),
    ...(profile.xUrl ? { x: profile.xUrl } : {}),
  };
  document.brand = {
    primaryColor: profile.primaryBrandColor || document.brand.primaryColor,
    secondaryColor: profile.secondaryBrandColor || null,
  };
  return parseDigitalCardDocument(document);
}

/** Copy only shared identity/contact/brand data; physical composition and QR are deliberately discarded. */
export function digitalCardFromBusinessCard(source: BusinessCardDocument): DigitalCardDocumentV1 {
  const target = blankDigitalCardDocument();
  target.identity = {
    fullName: source.identity.fullName,
    jobTitle: source.identity.jobTitle ?? null,
    company: source.identity.company ?? null,
    avatarPath: source.identity.avatarPath ?? null,
    companyLogoPath: source.identity.companyLogoPath ?? null,
  };
  target.contact = {
    email: source.identity.email ?? null,
    phone: source.identity.phone ?? null,
    website: source.identity.website ?? null,
    address: source.identity.address ?? null,
  };
  target.socialLinks = { ...source.identity.socialLinks };
  target.visibility = {
    ...target.visibility,
    ...Object.fromEntries(
      Object.entries(source.visibility).filter(([key]) => key in target.visibility)
    ),
  } as DigitalCardDocumentV1['visibility'];
  target.brand = {
    primaryColor: source.brand.primaryColor,
    secondaryColor: source.brand.secondaryColor ?? null,
  };
  return parseDigitalCardDocument(target);
}
