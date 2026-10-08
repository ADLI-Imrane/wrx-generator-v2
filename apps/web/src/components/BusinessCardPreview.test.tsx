import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BusinessCardPreview } from './BusinessCardPreview';
import { BusinessCardPrintDocument } from './BusinessCardPrintDocument';
import { businessCardQrPayload, businessCardTemplates } from './businessCardPreview.data';
import type { BusinessCardDocument } from '@wrx/shared';
import { BusinessCardDocumentValidationError, isBusinessCardQrContrastSafe, parseBusinessCardDocument } from '@wrx/shared';
import { publicDigitalCardUrl } from '../lib/digital-card-vcard';

const signedAssets = vi.hoisted(() => ({ createSignedUrl: vi.fn(async (path: string) => ({ data: { signedUrl: `https://assets.example/${path}?token=temporary` }, error: null })) }));
vi.mock('../lib/supabase', () => ({ supabase: { storage: { from: () => signedAssets } } }));
vi.mock('qrcode.react', () => ({ QRCodeSVG: ({ value, fgColor, bgColor, size, includeMargin }: { value: string; fgColor?: string; bgColor?: string; size?: number; includeMargin?: boolean }) => <svg data-testid="qr-code" data-value={value} data-foreground={fgColor} data-background={bgColor} data-size={size} data-quiet-zone={includeMargin} /> }));

const document: BusinessCardDocument = {
  schemaVersion: 1,
  templateKey: 'classic',
  identity: { fullName: 'Amina El Idrissi', jobTitle: 'Designer', company: 'Atelier Nord', email: 'amina@example.com', phone: '+212600000000', website: 'https://example.com', address: null, socialLinks: {}, avatarPath: null, companyLogoPath: null },
  visibility: { fullName: true, jobTitle: true, company: true, email: true, phone: true, website: true, address: true, linkedin: true, github: true, instagram: true, x: true, avatar: true, companyLogo: true, qr: true },
  brand: { primaryColor: '#235EE7', secondaryColor: '#E7E9E1' },
  sides: { front: { composition: 'identity' }, back: { enabled: true, composition: 'contact-qr' } },
  qr: { mode: 'static', type: 'vcard', content: 'contact' },
};

function renderPreview(card = document, side: 'front' | 'back' = 'front', onSideChange = vi.fn()) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return { onSideChange, ...render(<QueryClientProvider client={client}><BusinessCardPreview document={card} side={side} onSideChange={onSideChange} /></QueryClientProvider>) };
}

describe('BusinessCardPreview', () => {
  it('offers five curated templates with distinct keys', () => {
    expect(businessCardTemplates.map((item) => item.key)).toEqual(['classic', 'minimal', 'editorial', 'monogram', 'bold']);
  });

  it('switches the visible card side accessibly', () => {
    const onSideChange = vi.fn();
    renderPreview(document, 'front', onSideChange);
    expect(screen.getByRole('button', { name: 'Recto' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Verso' }));
    expect(onSideChange).toHaveBeenCalledWith('back');
  });

  it('renders a local static QR and keeps contact details visible on its configured back', () => {
    const { container } = renderPreview(document, 'back');
    expect(container.querySelector('svg')).toBeInTheDocument();
    expect(screen.getByText('Amina El Idrissi')).toBeInTheDocument();
  });

  it('renders the saved QR presentation with a preserved quiet zone in preview and print', () => {
    const card = parseBusinessCardDocument({
      ...document,
      qr: { mode: 'static', type: 'url', content: 'https://example.com', presentation: { foregroundColor: '#235EE7', backgroundColor: '#F5F4EC', frame: 'soft' } },
    });
    const preview = renderPreview(card, 'back');
    expect(preview.container.querySelector('.bc-preview-qr')).toHaveStyle({ backgroundColor: '#F5F4EC', borderRadius: '7px' });
    expect(preview.getByTestId('qr-code')).toHaveAttribute('data-foreground', '#235EE7');
    expect(preview.getByTestId('qr-code')).toHaveAttribute('data-background', '#F5F4EC');
    expect(preview.getByTestId('qr-code')).toHaveAttribute('data-quiet-zone', 'true');
    preview.unmount();

    const printClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const print = render(<QueryClientProvider client={printClient}><BusinessCardPrintDocument card={card} frontRef={{ current: null }} backRef={{ current: null }} /></QueryClientProvider>);
    const printQr = window.document.body.querySelector('.bc-print-page[data-print-side="back"] .bc-preview-qr');
    expect(printQr).toHaveStyle({ backgroundColor: '#F5F4EC', borderRadius: '7px' });
    expect(printQr?.querySelector('svg')).toHaveAttribute('data-foreground', '#235EE7');
    expect(printQr?.querySelector('svg')).toHaveAttribute('data-value', 'https://example.com');
    print.unmount();
  });

  it('requires dark-on-light QR colors with at least 4.5:1 contrast', () => {
    expect(isBusinessCardQrContrastSafe('#1D2A2A', '#F5F4EC')).toBe(true);
    expect(isBusinessCardQrContrastSafe('#EEEEEE', '#FFFFFF')).toBe(false);
    expect(isBusinessCardQrContrastSafe('#FFFFFF', '#111111')).toBe(false);
    expect(() => parseBusinessCardDocument({
      ...document,
      qr: { mode: 'static', type: 'url', content: 'https://example.com', presentation: { foregroundColor: '#EEEEEE', backgroundColor: '#FFFFFF', frame: 'soft' } },
    })).toThrow(/contrast/);
  });

  it('keeps long contact values intact while exposing a clean truncation treatment', () => {
    const longSite = 'https://portfolio.example.com/very/long/professional/contact/path';
    const card = { ...document, identity: { ...document.identity, website: longSite, email: 'a-very-long-address-for-business@example.com' } };
    const { container } = renderPreview(card);
    const email = container.querySelector('[aria-label="Email : a-very-long-address-for-business@example.com"]');
    expect(email).toHaveAttribute('title', 'a-very-long-address-for-business@example.com');
    expect(email?.querySelector('.bc-preview-contact-value')).toHaveTextContent('a-very-long-address-for-business@example.com');
    expect(container.querySelector('[aria-label="Site web : https://portfolio.example.com/very/long/professional/contact/path"]')?.querySelector('.bc-preview-contact-value')).toHaveTextContent('portfolio.example.com/very/long/professional/contact/path');
    expect(container.querySelector('[aria-label="Site web : https://portfolio.example.com/very/long/professional/contact/path"]')).toHaveAttribute('title', longSite);
    const brandCard = { ...card, sides: { ...card.sides, front: { composition: 'brand' as const } } };
    const brandPreview = renderPreview(brandCard);
    expect(brandPreview.container.querySelector('.bc-preview-website')).toHaveAttribute('title', longSite);
  });

  it('builds a vCard payload from the saved identity snapshot', () => {
    expect(businessCardQrPayload(document)).toContain('EMAIL:amina@example.com');
    expect(businessCardQrPayload(document)).toContain('ORG:Atelier Nord');
  });

  it('encodes email and phone as actionable static payloads', () => {
    expect(businessCardQrPayload({ ...document, qr: { mode: 'static', type: 'email', content: 'amina@example.com' } })).toBe('mailto:amina@example.com');
    expect(businessCardQrPayload({ ...document, qr: { mode: 'static', type: 'phone', content: '+212600000000' } })).toBe('tel:+212600000000');
  });

  it('passes the selected stable Digital Card URL to preview and print artwork as a static payload', () => {
    const url = publicDigitalCardUrl('Amina_2026');
    const card = parseBusinessCardDocument({
      ...document,
      qr: {
        mode: 'static',
        type: 'url',
        content: url,
        digitalCardSource: { id: 'c1aa99cc-6f9d-4130-8a61-f20d12aa47e1', slug: 'Amina_2026' },
      },
    });

    expect(businessCardQrPayload(card)).toBe(url);
    const preview = renderPreview(card, 'back');
    expect(preview.getByTestId('qr-code')).toHaveAttribute('data-value', url);
    preview.unmount();

    const printClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const print = render(<QueryClientProvider client={printClient}><BusinessCardPrintDocument card={card} frontRef={{ current: null }} backRef={{ current: null }} /></QueryClientProvider>);
    expect(window.document.body.querySelector('.bc-print-page .bc-preview-qr [data-testid="qr-code"]')).toHaveAttribute('data-value', url);
    print.unmount();
  });

  it('rejects Digital Card source metadata that does not match a stable /c/:slug URL', () => {
    expect(() => parseBusinessCardDocument({
      ...document,
      qr: {
        mode: 'static',
        type: 'url',
        content: 'https://wrx.example/c/another-card',
        digitalCardSource: { id: 'c1aa99cc-6f9d-4130-8a61-f20d12aa47e1', slug: 'amina-card' },
      },
    })).toThrow(/stable public URL/);
  });

  it('shows an explicit unsupported managed-QR state instead of a fake or blank QR', () => {
    const { container } = renderPreview({ ...document, qr: { mode: 'managed', qrCodeId: 'c1aa99cc-6f9d-4130-8a61-f20d12aa47e1' } }, 'back');
    expect(container.querySelector('[data-qr-state="unsupported"]')).toBeInTheDocument();
    expect(container.querySelector('.bc-preview-qr')).not.toBeInTheDocument();
    expect(screen.getByText(/QR géré indisponible/)).toBeInTheDocument();
  });

  it('renders the configured social contact instead of just a platform name', () => {
    renderPreview({ ...document, identity: { ...document.identity, socialLinks: { github: 'https://github.com/amina' } } });
    expect(screen.getByText(/github: amina/i)).toBeInTheDocument();
  });

  it('signs stored photo/logo paths at render time without altering the document snapshot', async () => {
    const card = structuredClone(document);
    card.identity.avatarPath = 'owner/avatar';
    card.identity.companyLogoPath = 'owner/company-logo';
    const original = structuredClone(card);
    const { container } = renderPreview(card);
    await waitFor(() => expect(container.querySelector('.bc-preview-avatar')).toHaveAttribute('src', 'https://assets.example/owner/avatar?token=temporary'));
    expect(container.querySelector('.bc-preview-logo')).toHaveAttribute('src', 'https://assets.example/owner/company-logo?token=temporary');
    expect(signedAssets.createSignedUrl).toHaveBeenCalledWith('owner/avatar', 3600);
    expect(signedAssets.createSignedUrl).toHaveBeenCalledWith('owner/company-logo', 3600);
    expect(card).toEqual(original);
  });

  it('rejects unsupported QR modes at the shared validation boundary', () => {
    expect(() => parseBusinessCardDocument({ ...document, qr: { mode: 'future', content: 'x' } })).toThrow(BusinessCardDocumentValidationError);
  });

  it('rejects malformed hostnames consistently with browser URL parsing', () => {
    expect(() => parseBusinessCardDocument({
      ...document,
      identity: { ...document.identity, website: 'not a url' },
    })).toThrow(BusinessCardDocumentValidationError);
  });
});
