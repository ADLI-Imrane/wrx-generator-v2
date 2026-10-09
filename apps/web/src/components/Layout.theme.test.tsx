import { act, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Layout } from './Layout';
import { writeWorkspacePreferences } from '../lib/workspace-preferences';

vi.mock('./Navbar', () => ({ Navbar: () => null }));
vi.mock('./Sidebar', () => ({ Sidebar: () => null }));
vi.mock('./WorkspaceDock', () => ({ WorkspaceLauncher: () => null }));
vi.mock('../stores/auth.store', () => ({
  useAuthStore: (selector: (state: { user: { id: string } }) => unknown) => selector({ user: { id: 'theme-user' } }),
}));

describe('authenticated workspace appearance', () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => vi.unstubAllGlobals());

  it('applies System appearance and responds when the OS preference changes', () => {
    writeWorkspacePreferences('theme-user', { navigationMode: 'dock', accent: 'red', appearance: 'system' });
    let changeListener: ((event: MediaQueryListEvent) => void) | undefined;
    let systemMatches = false;
    const mediaQuery = {
      get matches() { return systemMatches; },
      addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => { changeListener = listener; },
      removeEventListener: vi.fn(),
    } as unknown as MediaQueryList;
    vi.stubGlobal('matchMedia', vi.fn(() => mediaQuery));

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes><Route element={<Layout />}><Route path="/dashboard" element={<span>Workspace</span>} /></Route></Routes>
      </MemoryRouter>,
    );

    const workspace = screen.getByText('Workspace').closest('.wrx-app');
    expect(workspace).toHaveAttribute('data-theme', 'light');
    expect(workspace).toHaveAttribute('data-accent', 'red');
    expect(workspace).toHaveAttribute('data-navigation-mode', 'dock');

    act(() => {
      systemMatches = true;
      changeListener?.({ matches: true } as MediaQueryListEvent);
    });
    expect(workspace).toHaveAttribute('data-theme', 'dark');
    expect(workspace).toHaveAttribute('data-accent', 'red');
  });
});
