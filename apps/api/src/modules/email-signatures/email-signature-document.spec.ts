import {
  EMAIL_SIGNATURE_TEMPLATE_IDS,
  EmailSignatureDocumentValidationError,
  getEmailSignatureImageAssetIds,
  normalizeEmailSignatureTitle,
  parseEmailSignatureDocument,
} from '@wrx/shared';

const assetId = '4b2e3a9e-18ac-4d77-b925-11b9d3497f6a';

function document(overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: 1,
    identity: { fullName: ' Ada Lovelace ', jobTitle: ' Engineer ', company: ' Engines ' },
    contact: { email: 'ada@example.com', phone: '+1 555 123 4567', website: 'example.com', address: null },
    socialLinks: { linkedin: 'https://linkedin.com/in/ada' },
    visibility: {
      fullName: true, jobTitle: true, company: true, email: true, phone: true, website: true,
      address: false, linkedin: true, github: false, instagram: false, x: false, avatar: true, companyLogo: false,
    },
    templateId: 'signal',
    brand: { accentColor: '#235ee7' },
    images: { avatar: { assetId, altText: 'Ada Lovelace' }, companyLogo: null },
    ...overrides,
  };
}

describe('EmailSignatureDocumentV1', () => {
  it('normalizes the strict versioned shape and exposes only the curated templates', () => {
    expect(EMAIL_SIGNATURE_TEMPLATE_IDS).toEqual(['signal', 'compact', 'inline']);
    const parsed = parseEmailSignatureDocument(document());
    expect(parsed.identity.fullName).toBe('Ada Lovelace');
    expect(parsed.contact.website).toBe('https://example.com');
    expect(parsed.brand.accentColor).toBe('#235EE7');
    expect(parsed.images.avatar).toEqual({ assetId, altText: 'Ada Lovelace' });
  });

  it('rejects unsupported versions and arbitrary HTML/CSS/script/image URL fields', () => {
    expect(() => parseEmailSignatureDocument({ ...document(), schemaVersion: 2 })).toThrow(EmailSignatureDocumentValidationError);
    expect(() => parseEmailSignatureDocument({ ...document(), html: '<script>alert(1)</script>' })).toThrow(/not supported/);
    expect(() => parseEmailSignatureDocument({
      ...document(), images: { avatar: { assetId, altText: 'x', url: 'https://evil.test/a.png' }, companyLogo: null },
    })).toThrow(/not supported/);
    expect(() => parseEmailSignatureDocument({
      ...document(), brand: { accentColor: '#235ee7', css: 'background:url(javascript:alert(1))' },
    })).toThrow(/not supported/);
  });

  it('rejects unsafe URL schemes, credentials, invalid email and malformed asset IDs', () => {
    expect(() => parseEmailSignatureDocument({
      ...document(), contact: { ...(document().contact as Record<string, unknown>), website: 'javascript:alert(1)' },
    })).toThrow(/HTTPS URL/);
    expect(() => parseEmailSignatureDocument({
      ...document(), socialLinks: { linkedin: 'https://user:pass@example.com/a' },
    })).toThrow(/safe HTTPS/);
    expect(() => parseEmailSignatureDocument({
      ...document(), contact: { ...(document().contact as Record<string, unknown>), email: 'not an email' },
    })).toThrow(/valid email/);
    expect(() => parseEmailSignatureDocument({
      ...document(), images: { avatar: { assetId: 'not-a-uuid', altText: 'x' }, companyLogo: null },
    })).toThrow(/UUID/);
  });

  it('keeps user text as data and derives unique references for safe cleanup', () => {
    const literal = '<script>text, not markup in the document model</script>';
    const parsed = parseEmailSignatureDocument(document({
      identity: { fullName: literal, jobTitle: null, company: null },
      images: { avatar: { assetId, altText: 'Avatar' }, companyLogo: { assetId, altText: 'Logo' } },
    }));
    expect(parsed.identity.fullName).toBe(literal);
    expect(getEmailSignatureImageAssetIds(parsed)).toEqual([assetId]);
    expect(normalizeEmailSignatureTitle('  Work  ')).toBe('Work');
    expect(() => normalizeEmailSignatureTitle('  ')).toThrow(/empty/);
  });
});
