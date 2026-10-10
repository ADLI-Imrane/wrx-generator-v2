import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ComposerExperiment from './ComposerExperiment';

const mocks = vi.hoisted(() => ({ reduced: false, progress: vi.fn(), dispose: vi.fn(), kill: vi.fn(), create: vi.fn(), revert: vi.fn() }));
vi.mock('./createComposerBed', () => ({ createComposerBed: vi.fn(async () => ({ setProgress: mocks.progress, setPointerTilt: vi.fn(), dispose: mocks.dispose })) }));
vi.mock('gsap', () => ({ default: {
  registerPlugin: vi.fn(),
  matchMedia: () => ({ add: (_conditions: unknown, callback: (context: unknown) => void) => callback({ conditions: { reduced: mocks.reduced } }), revert: mocks.revert }),
  to: vi.fn(() => ({ kill: vi.fn() })),
} }));
vi.mock('gsap/ScrollTrigger', () => ({ ScrollTrigger: { create: mocks.create } }));

describe('Composer experiment lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.reduced = false;
    mocks.create.mockReturnValue({ progress: 0, kill: mocks.kill });
  });
  afterEach(cleanup);

  it('provides accessible framing and a bounded operation', async () => {
    render(<MemoryRouter><ComposerExperiment /></MemoryRouter>);
    expect(screen.getByRole('heading', { name: 'Une adresse. Prête à circuler.' })).toBeInTheDocument();
    expect(screen.getByRole('slider', { name: 'Position de l’encodage' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Créer mon espace/ })).toHaveAttribute('href', '/register');
    await waitFor(() => expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({ start: 'top top', end: 'bottom bottom' })));
  });

  it('shows the completed QR without a scroll trigger for reduced motion', async () => {
    mocks.reduced = true;
    render(<MemoryRouter><ComposerExperiment /></MemoryRouter>);
    await waitFor(() => expect(mocks.progress).toHaveBeenCalledWith(1));
    expect(mocks.create).not.toHaveBeenCalled();
    expect(screen.getByText('QR DIRECT')).toBeInTheDocument();
  });

  it('disposes its rendering resources and media context on unmount', async () => {
    const view = render(<MemoryRouter><ComposerExperiment /></MemoryRouter>);
    await waitFor(() => expect(mocks.progress).toHaveBeenCalled());
    view.unmount();
    expect(mocks.dispose).toHaveBeenCalledOnce();
    expect(mocks.revert).toHaveBeenCalledOnce();
  });
});
