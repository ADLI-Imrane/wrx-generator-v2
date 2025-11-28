import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '@/stores/auth.store';
import { mockUser, mockSession } from '@/test/mocks/supabase';
import type { User, Session } from '@supabase/supabase-js';

describe('Auth Store', () => {
  beforeEach(() => {
    // Reset store before each test
    useAuthStore.setState({
      user: null,
      session: null,
      profile: null,
      isLoading: true,
      isAuthenticated: false,
    });
  });

  it('should have correct initial state', () => {
    const state = useAuthStore.getState();

    expect(state.user).toBeNull();
    expect(state.session).toBeNull();
    expect(state.profile).toBeNull();
    expect(state.isLoading).toBe(true);
    expect(state.isAuthenticated).toBe(false);
  });

  it('should set user and update isAuthenticated', () => {
    const { setUser } = useAuthStore.getState();

    setUser(mockUser as User);

    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.isAuthenticated).toBe(true);
  });

  it('should set session', () => {
    const { setSession } = useAuthStore.getState();

    setSession(mockSession as Session);

    const state = useAuthStore.getState();
    expect(state.session).toEqual(mockSession);
  });

  it('should login with user and session', () => {
    const { login } = useAuthStore.getState();

    login(mockUser as User, mockSession as Session);

    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.session).toEqual(mockSession);
    expect(state.isAuthenticated).toBe(true);
    expect(state.isLoading).toBe(false);
  });

  it('should logout and clear state', () => {
    const { login, logout } = useAuthStore.getState();

    // First login
    login(mockUser as User, mockSession as Session);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);

    // Then logout
    logout();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.session).toBeNull();
    expect(state.profile).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(false);
  });

  it('should update profile', () => {
    const { setProfile, updateProfile } = useAuthStore.getState();

    // Set initial profile
    setProfile({
      id: 'test-id',
      fullName: 'Test User',
      tier: 'free',
      linksCreated: 0,
      qrCreated: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Update profile
    updateProfile({ fullName: 'Updated Name', tier: 'pro' });

    const state = useAuthStore.getState();
    expect(state.profile?.fullName).toBe('Updated Name');
    expect(state.profile?.tier).toBe('pro');
  });

  it('should set loading state', () => {
    const { setLoading } = useAuthStore.getState();

    setLoading(false);
    expect(useAuthStore.getState().isLoading).toBe(false);

    setLoading(true);
    expect(useAuthStore.getState().isLoading).toBe(true);
  });
});
