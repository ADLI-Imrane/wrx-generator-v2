export const BUSINESS_CARD_SCHEMA_VERSION = 1 as const;

export const BUSINESS_CARD_TEMPLATE_KEYS = [
  'classic',
  'minimal',
  'editorial',
  'monogram',
  'bold',
] as const;

export type BusinessCardTemplateKey = (typeof BUSINESS_CARD_TEMPLATE_KEYS)[number];

export const BUSINESS_CARD_SOCIAL_PLATFORMS = ['linkedin', 'github', 'instagram', 'x'] as const;
export type BusinessCardSocialPlatform = (typeof BUSINESS_CARD_SOCIAL_PLATFORMS)[number];

export const BUSINESS_CARD_QR_TYPES = [
  'url',
  'vcard',
  'wifi',
  'text',
  'email',
  'phone',
  'sms',
] as const;
export type BusinessCardQrType = (typeof BUSINESS_CARD_QR_TYPES)[number];

export interface BusinessCardIdentitySnapshot {
  fullName: string;
  jobTitle?: string | null;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  address?: string | null;
  socialLinks: Partial<Record<BusinessCardSocialPlatform, string>>;
  avatarPath?: string | null;
  companyLogoPath?: string | null;
}

export interface BusinessCardVisibility {
  fullName: boolean;
  jobTitle: boolean;
  company: boolean;
  email: boolean;
  phone: boolean;
  website: boolean;
  address: boolean;
  linkedin: boolean;
  github: boolean;
  instagram: boolean;
  x: boolean;
  avatar: boolean;
  companyLogo: boolean;
  qr: boolean;
}

export interface BusinessCardDocument {
  schemaVersion: typeof BUSINESS_CARD_SCHEMA_VERSION;
  templateKey: BusinessCardTemplateKey;
  identity: BusinessCardIdentitySnapshot;
  visibility: BusinessCardVisibility;
  brand: {
    primaryColor: string;
    secondaryColor?: string | null;
  };
  sides: {
    front: { composition: 'identity' | 'brand' };
    back: { enabled: boolean; composition: 'contact' | 'qr' | 'contact-qr' };
  };
  qr?:
    | { mode: 'static'; type: BusinessCardQrType; content: string }
    | { mode: 'managed'; qrCodeId: string };
}

export interface BusinessCardRecord {
  id: string;
  userId: string;
  title: string;
  templateKey: BusinessCardTemplateKey;
  schemaVersion: typeof BUSINESS_CARD_SCHEMA_VERSION;
  document: BusinessCardDocument;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBusinessCardDto {
  title: string;
  document: BusinessCardDocument;
}

export interface UpdateBusinessCardDto {
  title?: string;
  document?: BusinessCardDocument;
}
