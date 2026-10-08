import { EMAIL_SIGNATURE_SCHEMA_VERSION, parseEmailSignatureDocument, type EmailSignatureDocumentV1, type UserProfile } from '@wrx/shared';

export function blankEmailSignatureDocument(): EmailSignatureDocumentV1 {
  return {
    schemaVersion: EMAIL_SIGNATURE_SCHEMA_VERSION,
    identity: { fullName: '', jobTitle: null, company: null },
    contact: { email: null, phone: null, website: null, address: null },
    socialLinks: {},
    visibility: { fullName: true, jobTitle: true, company: true, email: true, phone: true, website: true, address: false, linkedin: false, github: false, instagram: false, x: false, avatar: false, companyLogo: false },
    templateId: 'signal',
    brand: { accentColor: '#235EE7' },
    images: { avatar: null, companyLogo: null },
  };
}

export function emailSignatureFromProfile(profile?: UserProfile | null, authEmail?: string): EmailSignatureDocumentV1 {
  const document = blankEmailSignatureDocument();
  if (!profile) {
    document.contact.email = authEmail || null;
    return document;
  }
  document.identity = { fullName: profile.fullName ?? '', jobTitle: profile.jobTitle ?? null, company: profile.company ?? null };
  document.contact = { email: profile.email || authEmail || null, phone: profile.phone ?? null, website: profile.website ?? null, address: profile.address ?? null };
  document.socialLinks = {
    ...(profile.linkedinUrl ? { linkedin: profile.linkedinUrl } : {}),
    ...(profile.githubUrl ? { github: profile.githubUrl } : {}),
    ...(profile.instagramUrl ? { instagram: profile.instagramUrl } : {}),
    ...(profile.xUrl ? { x: profile.xUrl } : {}),
  };
  document.brand.accentColor = profile.primaryBrandColor || document.brand.accentColor;
  return parseEmailSignatureDocument(document);
}
