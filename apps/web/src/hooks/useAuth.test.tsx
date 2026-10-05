import { afterEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { mockUser } from '../test/mocks/supabase';

const { apiMock } = vi.hoisted(() => ({ apiMock: { get: vi.fn(), put: vi.fn() } }));
vi.mock('../lib/api', () => ({ api: apiMock }));
vi.mock('../lib/supabase', () => ({ supabase: { auth: {} } }));

import { useProfile, useUpdateProfile } from './useAuth';
import { useAuthStore } from '../stores/auth.store';

const profile = {
  id: mockUser.id,
  email: mockUser.email,
  fullName: 'Ada Lovelace',
  jobTitle: 'Engineer',
  company: 'Analytical Engines',
  tier: 'free' as const,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
function wrapper({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('profile API hooks', () => {
  afterEach(() => {
    cleanup();
    queryClient.clear();
    vi.clearAllMocks();
    useAuthStore.setState({ user: null, profile: null, session: null, isLoading: false, isAuthenticated: false });
  });

  it('loads a camelCase profile through GET /auth/me for the signed-in user', async () => {
    useAuthStore.getState().setUser(mockUser);
    apiMock.get.mockResolvedValue({
      id: profile.id,
      email: profile.email,
      full_name: profile.fullName,
      job_title: profile.jobTitle,
      company: profile.company,
      tier: profile.tier,
      created_at: profile.createdAt,
      updated_at: profile.updatedAt,
      stripe_customer_id: 'must-not-enter-profile-state',
    });

    const { result } = renderHook(() => useProfile(), { wrapper });

    await waitFor(() => expect(result.current.data).toEqual(profile));
    expect(result.current.data).not.toHaveProperty('stripe_customer_id');
    expect(apiMock.get).toHaveBeenCalledWith('/auth/me');
  });

  it('updates through PUT /auth/me and refreshes the shared profile state', async () => {
    useAuthStore.getState().setUser(mockUser);
    apiMock.put.mockResolvedValue(profile);

    const { result } = renderHook(() => useUpdateProfile(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ fullName: 'Ada Lovelace', jobTitle: 'Engineer' });
    });

    expect(apiMock.put).toHaveBeenCalledWith('/auth/me', { fullName: 'Ada Lovelace', jobTitle: 'Engineer' });
    expect(useAuthStore.getState().profile).toEqual(profile);
  });
});
