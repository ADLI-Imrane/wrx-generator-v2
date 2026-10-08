import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '../test/test-utils';
import { Route, Routes } from 'react-router-dom';
import { EditQRPage } from './EditQRPage';
import { mockLinks } from '../test/mocks/api';

const mocks = vi.hoisted(() => ({ update: vi.fn(), useQRCode: vi.fn(), useLinks: vi.fn(), delete: vi.fn() }));

vi.mock('../hooks/useQR', () => ({
  useQRCode: mocks.useQRCode,
  useUpdateQRCode: () => ({ mutateAsync: mocks.update, isPending: false, error: null }),
  useDeleteQRCode: () => ({ mutateAsync: mocks.delete, isPending: false }),
}));

vi.mock('../hooks/useLinks', () => ({ useLinks: mocks.useLinks }));

const managedQR = {
  id: 'qr-1', userId: 'owner-1', type: 'url' as const, title: 'Managed QR',
  content: 'https://previous.example', linkId: 'link-1', routingMode: 'managed_link' as const,
  imageUrl: 'data:image/png;base64,stable-qr', createdAt: '2026-10-08T00:00:00.000Z',
  linkedLink: { id: 'link-1', slug: 'one', originalUrl: 'https://one.example', isActive: true, clicks: 0, isPasswordProtected: false },
};

describe('EditQRPage managed association contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState({}, '', '/qr-codes/qr-1/edit');
    mocks.useQRCode.mockReturnValue({ data: managedQR, isLoading: false, error: null });
    mocks.useLinks.mockReturnValue({ data: { data: [mockLinks[0], { ...mockLinks[1], id: 'link-2', slug: 'two' }] }, isLoading: false, error: null });
    mocks.update.mockResolvedValue({});
  });

  const renderPage = () => render(
    <Routes>
      <Route path="/qr-codes/:id/edit" element={<EditQRPage />} />
      <Route path="/qr-codes" element={<div>QR library</div>} />
    </Routes>,
  );

  it('reassociates a managed QR using a new active Link ID without editing printed QR content', async () => {
    renderPage();
    fireEvent.change(screen.getByLabelText('Lien WRX associé'), { target: { value: 'link-2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    await waitFor(() => expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({
      id: 'qr-1',
      data: expect.objectContaining({ type: 'url', linkId: 'link-2' }),
    })));
    expect(mocks.update.mock.calls[0]?.[0].data).not.toHaveProperty('content');
  });

  it('requires replacement direct content and explicitly detaches on save', async () => {
    renderPage();
    fireEvent.click(screen.getByRole('radio', { name: 'QR direct' }));
    fireEvent.change(screen.getByLabelText('URL *'), { target: { value: 'https://new-direct.example' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    await waitFor(() => expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({
      id: 'qr-1',
      data: expect.objectContaining({ type: 'url', content: 'https://new-direct.example', linkId: null }),
    })));
  });
});
