import {
  BUSINESS_CARD_SOCIAL_PLATFORMS,
  type BusinessCardSocialPlatform,
} from './business-card';

export const DIGITAL_CARD_SCHEMA_VERSION = 1 as const;
export const DIGITAL_CARD_PRESENTATION_STYLES = ['light', 'dark'] as const;

export type DigitalCardPresentationStyle = (typeof DIGITAL_CARD_PRESENTATION_STYLES)[number];
export type DigitalCardStatus = 'draft' | 'published';

export interface DigitalCardDocumentV1 {
  schemaVersion: typeof DIGITAL_CARD_SCHEMA_VERSION;
  identity: {
    fullName: string;
    jobTitle: string | null;
    company: string | null;
    avatarPath: string | null;
    companyLogoPath: string | null;
  };
  contact: {
    email: string | null;
    phone: string | null;
    website: string | null;
    address: string | null;
  };
  socialLinks: Partial<Record<BusinessCardSocialPlatform, string>>;
  visibility: {
    fullName: boolean;
    jobTitle: boolean;
    company: boolean;
    avatar: boolean;
    companyLogo: boolean;
    email: boolean;
    phone: boolean;
    website: boolean;
    address: boolean;
    linkedin: boolean;
    github: boolean;
    instagram: boolean;
    x: boolean;
  };
  brand: {
    primaryColor: string;
    secondaryColor: string | null;
  };
  presentation: {
    style: DigitalCardPresentationStyle;
  };
}

export interface DigitalCardRecord {
  id: string;
  userId: string;
  title: string;
  slug: string;
  status: DigitalCardStatus;
  schemaVersion: typeof DIGITAL_CARD_SCHEMA_VERSION;
  document: DigitalCardDocumentV1;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

export interface CreateDigitalCardDto {
  title: string;
  document: DigitalCardDocumentV1;
}

export interface UpdateDigitalCardDto {
  title?: string;
  document?: DigitalCardDocumentV1;
}

/** Public projection only; deliberately contains no owner or persistence metadata. */
export interface PublicDigitalCard {
  slug: string;
  identity: {
    fullName: string;
    jobTitle?: string;
    company?: string;
    avatarUrl?: string;
    companyLogoUrl?: string;
  };
  contact: {
    email?: string;
    phone?: string;
    website?: string;
    address?: string;
  };
  socialLinks: Partial<Record<BusinessCardSocialPlatform, string>>;
  brand: {
    primaryColor: string;
    secondaryColor: string | null;
  };
  presentation: {
    style: DigitalCardPresentationStyle;
  };
}

export const DIGITAL_CARD_SOCIAL_PLATFORMS = BUSINESS_CARD_SOCIAL_PLATFORMS;
