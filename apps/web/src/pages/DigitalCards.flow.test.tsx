import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import type { DigitalCardDocumentV1, DigitalCardRecord } from '@wrx/shared';
import { DigitalCardsPage } from './DigitalCardsPage';
import { DigitalCardEditorPage } from './DigitalCardEditorPage';

const apiMocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
}));
const userProfile = vi.hoisted(() => ({
  fullName: 'Nora Benali',
  jobTitle: 'Designer',
  company: 'Studio Nord',
  email: 'nora@example.com',
  phone: '+212600000000',
  website: 'https://example.com',
  linkedinUrl: 'https://linkedin.com/in/nora',
  primaryBrandColor: '#3456AB',
  secondaryBrandColor: '#ABCDEF',
}));
const physicalSource = vi.hoisted(() => ({
  id: 'physical-1',
  userId: '2c783f2e-3d72-41b9-83d6-a6adbe6e8501',
  title: 'Carte physique',
  templateKey: 'editorial',
  schemaVersion: 1,
  createdAt: '',
  updatedAt: '',
  document: {
    schemaVersion: 1,
    templateKey: 'editorial',
    identity: {
      fullName: 'Nora depuis la carte',
      company: 'Studio Nord',
      email: 'nora@example.com',
      phone: '+212600000000',
      website: 'https://example.com',
      socialLinks: { github: 'https://github.com/nora' },
      avatarPath: '2c783f2e-3d72-41b9-83d6-a6adbe6e8501/avatar',
      companyLogoPath: '2c783f2e-3d72-41b9-83d6-a6adbe6e8501/company-logo',
    },
    visibility: {
      fullName: true,
      jobTitle: true,
      company: true,
      email: true,
      phone: true,
      website: true,
      address: true,
      linkedin: true,
      github: true,
      instagram: true,
      x: true,
      avatar: true,
      companyLogo: true,
      qr: true,
    },
    brand: { primaryColor: '#3456AB', secondaryColor: '#ABCDEF' },
    sides: {
      front: { composition: 'brand' },
      back: { enabled: true, composition: 'contact-qr' },
    },
    qr: { mode: 'static', type: 'url', content: 'https://example.com' },
  },
}));
vi.mock('../lib/api', () => ({ api: apiMocks }));
vi.mock('../hooks/useAuth', () => ({
  useProfile: () => ({
    data: userProfile,
    isLoading: false,
    isSuccess: true,
    isError: false,
  }),
}));
vi.mock('../hooks/useBusinessCards', () => ({
  useBusinessCards: () => ({
    data: [physicalSource],
    isLoading: false,
    isError: false,
  }),
}));
vi.mock('../stores/auth.store', () => ({
  useAuthStore: () => ({
    user: {
      id: '2c783f2e-3d72-41b9-83d6-a6adbe6e8501',
      email: 'nora@example.com',
    },
  }),
}));
vi.mock('../lib/supabase', () => ({
  supabase: {
    storage: {
      from: () => ({
        createSignedUrl: async (path: string) => ({
          data: { signedUrl: `https://signed.test/${path}` },
          error: null,
        }),
      }),
    },
  },
}));

const records = new Map<string, DigitalCardRecord>();
function record(
  id: string,
  document: DigitalCardDocumentV1,
  title = 'Carte de Nora',
  status: 'draft' | 'published' = 'draft'
): DigitalCardRecord {
  return {
    id,
    userId: '2c783f2e-3d72-41b9-83d6-a6adbe6e8501',
    title,
    slug: 'nora-k4f9p7x2',
    status,
    schemaVersion: 1,
    document,
    createdAt: '2026-10-07T10:00:00Z',
    updatedAt: '2026-10-07T10:00:00Z',
    publishedAt: status === 'published' ? '2026-10-07T10:00:00Z' : null,
  };
}
function validDocument(): DigitalCardDocumentV1 {
  return {
    schemaVersion: 1,
    identity: {
      fullName: 'Nora Benali',
      jobTitle: 'Designer',
      company: 'Studio Nord',
      avatarPath: null,
      companyLogoPath: null,
    },
    contact: {
      email: 'nora@example.com',
      phone: null,
      website: null,
      address: null,
    },
    socialLinks: {},
    visibility: {
      fullName: true,
      jobTitle: true,
      company: true,
      avatar: true,
      companyLogo: true,
      email: true,
      phone: true,
      website: true,
      address: false,
      linkedin: true,
      github: true,
      instagram: true,
      x: true,
    },
    brand: { primaryColor: '#235EE7', secondaryColor: null },
    presentation: { style: 'light' },
  };
}

function renderFlow(path: string) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  function TestRoutes() {
    const navigate = useNavigate();
    useEffect(() => {
      (window as Window & { testNavigate?: typeof navigate }).testNavigate = navigate;
    }, [navigate]);
    return (
      <Routes>
        <Route path="/digital-cards" element={<DigitalCardsPage />} />
        <Route path="/digital-cards/new" element={<DigitalCardEditorPage />} />
        <Route path="/digital-cards/:id/edit" element={<DigitalCardEditorPage />} />
      </Routes>
    );
  }
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <TestRoutes />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  records.clear();
  vi.clearAllMocks();
  apiMocks.get.mockImplementation(async (url: string) => {
    if (url === '/digital-cards') return [...records.values()];
    const item = records.get(url.split('/').at(-1) || '');
    if (!item) throw new Error('HTTP 404');
    return structuredClone(item);
  });
  apiMocks.post.mockImplementation(
    async (url: string, input?: { title: string; document: DigitalCardDocumentV1 }) => {
      if (url.endsWith('/publish') || url.endsWith('/unpublish')) {
        const id = url.split('/').at(-2) || '';
        const item = records.get(id)!;
        const status: DigitalCardRecord['status'] = url.endsWith('/publish')
          ? 'published'
          : 'draft';
        const next = {
          ...item,
          status,
          publishedAt: status === 'published' ? new Date().toISOString() : null,
        };
        records.set(id, next);
        return structuredClone(next);
      }
      const item = record('created-card', input!.document, input!.title);
      records.set(item.id, item);
      return structuredClone(item);
    }
  );
  apiMocks.put.mockImplementation(
    async (url: string, input: { title: string; document: DigitalCardDocumentV1 }) => {
      const id = url.split('/').at(-1) || '';
      const item = record(id, input.document, input.title, records.get(id)?.status || 'draft');
      records.set(id, item);
      return structuredClone(item);
    }
  );
  apiMocks.delete.mockImplementation(async (url: string) => {
    const id = url.split('/').at(-1) || '';
    records.delete(id);
    return { id, deleted: true };
  });
});

describe('Digital Card owner experience', () => {
  it('offers one-time Profile prefill and persists an independent editable snapshot', async () => {
    const original = structuredClone(userProfile);
    renderFlow('/digital-cards/new');
    fireEvent.click(screen.getByRole('button', { name: /Partir du profil/ }));
    await waitFor(() => expect(screen.getByLabelText('Nom complet')).toHaveValue('Nora Benali'));
    expect(screen.getByLabelText('Couleur principale')).toHaveValue('#3456ab');
    fireEvent.change(screen.getByLabelText('Nom complet'), {
      target: { value: 'Nora — carte seule' },
    });
    expect(screen.getByLabelText('Email visible')).not.toBeChecked();
    expect(screen.queryByText('nora@example.com')).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Présentation'), {
      target: { value: 'dark' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    await waitFor(() =>
      expect(records.get('created-card')?.document.identity.fullName).toBe('Nora — carte seule')
    );
    expect(records.get('created-card')?.document.visibility.email).toBe(false);
    expect(records.get('created-card')?.document.visibility.phone).toBe(false);
    expect(records.get('created-card')?.document.contact.email).toBe('nora@example.com');
    expect(records.get('created-card')?.document.socialLinks.linkedin).toBe(
      'https://linkedin.com/in/nora'
    );
    expect(records.get('created-card')?.document.presentation.style).toBe('dark');
    expect(userProfile).toEqual(original);
  });

  it('copies meaningful physical data only, and leaves physical QR/layout out', async () => {
    const physicalBefore = structuredClone(physicalSource.document);
    const view = renderFlow('/digital-cards/new');
    fireEvent.change(screen.getByLabelText('Copier une carte de visite physique'), {
      target: { value: 'physical-1' },
    });
    await screen.findByLabelText('Nom complet');
    expect(screen.getByLabelText('Nom complet')).toHaveValue('Nora depuis la carte');
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    await waitFor(() => expect(records.has('created-card')).toBe(true));
    const saved = records.get('created-card')!.document;
    expect(saved.socialLinks.github).toBe('https://github.com/nora');
    expect(saved).not.toHaveProperty('qr');
    expect(saved).not.toHaveProperty('sides');
    expect(saved).not.toHaveProperty('templateKey');
    expect(physicalSource.document).toEqual(physicalBefore);
    expect(JSON.stringify(saved)).not.toContain('signed.test');
    await waitFor(() =>
      expect(view.container.querySelector('.dc-avatar img')).toHaveAttribute(
        'src',
        'https://signed.test/2c783f2e-3d72-41b9-83d6-a6adbe6e8501/avatar'
      )
    );
  });

  it('hydrates, updates, and reloads a saved identity snapshot', async () => {
    records.set('existing', record('existing', validDocument(), 'Nora pro'));
    const firstVisit = renderFlow('/digital-cards/existing/edit');
    expect(await screen.findByLabelText('Nom complet')).toHaveValue('Nora Benali');
    fireEvent.change(screen.getByLabelText('Nom complet'), {
      target: { value: 'Nora — édition' },
    });
    fireEvent.change(screen.getByLabelText('Téléphone'), {
      target: { value: '+212611111111' },
    });
    fireEvent.click(screen.getByLabelText('Téléphone visible'));
    fireEvent.change(screen.getByLabelText('Couleur principale'), {
      target: { value: '#446688' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    await screen.findByText('Modifications enregistrées.');
    expect(records.get('existing')?.document.contact.phone).toBe('+212611111111');
    firstVisit.unmount();
    renderFlow('/digital-cards/existing/edit');
    expect(await screen.findByLabelText('Nom complet')).toHaveValue('Nora — édition');
    expect(screen.getByLabelText('Téléphone')).toHaveValue('+212611111111');
    expect(screen.getByLabelText('Téléphone visible')).not.toBeChecked();
    expect(screen.getByLabelText('Couleur principale')).toHaveValue('#446688');
  });

  it('replaces state when switching between saved card IDs', async () => {
    const first = validDocument();
    first.identity.fullName = 'Première identité';
    const second = validDocument();
    second.identity.fullName = 'Deuxième identité';
    records.set('one', record('one', first));
    records.set('two', record('two', second));
    renderFlow('/digital-cards/one/edit');
    expect(await screen.findByLabelText('Nom complet')).toHaveValue('Première identité');
    act(() => {
      (window as Window & { testNavigate?: (path: string) => void }).testNavigate?.(
        '/digital-cards/two/edit'
      );
    });
    await waitFor(() =>
      expect(screen.getByLabelText('Nom complet')).toHaveValue('Deuxième identité')
    );
  });

  it('can start blank and publishing warns about public fields before calling the API', async () => {
    renderFlow('/digital-cards/new');
    fireEvent.click(screen.getByRole('button', { name: /Commencer sans données/ }));
    await screen.findByLabelText('Nom complet');
    fireEvent.change(screen.getByLabelText('Nom complet'), {
      target: { value: 'Mina A.' },
    });
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'mina@example.com' },
    });
    fireEvent.click(screen.getByLabelText('Email visible'));
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer et publier…' }));
    expect(
      await screen.findByText(/Les informations et images sélectionnées comme visibles/)
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmer la publication' }));
    await waitFor(() => expect(records.get('created-card')?.status).toBe('published'));
    fireEvent.click(screen.getByRole('button', { name: 'Dépublier…' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmer la dépublication' }));
    await waitFor(() => expect(records.get('created-card')?.status).toBe('draft'));
  });

  it('presents drafts and published status in the library and confirms deletion', async () => {
    const draft = record('draft-1', validDocument(), 'Brouillon');
    const published = record('public-1', validDocument(), 'Publiée', 'published');
    records.set(draft.id, draft);
    records.set(published.id, published);
    renderFlow('/digital-cards');
    expect(await screen.findByText('Brouillon')).toBeInTheDocument();
    expect(screen.getByText('Publiée', { selector: '.dc-status' })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Afficher le QR' })).toHaveLength(1);
    expect(screen.getByRole('link', { name: 'Afficher le QR' })).toHaveAttribute(
      'href',
      '/digital-cards/public-1/share'
    );
    fireEvent.click(screen.getByRole('button', { name: 'Supprimer Brouillon' }));
    fireEvent.click(screen.getByRole('button', { name: /^Supprimer$/ }));
    await waitFor(() => expect(records.has(draft.id)).toBe(false));
  });

  it('offers Share Mode from the editor only for a published card', async () => {
    records.set('published-editor', record('published-editor', validDocument(), 'Publiée', 'published'));
    renderFlow('/digital-cards/published-editor/edit');
    expect(await screen.findByRole('link', { name: 'Afficher le QR' })).toHaveAttribute(
      'href',
      '/digital-cards/published-editor/share'
    );
  });

  it('shows an empty state and an accessible create action', async () => {
    renderFlow('/digital-cards');
    expect(
      await screen.findByRole('heading', {
        name: 'Une présence professionnelle, à votre façon.',
      })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Créer ma carte/ })).toHaveAttribute(
      'href',
      '/digital-cards/new'
    );
  });

  it('surfaces library loading errors with retry and editor hydration errors safely', async () => {
    apiMocks.get.mockRejectedValueOnce(new Error('offline'));
    const view = renderFlow('/digital-cards');
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Impossible de charger vos cartes numériques'
    );
    fireEvent.click(screen.getByRole('button', { name: /Réessayer/ }));
    await waitFor(() => expect(apiMocks.get).toHaveBeenCalledTimes(2));
    view.unmount();
    renderFlow('/digital-cards/missing/edit');
    expect(
      await screen.findByText(/Cette carte n’existe pas ou vous n’y avez pas accès/)
    ).toBeInTheDocument();
  });

  it('shows a loading state while the owner library request is pending', async () => {
    apiMocks.get.mockReturnValueOnce(new Promise(() => undefined));
    renderFlow('/digital-cards');
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Chargement de vos cartes numériques'
    );
  });
});
