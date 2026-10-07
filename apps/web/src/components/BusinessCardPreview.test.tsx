import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BusinessCardPreview } from './BusinessCardPreview';
import { businessCardQrPayload, businessCardTemplates } from './businessCardPreview.data';
import type { BusinessCardDocument } from '@wrx/shared';
import { BusinessCardDocumentValidationError, parseBusinessCardDocument } from '@wrx/shared';

const signedAssets = vi.hoisted(() => ({ createSignedUrl: vi.fn(async (path: string) => ({ data: { signedUrl: `https://assets.example/${path}?token=temporary` }, error: null })) }));
vi.mock('../lib/supabase', () => ({ supabase: { storage: { from: () => signedAssets } } }));

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

  it('builds a vCard payload from the saved identity snapshot', () => {
    expect(businessCardQrPayload(document)).toContain('EMAIL:amina@example.com');
    expect(businessCardQrPayload(document)).toContain('ORG:Atelier Nord');
  });

  it('encodes email and phone as actionable static payloads', () => {
    expect(businessCardQrPayload({ ...document, qr: { mode: 'static', type: 'email', content: 'amina@example.com' } })).toBe('mailto:amina@example.com');
    expect(businessCardQrPayload({ ...document, qr: { mode: 'static', type: 'phone', content: '+212600000000' } })).toBe('tel:+212600000000');
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
