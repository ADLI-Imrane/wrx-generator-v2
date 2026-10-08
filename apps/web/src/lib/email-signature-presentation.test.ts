import { describe, expect, it } from 'vitest';
import { blankEmailSignatureDocument } from './email-signature-mapping';
import { buildEmailSignaturePresentation } from './email-signature-presentation';

const asset = {
  id: '4b2e3a9e-18ac-4d77-b925-11b9d3497f6a', kind: 'avatar' as const, contentType: 'image/png' as const, byteSize: 500,
  publicUrl: `https://project.supabase.co/storage/v1/object/public/email-signature-assets/v1/${'a'.repeat(64)}.png`, createdAt: '',
};

describe('Email Signature presentation model', () => {
  it('applies visibility and stable field order consistently for preview and export inputs', () => {
    const document = blankEmailSignatureDocument();
    document.identity.fullName = 'Ada Lovelace';
    document.identity.jobTitle = 'Engineer';
    document.identity.company = 'Engines';
    document.contact.email = 'ada@example.com';
    document.contact.website = 'example.com';
    document.socialLinks.linkedin = 'https://linkedin.com/in/ada';
    document.visibility.linkedin = true;
    document.visibility.website = false;
    const model = buildEmailSignaturePresentation(document);

    expect(model.identity).toEqual({ fullName: 'Ada Lovelace', jobTitle: 'Engineer', company: 'Engines' });
    expect(model.contact.map(({ key }) => key)).toEqual(['email']);
    expect(model.socials.map(({ key, href }) => [key, href])).toEqual([['linkedin', 'https://linkedin.com/in/ada']]);
    expect(model.templateId).toBe('signal');
  });

  it('normalizes safe destinations and rejects unsafe schemes through the strict contract', () => {
    const document = blankEmailSignatureDocument();
    document.identity.fullName = 'Ada';
    document.contact.website = 'javascript:alert(1)';
    expect(() => buildEmailSignaturePresentation(document, [], { strict: true })).toThrow(/safe HTTPS URL/);
  });

  it('resolves only selected durable Email Signature assets and omits missing/private/signed URLs', () => {
    const document = blankEmailSignatureDocument();
    document.images.avatar = { assetId: asset.id, altText: 'Portrait' };
    document.visibility.avatar = true;
    expect(buildEmailSignaturePresentation(document, [asset]).avatar?.src).toBe(asset.publicUrl);
    expect(buildEmailSignaturePresentation(document, []).avatar).toBeNull();
    expect(buildEmailSignaturePresentation(document, [{ ...asset, publicUrl: 'https://host/storage/v1/object/sign/avatars/user/avatar?token=secret' }]).avatar).toBeNull();
    expect(buildEmailSignaturePresentation(document, [{ ...asset, publicUrl: 'http://localhost:54321/storage/v1/object/public/email-signature-assets/v1/file.png' }]).avatar).toBeNull();
  });
});
