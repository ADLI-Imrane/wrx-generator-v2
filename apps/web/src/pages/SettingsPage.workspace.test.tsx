import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SettingsPage } from './SettingsPage';
import { defaultWorkspacePreferences, workspacePreferencesKey } from '../lib/workspace-preferences';
import { useWorkspacePreferencesStore } from '../stores/workspace-preferences.store';

vi.mock('../stores/auth.store', () => ({ useAuthStore: () => ({ user: null }) }));
vi.mock('../hooks/useAuth', () => ({
  useProfile: () => ({ data: null, isLoading: false, isError: false, refetch: vi.fn() }),
  useUpdateProfile: () => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false, error: null }),
  useUpdatePassword: () => ({ mutate: vi.fn(), isPending: false, error: null }),
  useLogout: () => ({ mutate: vi.fn() }),
}));
vi.mock('../hooks/useBilling', () => ({
  useSubscription: () => ({ data: null, isLoading: false }),
  useUsage: () => ({ data: null, isLoading: false }),
}));
vi.mock('../lib/supabase', () => ({ supabase: { auth: { getUser: vi.fn() }, storage: {} } }));

describe('Settings workspace preferences', () => {
  beforeEach(() => {
    localStorage.clear();
    useWorkspacePreferencesStore.setState({ ...defaultWorkspacePreferences, userId: 'settings-user' });
  });

  it('offers navigation and accent controls and persists each selection', () => {
    render(<MemoryRouter><SettingsPage /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: 'Espace de travail' }));
    fireEvent.click(screen.getByRole('button', { name: /Dock/ }));
    fireEvent.click(screen.getByRole('button', { name: /Vert/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Sombre' }));

    expect(screen.getByRole('button', { name: /Dock/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /Vert/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Sombre' })).toHaveAttribute('aria-pressed', 'true');
    expect(JSON.parse(localStorage.getItem(workspacePreferencesKey('settings-user')) || '{}'))
      .toEqual({ navigationMode: 'dock', accent: 'green', appearance: 'dark' });
  });

  it('offers Light, Dark, and System without changing the accent', () => {
    useWorkspacePreferencesStore.setState({ ...defaultWorkspacePreferences, accent: 'red', userId: 'settings-user' });
    render(<MemoryRouter><SettingsPage /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: 'Espace de travail' }));
    fireEvent.click(screen.getByRole('button', { name: 'Système' }));
    expect(useWorkspacePreferencesStore.getState()).toMatchObject({ appearance: 'system', accent: 'red' });
    expect(JSON.parse(localStorage.getItem(workspacePreferencesKey('settings-user')) || '{}'))
      .toMatchObject({ appearance: 'system', accent: 'red' });
  });
});
