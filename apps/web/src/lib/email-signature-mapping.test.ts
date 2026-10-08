import { describe, expect, it } from 'vitest';
import { emailSignatureFromProfile, blankEmailSignatureDocument } from './email-signature-mapping';

describe('Email Signature creation snapshot', () => {
  it('copies Profile identity/contact/social/brand values once without copying private image URLs', () => {
    const profile = {
      id: 'owner', email: 'ada@example.com', fullName: 'Ada Lovelace', jobTitle: 'Engineer', company: 'Engines',
      phone: '+1 555 123 4567', website: 'example.com', address: 'London',
      linkedinUrl: 'https://linkedin.com/in/ada', primaryBrandColor: '#3456AB',
      avatarUrl: 'https://host/storage/sign/avatars/owner/avatar?token=private',
      companyLogoUrl: 'https://host/storage/sign/avatars/owner/company-logo?token=private',
      tier: 'free' as const, createdAt: '', updatedAt: '',
    };
    const original = structuredClone(profile);
    const document = emailSignatureFromProfile(profile);
    expect(document.identity).toEqual({ fullName: 'Ada Lovelace', jobTitle: 'Engineer', company: 'Engines' });
    expect(document.contact).toMatchObject({ email: 'ada@example.com', phone: '+1 555 123 4567', website: 'https://example.com', address: 'London' });
    expect(document.visibility).toMatchObject({ fullName: true, jobTitle: true, company: true, email: true, phone: true, website: true, address: false, linkedin: false });
    expect(document.images).toEqual({ avatar: null, companyLogo: null });
    expect(JSON.stringify(document)).not.toContain('token=private');
    document.identity.fullName = 'Edited copy';
    expect(profile).toEqual(original);
  });

  it('starts blank with sensible visible-field defaults and no images', () => {
    const document = blankEmailSignatureDocument();
    expect(document.templateId).toBe('signal');
    expect(document.visibility).toMatchObject({ fullName: true, email: true, phone: true, website: true, address: false, avatar: false, companyLogo: false });
    expect(document.images).toEqual({ avatar: null, companyLogo: null });
  });
});
