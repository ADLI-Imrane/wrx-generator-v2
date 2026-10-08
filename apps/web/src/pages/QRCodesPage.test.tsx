import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '../test/test-utils';
import { QRCodesPage } from './QRCodesPage';

vi.mock('../hooks/useQR', () => ({
  useQRCodes: () => ({ data: { data: [], total: 0, totalPages: 1 }, isLoading: false, refetch: vi.fn() }),
  useDeleteQR: () => ({ mutate: vi.fn(), isPending: false }),
  useDownloadQR: () => ({ mutate: vi.fn() }),
  useDuplicateQR: () => ({ mutate: vi.fn() }),
}));

describe('QRCodesPage navigation hierarchy', () => {
  it('does not repeat cross-tool navigation inside the QR tool', () => {
    render(<QRCodesPage />);
    expect(screen.getByRole('heading', { name: 'Mes QR Codes' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Outils de création' })).not.toBeInTheDocument();
  });
});
