import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PublicDigitalCard } from '@wrx/shared';
import { publicDigitalCardUrl } from '../lib/digital-card-vcard';
import { PublicDigitalCardPage } from './PublicDigitalCardPage';

const api = vi.hoisted(() => ({ getPublic: vi.fn() }));
vi.mock('../lib/api', () => ({ api }));

const visibleCard: PublicDigitalCard = {
  slug: 'ab12cd34ef56ab12cd34ef56ab12cd34',
  identity: { fullName: 'Nora Benali', jobTitle: 'Product Designer', company: 'Studio Nord' },
  contact: { email: 'nora@example.com', phone: '+212600000000', website: 'https://example.com', address: 'Casablanca' },
  socialLinks: { linkedin: 'https://linkedin.com/in/nora' },
  brand: { primaryColor: '#235EE7', secondaryColor: null },
  presentation: { style: 'dark' },
};

function renderPage() {
  return render(<MemoryRouter initialEntries={[`/c/${visibleCard.slug}`]}><Routes><Route path="/c/:slug" element={<PublicDigitalCardPage />} /></Routes></MemoryRouter>);
}

describe('PublicDigitalCardPage', () => {
  beforeEach(() => { api.getPublic.mockReset(); });

  it('renders only fields supplied by the public projection', async () => {
    api.getPublic.mockResolvedValue(visibleCard);
    renderPage();
    expect(await screen.findByRole('heading', { name: 'Nora Benali' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Email : nora@example.com' })).toHaveAttribute('href', 'mailto:nora@example.com');
    expect(screen.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute('href', 'https://linkedin.com/in/nora');
    expect(screen.queryByText(/Internal title|hidden@|private-user-id/i)).not.toBeInTheDocument();
    expect(api.getPublic).toHaveBeenCalledWith(`/public/digital-cards/${visibleCard.slug}`);
  });

  it('uses the same not-available state for unpublished and unknown slugs', async () => {
    api.getPublic.mockRejectedValue(new Error('HTTP 404 error'));
    renderPage();
    expect(await screen.findByRole('heading', { name: 'Cette carte n’est pas disponible.' })).toBeInTheDocument();
  });

  it('offers the stable URL as a clipboard fallback when native share is unavailable', async () => {
    api.getPublic.mockResolvedValue(visibleCard);
    Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: vi.fn().mockResolvedValue(undefined) } });
    renderPage();
    await screen.findByRole('heading', { name: 'Nora Benali' });
    fireEvent.click(screen.getByRole('button', { name: 'Partager' }));
    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledWith(publicDigitalCardUrl(visibleCard.slug)));
    expect(await screen.findByText('Lien copié.')).toBeInTheDocument();
  });

  it('uses the Web Share API with the stable public URL when available', async () => {
    api.getPublic.mockResolvedValue(visibleCard);
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { configurable: true, value: share });
    renderPage();
    await screen.findByRole('heading', { name: 'Nora Benali' });
    fireEvent.click(screen.getByRole('button', { name: 'Partager' }));
    await waitFor(() => expect(share).toHaveBeenCalledWith({
      title: 'Nora Benali',
      text: 'Carte numérique',
      url: publicDigitalCardUrl(visibleCard.slug),
    }));
  });

  it('uses the document presentation and only displays server-signed image URLs', async () => {
    api.getPublic.mockResolvedValue({
      ...visibleCard,
      identity: {
        ...visibleCard.identity,
        avatarUrl: 'https://storage.example/signed/avatar-token',
        companyLogoUrl: 'https://storage.example/signed/logo-token',
      },
      presentation: { style: 'light' },
    });
    renderPage();
    await screen.findByRole('heading', { name: 'Nora Benali' });
    expect(document.querySelector('main.public-dc')).toHaveClass('public-dc-light');
    expect(screen.getByRole('img', { name: 'Nora Benali' })).toHaveAttribute('src', 'https://storage.example/signed/avatar-token');
    expect(screen.getByRole('img', { name: 'Logo Studio Nord' })).toHaveAttribute('src', 'https://storage.example/signed/logo-token');
  });
});
