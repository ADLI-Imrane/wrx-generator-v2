import {
  assertDigitalCardAssetsOwned,
  assertDigitalCardPublishable,
  DigitalCardDocumentValidationError,
  parseDigitalCardDocument,
  type DigitalCardDocumentV1,
} from '@wrx/shared';

const ownerId = '2c783f2e-3d72-41b9-83d6-a6adbe6e8501';

function document(overrides: Record<string, unknown> = {}): DigitalCardDocumentV1 {
  return {
    schemaVersion: 1,
    identity: {
      fullName: 'Ada Lovelace',
      jobTitle: 'Engineer',
      company: 'Analytical Engines',
      avatarPath: `${ownerId}/avatar`,
      companyLogoPath: `${ownerId}/company-logo`,
    },
    contact: {
      email: 'ada@example.com',
      phone: '+1 555 123 4567',
      website: 'https://example.com',
      address: 'London',
    },
    socialLinks: { linkedin: 'https://linkedin.com/in/ada' },
    visibility: {
      fullName: true,
      jobTitle: true,
      company: true,
      avatar: true,
      companyLogo: false,
      email: true,
      phone: true,
      website: true,
      address: false,
      linkedin: true,
      github: false,
      instagram: false,
      x: false,
    },
    brand: { primaryColor: '#235EE7', secondaryColor: '#14243A' },
    presentation: { style: 'light' },
    ...overrides,
  };
}

describe('DigitalCardDocumentV1', () => {
  it('accepts a valid document and safely normalizes text, URLs, and colors', () => {
    const input = document({
      identity: {
        fullName: '  Ada Lovelace  ',
        jobTitle: ' Engineer ',
        company: null,
        avatarPath: `${ownerId}/avatar`,
        companyLogoPath: null,
      },
      contact: { email: 'ada@example.com', phone: null, website: ' example.com ', address: '  ' },
      brand: { primaryColor: ' #235ee7 ', secondaryColor: null },
    });

    const parsed = parseDigitalCardDocument(input);

    expect(parsed.identity.fullName).toBe('Ada Lovelace');
    expect(parsed.identity.jobTitle).toBe('Engineer');
    expect(parsed.contact.website).toBe('https://example.com');
    expect(parsed.contact.address).toBeNull();
    expect(parsed.brand.primaryColor).toBe('#235EE7');
    expect(parsed.identity.avatarPath).toBe(`${ownerId}/avatar`);
  });

  it('rejects unsupported versions, keys, URLs, and signed image URLs', () => {
    expect(() => parseDigitalCardDocument({ ...document(), schemaVersion: 2 })).toThrow(
      DigitalCardDocumentValidationError
    );
    expect(() => parseDigitalCardDocument({ ...document(), qr: { mode: 'static' } })).toThrow(
      /not supported/
    );
    expect(() =>
      parseDigitalCardDocument({
        ...document(),
        identity: { ...document().identity, avatarPath: 'https://storage.test/signed?token=x' },
      })
    ).toThrow(/not a URL|not a safe/i);
    expect(() =>
      parseDigitalCardDocument({
        ...document(),
        contact: { ...document().contact, website: 'javascript:alert(1)' },
      })
    ).toThrow(/HTTP or HTTPS/);
    expect(() =>
      parseDigitalCardDocument({
        ...document(),
        contact: { ...document().contact, website: 'https://storage.test/storage/v1/object/sign/avatars/a?token=x' },
      })
    ).toThrow(/safe HTTP/);
  });

  it('requires every visibility flag and a supported presentation style', () => {
    const missingVisibility = document();
    delete (missingVisibility.visibility as Partial<typeof missingVisibility.visibility>).email;
    expect(() => parseDigitalCardDocument(missingVisibility)).toThrow(/is required/);

    expect(() => parseDigitalCardDocument({ ...document(), presentation: { style: 'neon' } })).toThrow(
      /not supported/
    );
  });

  it('checks safe owner-folder paths independently from document parsing', () => {
    const parsed = parseDigitalCardDocument(document());
    expect(() =>
      assertDigitalCardAssetsOwned(
        { ...parsed, identity: { ...parsed.identity, avatarPath: '8c1b8af9-2c08-47c6-bf3c-85ad4aa1f214/avatar' } },
        ownerId
      )
    ).toThrow(/current user/);
  });

  it('allows incomplete drafts but requires a visible name and contact path to publish', () => {
    const parsed = parseDigitalCardDocument(
      document({
        identity: { fullName: '', jobTitle: null, company: null, avatarPath: null, companyLogoPath: null },
        contact: { email: null, phone: null, website: null, address: null },
        socialLinks: {},
      })
    );
    expect(() => assertDigitalCardPublishable(parsed)).toThrow(/visible and non-empty/);

    const noContact = parseDigitalCardDocument(
      document({
        contact: { email: null, phone: null, website: null, address: null },
        socialLinks: {},
        visibility: { ...document().visibility, email: false, phone: false, website: false, linkedin: false },
      })
    );
    expect(() => assertDigitalCardPublishable(noContact)).toThrow(/at least one contact method/);

    const valid = parseDigitalCardDocument(document());
    expect(() => assertDigitalCardPublishable(valid)).not.toThrow();
  });
});
