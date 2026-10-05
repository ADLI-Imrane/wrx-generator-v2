import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/auth.store';
import { api } from '../lib/api';
import type { UserProfile, UserProfileUpdate } from '@wrx/shared';

// Query keys
export const authKeys = {
  all: ['auth'] as const,
  session: () => [...authKeys.all, 'session'] as const,
  profile: (userId: string) => [...authKeys.all, 'profile', userId] as const,
};

function normalizeProfileResponse(data: unknown): UserProfile {
  if (!data || typeof data !== 'object') throw new Error('Invalid profile response');
  const row = data as Record<string, unknown>;
  const text = (...keys: string[]) => {
    const value = keys.map((key) => row[key]).find((candidate) => typeof candidate === 'string');
    return typeof value === 'string' ? value : undefined;
  };

  return {
    id: text('id') ?? '',
    email: text('email') ?? '',
    fullName: text('fullName', 'full_name'),
    avatarUrl: text('avatarUrl', 'avatar_url'),
    jobTitle: text('jobTitle', 'job_title'),
    company: text('company'),
    phone: text('phone'),
    website: text('website'),
    address: text('address'),
    linkedinUrl: text('linkedinUrl', 'linkedin_url'),
    githubUrl: text('githubUrl', 'github_url'),
    instagramUrl: text('instagramUrl', 'instagram_url'),
    xUrl: text('xUrl', 'x_url'),
    companyLogoUrl: text('companyLogoUrl', 'company_logo_url'),
    primaryBrandColor: text('primaryBrandColor', 'primary_brand_color'),
    secondaryBrandColor: text('secondaryBrandColor', 'secondary_brand_color'),
    tier: (text('tier') ?? 'free') as UserProfile['tier'],
    linksCreated: typeof row['linksCreated'] === 'number' ? row['linksCreated'] as number : undefined,
    qrCreated: typeof row['qrCreated'] === 'number' ? row['qrCreated'] as number : undefined,
    createdAt: text('createdAt', 'created_at') ?? '',
    updatedAt: text('updatedAt', 'updated_at') ?? '',
  };
}

// Hook pour récupérer le profil utilisateur
export function useProfile() {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: authKeys.profile(user?.id ?? 'signed-out'),
    queryFn: async (): Promise<UserProfile | null> => {
      if (!user) return null;
      return normalizeProfileResponse(await api.get<unknown>('/auth/me'));
    },
    enabled: !!user,
  });
}

// Hook pour la connexion email/password
export function useLogin() {
  const { setUser, setSession } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setUser(data.user);
      setSession(data.session);
      queryClient.invalidateQueries({ queryKey: authKeys.all });
    },
  });
}

// Hook pour l'inscription
export function useRegister() {
  const { setUser, setSession } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      email,
      password,
      fullName,
    }: {
      email: string;
      password: string;
      fullName?: string;
    }) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.user) {
        setUser(data.user);
      }
      if (data.session) {
        setSession(data.session);
      }
      queryClient.invalidateQueries({ queryKey: authKeys.all });
    },
  });
}

// Hook pour la déconnexion
export function useLogout() {
  const { logout } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
    onSuccess: () => {
      logout();
      queryClient.clear();
    },
  });
}

// Hook pour la connexion OAuth (Google, GitHub)
export function useOAuthLogin() {
  return useMutation({
    mutationFn: async ({ provider }: { provider: 'google' | 'github' }) => {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
      return data;
    },
  });
}

// Hook pour la réinitialisation du mot de passe
export function useResetPassword() {
  return useMutation({
    mutationFn: async ({ email }: { email: string }) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;
    },
  });
}

// Hook pour mettre à jour le mot de passe
export function useUpdatePassword() {
  return useMutation({
    mutationFn: async ({ password }: { password: string }) => {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) throw error;
    },
  });
}

// Hook pour mettre à jour le profil
export function useUpdateProfile() {
  const { user, setProfile } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfileUpdate) => {
      if (!user) throw new Error('User not authenticated');
      return normalizeProfileResponse(await api.put<unknown>('/auth/me', profile));
    },
    onSuccess: (data) => {
      setProfile(data);
      queryClient.setQueryData(authKeys.profile(data.id), data);
    },
  });
}
