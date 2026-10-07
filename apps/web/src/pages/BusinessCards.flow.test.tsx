import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import type { BusinessCardDocument, BusinessCardRecord } from '@wrx/shared';
import { parseBusinessCardDocument } from '@wrx/shared';
import { BusinessCardEditorPage } from './BusinessCardEditorPage';
import { BusinessCardsPage } from './BusinessCardsPage';

const mocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() }));
const profile = vi.hoisted(() => ({
  fullName: 'Amina El Idrissi', jobTitle: 'Architecte', company: 'Atelier Nord',
  email: 'amina@example.com', phone: '+212600000000', website: 'https://example.com',
  address: 'Casablanca', linkedinUrl: 'https://linkedin.com/in/amina',
  primaryBrandColor: '#235EE7', secondaryBrandColor: '#E7E9E1',
}));
vi.mock('../lib/api', () => ({ api: mocks }));
vi.mock('../hooks/useAuth', () => ({ useProfile: () => ({ data: profile, isSuccess: true, isError: false }) }));
vi.mock('../stores/auth.store', () => ({ useAuthStore: () => ({ user: { id: 'owner', email: profile.email } }) }));

function documentFixture(): BusinessCardDocument {
  return {
    schemaVersion: 1, templateKey: 'classic',
    identity: { fullName: 'Identité enregistrée', email: 'card@example.com', socialLinks: {} },
    visibility: { fullName: true, jobTitle: true, company: true, email: true, phone: true, website: true, address: true, linkedin: true, github: true, instagram: true, x: true, avatar: true, companyLogo: true, qr: true },
    brand: { primaryColor: '#123456', secondaryColor: '#ABCDEF' },
    sides: { front: { composition: 'identity' }, back: { enabled: true, composition: 'contact' } },
  };
}

const cards = new Map<string, BusinessCardRecord>();
function record(id: string, document = documentFixture(), title = 'Carte enregistrée'): BusinessCardRecord {
  return { id, userId: 'owner', title, templateKey: document.templateKey, schemaVersion: 1, document, createdAt: '2026-10-05T10:00:00Z', updatedAt: '2026-10-05T10:00:00Z' };
}

function renderFlow(path = '/business-cards') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  let navigate: ReturnType<typeof useNavigate> = () => undefined;
  function TestRoutes() {
    const currentNavigate = useNavigate();
    useEffect(() => { navigate = currentNavigate; }, [currentNavigate]);
    return <Routes>
      <Route path="/business-cards" element={<BusinessCardsPage />} />
      <Route path="/business-cards/new" element={<BusinessCardEditorPage />} />
      <Route path="/business-cards/:id/edit" element={<BusinessCardEditorPage />} />
    </Routes>;
  }
  return { router: { navigate: (to: string) => navigate(to) }, ...render(<QueryClientProvider client={client}><MemoryRouter initialEntries={[path]}><TestRoutes /></MemoryRouter></QueryClientProvider>) };
}

beforeEach(() => {
  cards.clear();
  vi.clearAllMocks();
  mocks.get.mockImplementation(async (url: string) => {
    if (url === '/business-cards') return [...cards.values()];
    const card = cards.get(url.split('/').at(-1) ?? '');
    if (!card) throw new Error('HTTP 404');
    return structuredClone(card);
  });
  mocks.post.mockImplementation(async (_url: string, input: { title: string; document: BusinessCardDocument }) => {
    const card = record('created', parseBusinessCardDocument(input.document), input.title);
    cards.set(card.id, card);
    return structuredClone(card);
  });
  mocks.put.mockImplementation(async (url: string, input: { title: string; document: BusinessCardDocument }) => {
    const id = url.split('/').at(-1) ?? '';
    const card = record(id, parseBusinessCardDocument(input.document), input.title);
    cards.set(id, card);
    return structuredClone(card);
  });
  mocks.delete.mockImplementation(async (url: string) => {
    const id = url.split('/').at(-1) ?? '';
    cards.delete(id);
    return { id, deleted: true };
  });
});

describe('Business Card editor integration', () => {
  it('prefills a new snapshot, creates it, updates it, and rehydrates a fresh editor without changing Profile', async () => {
    const originalProfile = structuredClone(profile);
    const view = renderFlow('/business-cards/new');
    await waitFor(() => expect(screen.getByLabelText('Nom complet')).toHaveValue(profile.fullName));
    expect(screen.getByRole('textbox', { name: 'Email' })).toHaveValue(profile.email);
    expect(screen.getByLabelText('LinkedIn', { selector: 'input[type=text]' })).toHaveValue(profile.linkedinUrl);
    fireEvent.change(screen.getByLabelText('Nom complet'), { target: { value: 'Identité propre à la carte' } });
    fireEvent.click(screen.getByRole('button', { name: /Éditorial/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la carte' }));
    await screen.findByRole('heading', { name: /^Cartes de visite/, level: 1 });
    expect(cards.get('created')?.document.templateKey).toBe('editorial');
    expect(cards.get('created')?.document.identity.fullName).toBe('Identité propre à la carte');
    expect(profile).toEqual(originalProfile);
    fireEvent.click(await screen.findByRole('link', { name: /Modifier/ }));
    await waitFor(() => expect(screen.getByLabelText('Nom complet')).toHaveValue('Identité propre à la carte'));
    fireEvent.change(screen.getByRole('textbox', { name: 'Téléphone' }), { target: { value: '+212611111111' } });
    fireEvent.change(screen.getByLabelText('Couleur principale — choisir une couleur'), { target: { value: '#2255aa' } });
    fireEvent.change(screen.getByLabelText('Couleur secondaire — choisir une couleur'), { target: { value: '#dce8f5' } });
    fireEvent.click(screen.getByLabelText('Adresse', { selector: 'input[type=checkbox]' }));
    fireEvent.change(screen.getByLabelText('Composition du recto'), { target: { value: 'brand' } });
    fireEvent.click(screen.getByRole('button', { name: /Monogramme/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer les changements' }));
    await screen.findByRole('heading', { name: /^Cartes de visite/, level: 1 });
    view.unmount();
    renderFlow('/business-cards/created/edit');
    await waitFor(() => expect(screen.getByRole('textbox', { name: 'Téléphone' })).toHaveValue('+212611111111'));
    expect(screen.getByRole('button', { name: /Monogramme/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText('Couleur principale — choisir une couleur')).toHaveValue('#2255aa');
    expect(screen.getByLabelText('Couleur secondaire — choisir une couleur')).toHaveValue('#dce8f5');
    expect(screen.getByLabelText('Adresse', { selector: 'input[type=checkbox]' })).not.toBeChecked();
    expect(screen.getByLabelText('Composition du recto')).toHaveValue('brand');
    expect(profile).toEqual(originalProfile);
  });

  it('hydrates a different saved card when only the route ID changes', async () => {
    cards.set('one', record('one'));
    const second = documentFixture(); second.identity.fullName = 'Deuxième identité';
    cards.set('two', record('two', second));
    const { router } = renderFlow('/business-cards/one/edit');
    await waitFor(() => expect(screen.getByLabelText('Nom complet')).toHaveValue('Identité enregistrée'));
    await act(() => router.navigate('/business-cards/two/edit'));
    await waitFor(() => expect(screen.getByLabelText('Nom complet')).toHaveValue('Deuxième identité'));
  });

  it.each(['disable-back', 'contacts-only'])('keeps a static QR document valid after %s', async (change) => {
    const document = documentFixture();
    document.sides.back.composition = 'contact-qr';
    document.qr = { mode: 'static', type: 'url', content: 'https://example.com' };
    cards.set('one', record('one', document));
    renderFlow('/business-cards/one/edit');
    await screen.findByRole('button', { name: 'Enregistrer les changements' });
    if (change === 'disable-back') fireEvent.click(screen.getByLabelText('Activer le verso'));
    else fireEvent.change(screen.getByLabelText('Contenu du verso'), { target: { value: 'contact' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer les changements' }));
    await screen.findByRole('heading', { name: /^Cartes de visite/, level: 1 });
    expect(cards.get('one')?.document.qr).toBeUndefined();
    expect(() => parseBusinessCardDocument(cards.get('one')?.document)).not.toThrow();
  });

  it('warns about a managed reference and replaces it only by explicit static-QR selection', async () => {
    const document = documentFixture();
    document.sides.back.composition = 'contact-qr';
    document.qr = { mode: 'managed', qrCodeId: 'c1aa99cc-6f9d-4130-8a61-f20d12aa47e1' };
    cards.set('one', record('one', document));
    renderFlow('/business-cards/one/edit');
    await screen.findByRole('alert');
    expect(screen.getByLabelText('Afficher le QR statique')).not.toBeChecked();
    expect(mocks.put).not.toHaveBeenCalled();
    fireEvent.click(screen.getByLabelText('Afficher le QR statique'));
    fireEvent.change(screen.getByLabelText('Contenu encodé'), { target: { value: 'https://example.com/contact' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer les changements' }));
    await screen.findByRole('heading', { name: /^Cartes de visite/, level: 1 });
    expect(cards.get('one')?.document.qr).toEqual({ mode: 'static', type: 'url', content: 'https://example.com/contact' });
  });

  it('shows a safe error for a missing/foreign card and exposes no editable document', async () => {
    renderFlow('/business-cards/missing/edit');
    await screen.findByRole('heading', { name: 'Carte introuvable' });
    expect(screen.queryByLabelText('Nom complet')).not.toBeInTheDocument();
    expect(mocks.put).not.toHaveBeenCalled();
  });
});

describe('Business Card library integration', () => {
  it('shows loading, then an honest empty state and create entry point', async () => {
    let resolve: (cards: BusinessCardRecord[]) => void = () => undefined;
    mocks.get.mockReturnValueOnce(new Promise<BusinessCardRecord[]>((done) => { resolve = done; }));
    renderFlow();
    expect(screen.getByRole('status')).toHaveTextContent('Chargement');
    await act(async () => resolve([]));
    await screen.findByText('Votre identité, en format de poche.');
    expect(screen.getByRole('link', { name: /Créer ma carte/ })).toHaveAttribute('href', '/business-cards/new');
  });

  it('offers retry after an API failure', async () => {
    mocks.get.mockRejectedValueOnce(new Error('API unavailable'));
    renderFlow();
    await screen.findByRole('alert');
    fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }));
    await screen.findByText('Votre identité, en format de poche.');
  });

  it('requires confirmation, leaves cancel untouched, and retains the card after a failed delete', async () => {
    cards.set('one', record('one'));
    renderFlow();
    const remove = await screen.findByRole('button', { name: 'Supprimer Carte enregistrée' });
    fireEvent.click(remove);
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(mocks.delete).not.toHaveBeenCalled();
    mocks.delete.mockRejectedValueOnce(new Error('API unavailable'));
    fireEvent.click(remove);
    fireEvent.click(screen.getByRole('button', { name: 'Supprimer' }));
    await screen.findByText('La carte n’a pas pu être supprimée. Réessayez.');
    expect(cards.has('one')).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Supprimer' }));
    await screen.findByText('Votre identité, en format de poche.');
    expect(cards.size).toBe(0);
  });
});
