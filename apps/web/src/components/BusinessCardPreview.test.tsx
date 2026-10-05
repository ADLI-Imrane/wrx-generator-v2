import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BusinessCardPreview } from './BusinessCardPreview';
import { businessCardQrPayload, businessCardTemplates } from './businessCardPreview.data';
import type { BusinessCardDocument } from '@wrx/shared';
import { BusinessCardDocumentValidationError, parseBusinessCardDocument } from '@wrx/shared';

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

  it('rejects malformed hostnames consistently with browser URL parsing', () => {
    expect(() => parseBusinessCardDocument({
      ...document,
      identity: { ...document.identity, website: 'not a url' },
    })).toThrow(BusinessCardDocumentValidationError);
  });
});
