import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import BrandHero from './BrandHero';

const mocks = vi.hoisted(() => ({ create: vi.fn(), dispose: vi.fn(), boundary: vi.fn(), disposeBoundary: vi.fn() }));
vi.mock('./createBrandConstruction', () => ({ createBrandConstruction: mocks.create }));
vi.mock('./createHeroBoundary', () => ({ createHeroBoundary: mocks.boundary }));
vi.mock('./useCompositionMotion', () => ({ useCompositionMotion: vi.fn() }));

describe('Brand hero still', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.create.mockReturnValue({ dispose: mocks.dispose });
    mocks.boundary.mockReturnValue(mocks.disposeBoundary);
  });
  afterEach(cleanup);

  it('provides the approved copy and immediately available account actions', () => {
    render(<MemoryRouter><BrandHero /></MemoryRouter>);
    expect(screen.getByRole('heading', { name: 'Créez. Faites circuler.' })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Créer mon espace WRX' })[0]).toHaveAttribute('href', '/register');
    expect(screen.getAllByRole('link', { name: 'Se connecter' })[0]).toHaveAttribute('href', '/login');
    expect(screen.getByRole('img', { name: /Construction WRX/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'VOTRE LIEN WRX' })).toBeInTheDocument();
    expect(screen.getAllByText('wrx.example/r/azur')[0]).toBeInTheDocument();
  });

  it('disposes the static scene and restores the page title', () => {
    const oldTitle = document.title;
    const view = render(<MemoryRouter><BrandHero /></MemoryRouter>);
    expect(mocks.create).toHaveBeenCalledOnce();
    view.unmount();
    expect(mocks.dispose).toHaveBeenCalledOnce();
    expect(mocks.disposeBoundary).toHaveBeenCalledOnce();
    expect(document.title).toBe(oldTitle);
  });

  it('retains accessible copy and navigation when WebGL is unavailable', () => {
    mocks.create.mockImplementationOnce(() => { throw new Error('WebGL unavailable'); });
    render(<MemoryRouter><BrandHero /></MemoryRouter>);
    expect(screen.getByRole('img', { name: /Construction WRX/ })).toHaveAttribute('data-fallback', 'true');
    expect(screen.getAllByRole('link', { name: 'Créer mon espace WRX' })[0]).toBeVisible();
  });
});
