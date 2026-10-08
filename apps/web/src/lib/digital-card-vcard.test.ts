import { describe, expect, it } from 'vitest';
import type { PublicDigitalCard } from '@wrx/shared';
import { createPublicDigitalCardVCard, publicDigitalCardUrl } from './digital-card-vcard';

const card: PublicDigitalCard = {
  slug: 'ab12cd34ef56ab12cd34ef56ab12cd34',
  identity: { fullName: 'Nora Benali', jobTitle: 'Product, Designer', company: 'Studio; Nord' },
  contact: { email: 'nora@example.com', phone: '+212600000000', website: 'https://example.com', address: 'Casablanca\nMorocco' },
  socialLinks: { linkedin: 'https://linkedin.com/in/nora' },
  brand: { primaryColor: '#235EE7', secondaryColor: null },
  presentation: { style: 'dark' },
};

describe('public Digital Card vCard', () => {
  it('creates a vCard 3.0 from the public projection and escapes text fields', () => {
    const value = createPublicDigitalCardVCard(card);
    expect(value).toContain('VERSION:3.0\r\n');
    expect(value).toContain('N:Benali;Nora;;;');
    expect(value).toContain('FN:Nora Benali');
    expect(value).toContain('TITLE:Product\\, Designer');
    expect(value).toContain('ORG:Studio\\; Nord');
    expect(value).toContain('ADR;TYPE=WORK:;;Casablanca\\nMorocco;;;;');
    expect(value).toContain('X-SOCIALPROFILE;TYPE=linkedin:https://linkedin.com/in/nora');
    expect(value.endsWith('END:VCARD\r\n')).toBe(true);
  });

  it('does not serialize fields outside the public contract', () => {
    const withUnexpectedPrivateData = {
      ...card,
      userId: 'private-user-id',
      title: 'Internal title',
      hiddenEmail: 'secret@example.com',
      document: { contact: { email: 'secret@example.com' } },
    } as PublicDigitalCard;
    const value = createPublicDigitalCardVCard(withUnexpectedPrivateData);
    expect(value).not.toContain('private-user-id');
    expect(value).not.toContain('Internal title');
    expect(value).not.toContain('secret@example.com');
  });

  it('builds the stable public URL from the slug', () => {
    expect(publicDigitalCardUrl(card.slug, 'https://wrx.example')).toBe(
      `https://wrx.example/c/${card.slug}`
    );
  });
});
