import { describe, expect, it } from 'vitest';
import { blankEmailSignatureDocument } from './email-signature-mapping';
import { buildEmailSignaturePresentation } from './email-signature-presentation';
import { renderEmailSignatureHtml, renderEmailSignaturePlainText } from './email-signature-renderer';

const durableUrl = `https://project.supabase.co/storage/v1/object/public/email-signature-assets/v1/${'b'.repeat(64)}.jpg`;

function sample() {
  const document = blankEmailSignatureDocument();
  document.identity.fullName = '<Ada & Co>';
  document.identity.jobTitle = 'Engineer';
  document.identity.company = 'Engines';
  document.contact.email = 'ada@example.com';
  document.contact.phone = '+1 555 123 4567';
  document.contact.website = 'https://example.com/work';
  document.contact.address = 'London';
  document.socialLinks.linkedin = 'https://linkedin.com/in/ada';
  document.visibility.linkedin = true;
  document.visibility.address = true;
  document.images.avatar = { assetId: '4b2e3a9e-18ac-4d77-b925-11b9d3497f6a', altText: 'Ada "portrait"' };
  document.visibility.avatar = true;
  document.images.companyLogo = { assetId: '4b2e3a9e-18ac-4d77-b925-11b9d3497f6b', altText: 'Engines logo' };
  document.visibility.companyLogo = true;
  document.brand.accentColor = '#123ABC';
  return document;
}

const assets = [
  { id: '4b2e3a9e-18ac-4d77-b925-11b9d3497f6a', kind: 'avatar' as const, contentType: 'image/jpeg' as const, byteSize: 500, publicUrl: durableUrl, createdAt: '' },
  { id: '4b2e3a9e-18ac-4d77-b925-11b9d3497f6b', kind: 'company-logo' as const, contentType: 'image/png' as const, byteSize: 500, publicUrl: durableUrl, createdAt: '' },
];

describe('email-safe signature renderer', () => {
  it.each(['signal', 'compact', 'inline'] as const)('renders %s as standalone table markup with inline styles', (templateId) => {
    const document = sample();
    document.templateId = templateId;
    const html = renderEmailSignatureHtml(buildEmailSignaturePresentation(document, assets));
    expect(html).toContain('<table role="presentation"');
    expect(html).toContain('cellpadding="0"');
    expect(html).toContain('cellspacing="0"');
    expect(html).toContain('border="0"');
    expect(html).toContain('style="');
    expect(html).toContain('#123ABC');
    expect(html).not.toMatch(/<script|<style|class=|stylesheet|display\s*:\s*(?:flex|grid)|var\(--/i);
    expect(html).toContain('Ada &quot;portrait&quot;');
    expect(html).toContain('alt="Engines logo"');
    expect(html).toContain('width="120" height="48"');
    expect(html).toContain(durableUrl);
    expect(html.match(/<img /g)).toHaveLength(2);
    expect(html).toContain('width="56" height="56"');
  });

  it('escapes user text and emits safe mailto, tel and HTTPS links', () => {
    const html = renderEmailSignatureHtml(buildEmailSignaturePresentation(sample(), assets));
    expect(html).toContain('&lt;Ada &amp; Co&gt;');
    expect(html).toContain('href="mailto:ada@example.com"');
    expect(html).toContain('href="tel:+15551234567"');
    expect(html).toContain('href="https://example.com/work"');
    expect(html).toContain('href="https://linkedin.com/in/ada"');
    expect(html).not.toContain('javascript:');
    expect(html).not.toContain('token=');
  });

  it('omits hidden fields, hidden socials, and unresolved or private images', () => {
    const document = sample();
    document.visibility.email = false;
    document.visibility.linkedin = false;
    document.visibility.avatar = false;
    document.visibility.companyLogo = false;
    const html = renderEmailSignatureHtml(buildEmailSignaturePresentation(document, assets));
    const plain = renderEmailSignaturePlainText(buildEmailSignaturePresentation(document, assets));
    expect(html).not.toContain('ada@example.com');
    expect(html).not.toContain('linkedin.com');
    expect(html).not.toContain('<img ');
    expect(plain).not.toContain('ada@example.com');
    expect(plain).not.toContain('linkedin.com');
    expect(plain).toContain('London');
  });

  it('degrades a missing durable asset to a coherent text-only signature', () => {
    const document = sample();
    const presentation = buildEmailSignaturePresentation(document, []);
    const html = renderEmailSignatureHtml(presentation);
    expect(html).toContain('&lt;Ada &amp; Co&gt;');
    expect(html).not.toContain('<img ');
    expect(html).not.toContain('storage/v1/object');
  });

  it('does not turn a manually forged unsafe presentation href or image URL into an active resource', () => {
    const presentation = buildEmailSignaturePresentation(sample(), assets);
    presentation.contact[0]!.href = 'javascript:alert(1)';
    presentation.avatar!.src = 'https://storage.example/storage/v1/object/sign/avatars/user/photo?token=secret';
    const html = renderEmailSignatureHtml(presentation);
    expect(html).not.toContain('href="javascript:');
    expect(html).not.toContain('object/sign/avatars');
  });

  it('plain text contains only the currently visible identity and contact/social fields', () => {
    const document = sample();
    document.visibility.company = false;
    document.visibility.phone = false;
    document.visibility.address = false;
    const plain = renderEmailSignaturePlainText(buildEmailSignaturePresentation(document));
    expect(plain).toBe('<Ada & Co>\nEngineer\nEmail: ada@example.com\nSite web: https://example.com/work\nLinkedIn: https://linkedin.com/in/ada');
    expect(plain).not.toContain('Engines');
    expect(plain).not.toContain('+1 555');
    expect(plain).not.toContain('London');
  });
});
