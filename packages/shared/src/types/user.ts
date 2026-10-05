// User types

export type SubscriptionTier = 'free' | 'pro' | 'business' | 'enterprise';

export interface User {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  tier: SubscriptionTier;
  stripeCustomerId?: string;
  createdAt: string;
  updatedAt: string;
}

// Profile type (from Supabase profiles table)
export interface UserProfile {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  jobTitle?: string;
  company?: string;
  phone?: string;
  website?: string;
  address?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  instagramUrl?: string;
  xUrl?: string;
  companyLogoUrl?: string;
  primaryBrandColor?: string;
  secondaryBrandColor?: string;
  tier: SubscriptionTier;
  linksCreated?: number;
  qrCreated?: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfileUpdate {
  fullName?: string | null;
  avatarPath?: string | null;
  jobTitle?: string | null;
  company?: string | null;
  phone?: string | null;
  website?: string | null;
  address?: string | null;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  instagramUrl?: string | null;
  xUrl?: string | null;
  companyLogoPath?: string | null;
  primaryBrandColor?: string | null;
  secondaryBrandColor?: string | null;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  fullName?: string;
}
