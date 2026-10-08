import type { BusinessCardSocialPlatform } from './business-card';

export const EMAIL_SIGNATURE_SCHEMA_VERSION = 1 as const;
export const EMAIL_SIGNATURE_TEMPLATE_IDS = ['signal', 'compact', 'inline'] as const;
export type EmailSignatureTemplateId = (typeof EMAIL_SIGNATURE_TEMPLATE_IDS)[number];

/** References an explicitly published image asset. Never stores a URL or Profile path. */
export interface EmailSignatureImageReference {
  assetId: string;
  altText: string;
}

/** Strict, versioned data only. HTML/CSS and durable URLs are derived, never persisted. */
export interface EmailSignatureDocumentV1 {
  schemaVersion: typeof EMAIL_SIGNATURE_SCHEMA_VERSION;
  identity: {
    fullName: string;
    jobTitle: string | null;
    company: string | null;
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
  };
  templateId: EmailSignatureTemplateId;
  brand: { accentColor: string | null };
  images: {
    avatar: EmailSignatureImageReference | null;
    companyLogo: EmailSignatureImageReference | null;
  };
}

export interface EmailSignatureRecord {
  id: string;
  userId: string;
  title: string;
  schemaVersion: typeof EMAIL_SIGNATURE_SCHEMA_VERSION;
  document: EmailSignatureDocumentV1;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmailSignatureDto {
  title: string;
  document: EmailSignatureDocumentV1;
}

export interface UpdateEmailSignatureDto {
  title?: string;
  document?: EmailSignatureDocumentV1;
}

export type EmailSignatureImageKind = 'avatar' | 'company-logo';

/** Owner-only management projection. publicUrl is derived from the dedicated public bucket. */
export interface EmailSignatureAssetRecord {
  id: string;
  kind: EmailSignatureImageKind;
  contentType: 'image/png' | 'image/jpeg';
  byteSize: number;
  publicUrl: string;
  createdAt: string;
}
