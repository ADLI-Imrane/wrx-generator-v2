import { describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { BusinessCardDocument } from '@wrx/shared';
import { BusinessCardPrintDocument } from './BusinessCardPrintDocument';

const card: BusinessCardDocument = {
  schemaVersion: 1,
  templateKey: 'classic',
  identity: { fullName: 'Amina El Idrissi', socialLinks: {}, avatarPath: null, companyLogoPath: null },
  visibility: { fullName: true, jobTitle: true, company: true, email: true, phone: true, website: true, address: true, linkedin: true, github: true, instagram: true, x: true, avatar: true, companyLogo: true, qr: true },
  brand: { primaryColor: '#235EE7', secondaryColor: '#E7E9E1' },
  sides: { front: { composition: 'identity' }, back: { enabled: true, composition: 'contact' } },
};

function renderPrintDocument(document: BusinessCardDocument) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <BusinessCardPrintDocument card={document} frontRef={{ current: null }} backRef={{ current: null }} />
    </QueryClientProvider>,
  );
}

describe('BusinessCardPrintDocument', () => {
  it('portals exactly one full card surface for each enabled side outside the app root', () => {
    const { unmount } = renderPrintDocument(card);
    const printDocument = window.document.body.querySelector('[data-print-document]');
    expect(printDocument?.parentElement).toBe(window.document.body);
    expect(printDocument?.closest('#root')).toBeNull();
    expect(Array.from(printDocument?.querySelectorAll<HTMLElement>('[data-print-side]') ?? []).map((page) => page.dataset['printSide']))
      .toEqual(['front', 'back']);
    expect(printDocument?.querySelectorAll('.bc-face')).toHaveLength(2);
    unmount();
    cleanup();
  });

  it('omits the verso surface when the document has no back side', () => {
    const { unmount } = renderPrintDocument({
      ...card,
      sides: { ...card.sides, back: { ...card.sides.back, enabled: false } },
    });
    expect(window.document.body.querySelectorAll('[data-print-side]')).toHaveLength(1);
    expect(window.document.body.querySelectorAll('.bc-face')).toHaveLength(1);
    unmount();
    cleanup();
  });
});
