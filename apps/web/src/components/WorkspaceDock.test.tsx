import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { WorkspaceDock, WorkspaceLauncher } from './WorkspaceDock';
import { Navbar } from './Navbar';

vi.mock('../hooks/useAuth', () => ({ useLogout: () => ({ mutate: vi.fn(), isPending: false }) }));

function CurrentPath() {
  const location = useLocation();
  return <output data-testid="current-path">{location.pathname}</output>;
}

describe('workspace navigation modes', () => {
  afterEach(() => vi.useRealTimers());
  it('offers only the primary quick destinations without adding a second menu control', () => {
    render(<MemoryRouter initialEntries={['/business-cards']}><WorkspaceDock /></MemoryRouter>);
    expect(screen.getByRole('link', { name: 'Cartes de visite' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getAllByRole('link')).toHaveLength(4);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('places the dock inside the header and keeps one launcher menu control in dock mode', () => {
    const openLauncher = vi.fn();
    render(<MemoryRouter><Navbar navigationMode="dock" onOpenLauncher={openLauncher} /></MemoryRouter>);
    const header = document.querySelector('.studio-navbar')!;
    expect(header.querySelector('.workspace-dock')).toBeInTheDocument();
    expect(header.querySelector('.studio-navbar-inner')).toHaveClass('has-workspace-dock');
    expect(screen.getAllByRole('button', { name: 'Ouvrir le lanceur d’outils' })).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir le lanceur d’outils' }));
    expect(openLauncher).toHaveBeenCalledOnce();
  });

  it('closes the launcher on Escape and outside interaction while listing each shared destination once', () => {
    vi.useFakeTimers();
    const close = vi.fn();
    render(<MemoryRouter initialEntries={['/dashboard']}><WorkspaceLauncher onClose={close} /></MemoryRouter>);
    expect(screen.getByRole('dialog', { name: 'Vos outils, à portée' })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /Cartes numériques/ })).toHaveLength(1);
    fireEvent.keyDown(document, { key: 'Escape' });
    act(() => vi.advanceTimersByTime(190));
    expect(close).toHaveBeenCalledOnce();
    const outsideClose = vi.fn();
    const outside = render(<MemoryRouter initialEntries={['/dashboard']}><WorkspaceLauncher onClose={outsideClose} /></MemoryRouter>);
    fireEvent.mouseDown(outside.container.querySelector('.workspace-launcher-backdrop')!);
    act(() => vi.advanceTimersByTime(190));
    expect(outsideClose).toHaveBeenCalledOnce();
  });

  it('keeps the active destination represented in the constellation', () => {
    render(<MemoryRouter initialEntries={['/digital-cards/123/edit']}><WorkspaceLauncher onClose={vi.fn()} /></MemoryRouter>);
    expect(screen.getByRole('link', { name: 'Cartes numériques, page actuelle' })).toHaveAttribute('aria-current', 'page');
  });

  it('keeps all shared destinations reachable in an asymmetric main field and a separate utility rail', () => {
    render(<MemoryRouter initialEntries={['/dashboard']}><WorkspaceLauncher onClose={vi.fn()} /></MemoryRouter>);
    const field = screen.getByRole('group', { name: 'Outils principaux' });
    const utility = screen.getByRole('navigation', { name: 'Compte et assistance' });
    expect(field.querySelectorAll(':scope > a')).toHaveLength(8);
    expect(utility.querySelectorAll('a')).toHaveLength(3);
    expect(screen.getAllByRole('link')).toHaveLength(11);
    expect(field.querySelector(':scope > a:nth-child(2)')).toHaveStyle({ '--node-index': '1' });
  });

  it('contracts before navigating to a selected destination', () => {
    vi.useFakeTimers();
    render(<MemoryRouter initialEntries={['/dashboard']}><WorkspaceLauncher onClose={vi.fn()} /><CurrentPath /></MemoryRouter>);
    fireEvent.click(screen.getByRole('link', { name: 'Cartes numériques' }));
    expect(screen.getByTestId('current-path')).toHaveTextContent('/dashboard');
    act(() => vi.advanceTimersByTime(190));
    expect(screen.getByTestId('current-path')).toHaveTextContent('/digital-cards');
  });
});
