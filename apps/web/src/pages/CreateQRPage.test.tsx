import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '../test/test-utils';
import { CreateQRPage } from './CreateQRPage';
import { mockLinks } from '../test/mocks/api';

const mocks = vi.hoisted(() => ({ createQR: vi.fn(), downloadQR: vi.fn(), useLinks: vi.fn() }));

vi.mock('../hooks/useQR', () => ({
  useCreateQR: () => ({ mutate: mocks.createQR, isPending: false, error: null }),
  useDownloadQR: () => ({ mutateAsync: mocks.downloadQR, isPending: false }),
}));

vi.mock('../hooks/useLinks', () => ({ useLinks: mocks.useLinks }));

describe('CreateQRPage managed and direct modes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState({}, '', '/qr-codes/new');
    mocks.useLinks.mockReturnValue({ data: { data: mockLinks }, isLoading: false, error: null });
    mocks.createQR.mockImplementation((_payload, callbacks) => {
      callbacks.onSuccess({ id: 'qr-new', imageUrl: 'data:image/png;base64,stable-qr' });
    });
  });

  it('creates a managed QR using the selected Link ID and waits for the saved stable preview', async () => {
    window.history.replaceState({}, '', '/qr-codes/new?linkId=link-1');
    render(<CreateQRPage />);

    expect(screen.getByRole('radio', { name: /QR géré \/ dynamique/ })).toBeChecked();
    expect(screen.getByLabelText('Lien WRX associé')).toHaveValue('link-1');
    expect(screen.queryByTitle('Aperçu du QR code')).not.toBeInTheDocument();
    expect(screen.getByText(/Aperçu après enregistrement/)).toBeInTheDocument();

    fireEvent.change(screen.getByRole('textbox', { name: 'Titre du QR code' }), { target: { value: 'QR salon' } });
    fireEvent.click(screen.getByRole('button', { name: 'Créer le QR code' }));

    await waitFor(() => expect(mocks.createQR).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'url', linkId: 'link-1', content: mockLinks[0]?.originalUrl, title: 'QR salon' }),
      expect.any(Object),
    ));
    expect(await screen.findByAltText('QR Code généré')).toHaveAttribute('src', 'data:image/png;base64,stable-qr');
    expect(screen.getByText(/destination actuelle du Lien WRX associé/)).toBeInTheDocument();
  });

  it('keeps direct QR preview and creation without a Link association', () => {
    render(<CreateQRPage />);
    fireEvent.change(screen.getByRole('textbox', { name: 'Contenu du QR code' }), { target: { value: 'https://direct.example' } });
    expect(screen.getByTitle('Aperçu du QR code')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Créer le QR code' }));
    expect(mocks.createQR).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'url', content: 'https://direct.example' }),
      expect.any(Object),
    );
    expect(mocks.createQR.mock.calls[0]?.[0]).not.toHaveProperty('linkId');
  });

  it('preserves the existing direct QR content type choices', () => {
    render(<CreateQRPage />);
    for (const type of ['URL', 'Texte', 'Email', 'Téléphone', 'SMS', 'WiFi', 'vCard']) {
      expect(screen.getByRole('button', { name: type })).toBeInTheDocument();
    }
  });

  it('offers the existing Link creation route when no active Link is available', () => {
    window.history.replaceState({}, '', '/qr-codes/new?linkId=missing');
    mocks.useLinks.mockReturnValue({ data: { data: [{ ...mockLinks[0], isActive: false }] }, isLoading: false, error: null });
    render(<CreateQRPage />);
    expect(screen.getByText(/Aucun de vos liens n’est actuellement actif/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Créer un lien WRX' })).toHaveAttribute('href', '/links/new');
    expect(screen.getByRole('button', { name: 'Créer le QR code' })).toBeDisabled();
  });
});
