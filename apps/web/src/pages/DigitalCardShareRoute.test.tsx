import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DigitalCardRecord } from '@wrx/shared';
import { DigitalCardShareRoute } from './DigitalCardShareRoute';

const api = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock('../lib/api', () => ({ api }));
vi.mock('../lib/supabase', () => ({
  supabase: {
    storage: {
      from: () => ({ createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: 'https://signed.example/image' }, error: null }) }),
    },
  },
}));

const publishedCard: DigitalCardRecord = {
  id: 'owned-card-42',
  userId: 'owner-id',
  title: 'Carte de Nora',
  slug: 'a1b2c3d4e5f6a7b8c9d0a1b2c3d4e5f6',
  status: 'published',
  schemaVersion: 1,
  document: {
    schemaVersion: 1,
    identity: { fullName: 'Nora Benali', jobTitle: null, company: null, avatarPath: null, companyLogoPath: null },
    contact: { email: null, phone: null, website: null, address: null },
    socialLinks: {},
    visibility: {
      fullName: true, jobTitle: false, company: false, avatar: false, companyLogo: false,
      email: false, phone: false, website: false, address: false, linkedin: false,
      github: false, instagram: false, x: false,
    },
    brand: { primaryColor: '#235EE7', secondaryColor: null },
    presentation: { style: 'light' },
  },
  createdAt: '2026-10-08T00:00:00Z',
  updatedAt: '2026-10-08T00:00:00Z',
  publishedAt: '2026-10-08T00:00:00Z',
};

function renderRoute(id: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[`/digital-cards/${id}/share`]}>
        <Routes>
          <Route path="/digital-cards/:id/share" element={<DigitalCardShareRoute />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('authenticated Digital Card share route boundary', () => {
  beforeEach(() => api.get.mockReset());

  it('loads the selected owner card by route ID and exposes the minimal published route shell', async () => {
    api.get.mockResolvedValue(publishedCard);
    renderRoute(publishedCard.id);
    expect(await screen.findByRole('heading', { name: 'Nora Benali' })).toBeInTheDocument();
    expect(await screen.findByTestId('digital-card-share-qr')).toHaveAttribute(
      'data-qr-payload',
      `http://${window.location.host}/c/${publishedCard.slug}`
    );
    expect(screen.getByRole('link', { name: 'Ouvrir la carte publique' })).toHaveAttribute(
      'href',
      `/c/${publishedCard.slug}`
    );
    expect(api.get).toHaveBeenCalledWith(`/digital-cards/${publishedCard.id}`);
  });

  it('does not expose a public destination for an unpublished card', async () => {
    api.get.mockResolvedValue({ ...publishedCard, status: 'draft', publishedAt: null });
    renderRoute(publishedCard.id);
    expect(await screen.findByText('Cette carte doit être publiée avant de pouvoir être partagée.'))
      .toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Ouvrir la carte publique' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ouvrir le brouillon' })).toHaveAttribute(
      'href',
      `/digital-cards/${publishedCard.id}/edit`
    );
    expect(screen.queryByTestId('digital-card-share-qr')).not.toBeInTheDocument();
  });

  it('handles a missing owner card without revealing its state', async () => {
    api.get.mockResolvedValue(null);
    renderRoute('missing');
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Cette carte est introuvable ou vous n’y avez pas accès.'
    );
    expect(screen.queryByText(publishedCard.title)).not.toBeInTheDocument();
  });

  it('uses native share when available and gives a truthful copy fallback otherwise', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { configurable: true, value: share });
    api.get.mockResolvedValue(publishedCard);
    const view = renderRoute(publishedCard.id);
    await screen.findByTestId('digital-card-share-qr');
    fireEvent.click(screen.getByRole('button', { name: 'Partager' }));
    await waitFor(() => expect(share).toHaveBeenCalledWith({
      title: 'Nora Benali',
      text: 'Carte numérique',
      url: `http://${window.location.host}/c/${publishedCard.slug}`,
    }));

    view.unmount();
    Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    api.get.mockResolvedValue(publishedCard);
    renderRoute(publishedCard.id);
    await screen.findByTestId('digital-card-share-qr');
    fireEvent.click(screen.getByRole('button', { name: 'Copier le lien' }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(
      `http://${window.location.host}/c/${publishedCard.slug}`
    ));
    expect(await screen.findByRole('status')).toHaveTextContent('Lien copié.');
  });

  it('does not reveal identity fields hidden in the Digital Card document', async () => {
    api.get.mockResolvedValue({
      ...publishedCard,
      document: {
        ...publishedCard.document,
        identity: { ...publishedCard.document.identity, fullName: 'Hidden Owner', jobTitle: 'Hidden Role', company: 'Hidden Company' },
        visibility: { ...publishedCard.document.visibility, fullName: false, jobTitle: false, company: false },
      },
    });
    renderRoute(publishedCard.id);
    await screen.findByTestId('digital-card-share-qr');
    expect(screen.getByRole('heading', { name: 'Votre carte numérique' })).toBeInTheDocument();
    expect(screen.queryByText(/Hidden Owner|Hidden Role|Hidden Company/)).not.toBeInTheDocument();
  });
});
