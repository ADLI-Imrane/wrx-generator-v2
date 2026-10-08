import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { EmailSignatureRecord } from '@wrx/shared';
import { EmailSignaturesPage } from './EmailSignaturesPage';
import { EmailSignatureEditorPage } from './EmailSignatureEditorPage';

const mocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), postForm: vi.fn(), put: vi.fn(), delete: vi.fn() }));
const profile = vi.hoisted(() => ({
  fullName: 'Nora Benali', jobTitle: 'Designer', company: 'Studio Nord', email: 'nora@example.com',
  phone: '+212600000000', website: 'https://example.com', linkedinUrl: 'https://linkedin.com/in/nora',
  avatarUrl: 'https://private.test/avatar?token=secret', companyLogoUrl: undefined, primaryBrandColor: '#3456AB',
}));
vi.mock('../lib/api', () => ({ api: mocks }));
vi.mock('../hooks/useAuth', () => ({ useProfile: () => ({ data: profile, isLoading: false }) }));
vi.mock('../stores/auth.store', () => ({ useAuthStore: () => ({ user: { id: 'owner-id', email: 'nora@example.com' } }) }));

let list: EmailSignatureRecord[];
const savedAsset = { id: '4b2e3a9e-18ac-4d77-b925-11b9d3497f6a', kind: 'avatar' as const, contentType: 'image/png' as const, byteSize: 1200, publicUrl: 'https://assets.example/avatar.png', createdAt: '' };
const uploadedAsset = { id: 'd8c4baef-7c55-4437-9f7a-2a6f79f4a301', kind: 'company-logo' as const, contentType: 'image/png' as const, byteSize: 1200, publicUrl: 'https://assets.example/logo.png', createdAt: '' };
function renderAt(path: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={client}><MemoryRouter initialEntries={[path]}><Routes>
    <Route path="/email-signatures" element={<EmailSignaturesPage/>}/>
    <Route path="/email-signatures/new" element={<EmailSignatureEditorPage/>}/>
    <Route path="/email-signatures/:id/edit" element={<EmailSignatureEditorPage/>}/>
  </Routes></MemoryRouter></QueryClientProvider>);
}

beforeEach(() => {
  vi.clearAllMocks(); list = [];
  mocks.get.mockImplementation(async (path: string) => {
    if (path === '/email-signatures') return structuredClone(list);
    if (path === '/email-signatures/assets') return [savedAsset, uploadedAsset];
    const found = list.find((item) => path.endsWith(item.id));
    if (!found) throw new Error('HTTP 404');
    return structuredClone(found);
  });
  mocks.post.mockImplementation(async (path: string, body: { title?: string; document?: EmailSignatureRecord['document'] }) => {
    if (path === '/email-signatures/assets/profile/avatar') return structuredClone(savedAsset);
    const record: EmailSignatureRecord = { id: 'signature-1', userId: 'owner-id', title: body.title || '', schemaVersion: 1, document: structuredClone(body.document!), createdAt: '', updatedAt: '' };
    list = [record, ...list]; return structuredClone(record);
  });
  mocks.postForm.mockImplementation(async () => structuredClone(uploadedAsset));
  mocks.put.mockImplementation(async (path: string, body: { title: string; document: EmailSignatureRecord['document'] }) => {
    const id = path.split('/').at(-1)!;
    const updated = { ...list.find((item) => item.id === id)!, ...body, updatedAt: '2026-10-08' };
    list = [updated]; return structuredClone(updated);
  });
  mocks.delete.mockImplementation(async (path: string) => {
    const id = path.split('/').at(-1)!;
    list = list.filter((item) => item.id !== id);
    return { id, deleted: true };
  });
});

describe('Email Signature owner flow', () => {
  it('shows empty and populated library states with edit/delete confirmation', async () => {
    const firstRender = renderAt('/email-signatures');
    expect(await screen.findByText(/La bonne signature commence/)).toBeInTheDocument();
    firstRender.unmount();
    list = [{ id: 'signature-1', userId: 'owner-id', title: 'Nora — travail', schemaVersion: 1, document: (await import('../lib/email-signature-mapping')).blankEmailSignatureDocument(), createdAt: '', updatedAt: '' }];
    list[0]!.document.identity.fullName = 'Nora Benali';
    const view = renderAt('/email-signatures');
    expect(await screen.findByText('Nora — travail')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Modifier/ })).toHaveAttribute('href', '/email-signatures/signature-1/edit');
    fireEvent.click(screen.getByRole('button', { name: 'Supprimer Nora — travail' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Supprimer' }));
    await waitFor(() => expect(mocks.delete).toHaveBeenCalledWith('/email-signatures/signature-1'));
    expect(await screen.findByText(/La bonne signature commence/)).toBeInTheDocument();
    view.unmount();
  });

  it('exposes loading and error/retry states in the library', async () => {
    let resolveList!: (value: EmailSignatureRecord[]) => void;
    mocks.get.mockImplementationOnce((path: string) => path === '/email-signatures' ? new Promise<EmailSignatureRecord[]>((resolve) => { resolveList = resolve; }) : []);
    const firstRender = renderAt('/email-signatures');
    expect(screen.getByRole('status')).toHaveTextContent('Chargement de vos signatures');
    resolveList([]);
    expect(await screen.findByText(/La bonne signature commence/)).toBeInTheDocument();
    firstRender.unmount();

    mocks.get.mockRejectedValueOnce(new Error('offline'));
    renderAt('/email-signatures');
    expect(await screen.findByRole('alert')).toHaveTextContent('Impossible de charger vos signatures');
    fireEvent.click(screen.getByRole('button', { name: /Réessayer/ }));
    expect(await screen.findByText(/La bonne signature commence/)).toBeInTheDocument();
  });

  it('prefills once, never publishes Profile images automatically, and persists explicit image publication + template/visibility edits', async () => {
    const originalProfile = structuredClone(profile);
    renderAt('/email-signatures/new');
    fireEvent.click(screen.getByRole('button', { name: 'Démarrer depuis le profil' }));
    expect(await screen.findByLabelText('Nom complet')).toHaveValue('Nora Benali');
    expect(mocks.post).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Afficher le nom')).toBeChecked();
    fireEvent.change(screen.getByLabelText('Nom complet'), { target: { value: 'Nora signature seule' } });
    fireEvent.click(screen.getByRole('button', { name: /^Inline/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Publier une copie du profil' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('devient publiquement accessible');
    expect(mocks.post).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Publier la copie' }));
    await waitFor(() => expect(mocks.post).toHaveBeenCalledWith('/email-signatures/assets/profile/avatar', {}));
    expect(await screen.findByText(/Image publiée ·/)).toBeInTheDocument();
    fireEvent.submit(screen.getByRole('button', { name: 'Enregistrer' }).closest('form')!);
    await waitFor(() => expect(mocks.post).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(list[0]?.document.identity.fullName).toBe('Nora signature seule'));
    expect(list[0]?.document.templateId).toBe('inline');
    expect(list[0]?.document.images.avatar?.assetId).toBe(savedAsset.id);
    expect(profile).toEqual(originalProfile);
    expect(JSON.stringify(list[0]?.document)).not.toContain('token=secret');
  });

  it('hydrates an existing saved record and updates its field visibility and contact values', async () => {
    const document = (await import('../lib/email-signature-mapping')).blankEmailSignatureDocument();
    document.identity.fullName = 'Saved Nora'; document.contact.email = 'saved@example.com'; document.visibility.email = false;
    list = [{ id: 'signature-1', userId: 'owner-id', title: 'Saved', schemaVersion: 1, document, createdAt: '', updatedAt: '' }];
    renderAt('/email-signatures/signature-1/edit');
    expect(await screen.findByLabelText('Nom complet')).toHaveValue('Saved Nora');
    expect(screen.getByLabelText('Email visible')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'updated@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    await waitFor(() => expect(list[0]?.document.contact.email).toBe('updated@example.com'));
  });

  it('creates blank, edits social/contact visibility and template, then reloads the saved document', async () => {
    const { unmount } = renderAt('/email-signatures/new');
    fireEvent.click(screen.getByRole('button', { name: 'Commencer à blanc' }));
    fireEvent.change(screen.getByLabelText('Titre interne'), { target: { value: 'Signature compacte' } });
    fireEvent.change(screen.getByLabelText('Nom complet'), { target: { value: 'Alex Martin' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'alex@example.com' } });
    fireEvent.click(screen.getByRole('checkbox', { name: 'Email visible' }));
    fireEvent.change(screen.getByLabelText('LinkedIn'), { target: { value: 'https://linkedin.com/in/alex' } });
    fireEvent.click(screen.getByRole('checkbox', { name: 'LinkedIn visible' }));
    fireEvent.click(screen.getByRole('button', { name: /^Compact/ }));
    fireEvent.click(screen.getByRole('button', { name: /^Signal/ }));
    fireEvent.click(screen.getByRole('button', { name: /^Inline/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    await waitFor(() => expect(list[0]?.document.identity.fullName).toBe('Alex Martin'));
    expect(list[0]?.document.contact.email).toBe('alex@example.com');
    expect(list[0]?.document.visibility.email).toBe(false);
    expect(list[0]?.document.socialLinks.linkedin).toBe('https://linkedin.com/in/alex');
    expect(list[0]?.document.visibility.linkedin).toBe(true);
    expect(list[0]?.document.templateId).toBe('inline');
    unmount();
    renderAt('/email-signatures/signature-1/edit');
    expect(await screen.findByLabelText('Nom complet')).toHaveValue('Alex Martin');
    expect(screen.getByLabelText('Email visible')).not.toBeChecked();
    expect(screen.getByLabelText('LinkedIn')).toHaveValue('https://linkedin.com/in/alex');
    expect(screen.getByRole('button', { name: /^Inline/ })).toHaveAttribute('aria-pressed', 'true');
  });

  it('keeps referenced-image deletion conflicts safe and explains how to release the reference', async () => {
    const document = (await import('../lib/email-signature-mapping')).blankEmailSignatureDocument();
    document.identity.fullName = 'Saved Nora';
    document.images.avatar = { assetId: savedAsset.id, altText: 'Portrait' };
    document.visibility.avatar = true;
    list = [{ id: 'signature-1', userId: 'owner-id', title: 'Saved', schemaVersion: 1, document, createdAt: '', updatedAt: '' }];
    mocks.delete.mockRejectedValueOnce(new Error('HTTP 409 error from /api/email-signatures/assets: {"message":"This image is used by a saved Email Signature; replace it before deleting"}'));
    renderAt('/email-signatures/signature-1/edit');
    await screen.findByLabelText('Nom complet');
    fireEvent.click(screen.getByRole('button', { name: 'Supprimer la photo PNG' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Retirez-la de chaque signature et enregistrez avant de supprimer l’image.');
  });

  it('requires disclosure confirmation before publishing an uploaded image', async () => {
    renderAt('/email-signatures/new');
    fireEvent.click(screen.getByRole('button', { name: 'Commencer à blanc' }));
    const file = new File(['synthetic image'], 'logo.png', { type: 'image/png' });
    fireEvent.change(screen.getAllByLabelText('Importer PNG/JPEG')[0]!, { target: { files: [file] } });
    expect(screen.getByRole('dialog')).toHaveTextContent('La copie devient publiquement accessible');
    expect(mocks.postForm).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Publier la copie' }));
    await waitFor(() => expect(mocks.postForm).toHaveBeenCalledTimes(1));
    expect(await screen.findByText('Image publiée · 2 Ko')).toBeInTheDocument();
  });
});
