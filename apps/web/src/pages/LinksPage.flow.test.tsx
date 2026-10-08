import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '../test/test-utils';
import { LinksPage } from './LinksPage';
import { mockLinks } from '../test/mocks/api';

const mocks = vi.hoisted(() => ({ deleteLink: vi.fn(), deleteError: null as Error | null }));

vi.mock('../hooks/useLinks', () => ({
  useLinks: () => ({ data: { data: [mockLinks[0]], totalPages: 1, total: 1 }, isLoading: false, refetch: vi.fn() }),
  useDeleteLink: () => ({ mutate: mocks.deleteLink, isPending: false, error: mocks.deleteError, reset: vi.fn() }),
}));

describe('LinksPage managed QR workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.deleteError = null;
    window.history.replaceState({}, '', '/links');
  });

  it('passes the Link ID to managed QR creation while preserving direct QR destination flow', () => {
    const first = render(<LinksPage />);
    expect(screen.queryByRole('navigation', { name: 'Outils de création' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Actions du lien' }));
    fireEvent.click(screen.getByRole('button', { name: 'Créer un QR géré' }));
    expect(window.location.pathname + window.location.search).toBe(`/qr-codes/new?linkId=${mockLinks[0]?.id}`);

    first.unmount();
    window.history.replaceState({}, '', '/links');
    render(<LinksPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Actions du lien' }));
    fireEvent.click(screen.getByRole('button', { name: 'Créer un QR direct' }));
    expect(window.location.pathname + window.location.search).toBe(`/qr-codes/new?url=${encodeURIComponent(mockLinks[0]!.originalUrl)}`);
  });

  it('explains that a referenced Link must be detached or replaced before deletion', () => {
    mocks.deleteLink.mockImplementation(() => {
      mocks.deleteError = new Error('HTTP 409 error: referenced QR codes');
    });
    const view = render(<LinksPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Actions du lien' }));
    fireEvent.click(screen.getByRole('button', { name: 'Supprimer' }));
    fireEvent.click(screen.getByRole('button', { name: 'Supprimer' }));
    view.rerender(<LinksPage />);
    expect(screen.getByRole('alert')).toHaveTextContent(/associé à un ou plusieurs QR gérés/);
    expect(screen.getByRole('link', { name: 'Ouvrir mes QR Codes' })).toHaveAttribute('href', '/qr-codes');
  });
});
