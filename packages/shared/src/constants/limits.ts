// Tier limits

import type { SubscriptionTier } from '../types';

export interface TierLimits {
  maxLinks: number;
  maxQRCodes: number;
  maxClicksPerMonth: number;
  customSlug: boolean;
  passwordProtection: boolean;
  customQrLogo: boolean;
  analytics: boolean;
  apiAccess: boolean;
  expirationDates: boolean;
  bulkOperations: boolean;
  prioritySupport: boolean;
}

export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  free: {
    maxLinks: 10,
    maxQRCodes: 5,
    maxClicksPerMonth: 1000,
    customSlug: false,
    passwordProtection: false,
    customQrLogo: false,
    analytics: false,
    apiAccess: false,
    expirationDates: false,
    bulkOperations: false,
    prioritySupport: false,
  },
  pro: {
    maxLinks: 500,
    maxQRCodes: 200,
    maxClicksPerMonth: 50000,
    customSlug: true,
    passwordProtection: true,
    customQrLogo: true,
    analytics: true,
    apiAccess: true,
    expirationDates: true,
    bulkOperations: false,
    prioritySupport: false,
  },
  enterprise: {
    maxLinks: -1, // unlimited
    maxQRCodes: -1, // unlimited
    maxClicksPerMonth: -1, // unlimited
    customSlug: true,
    passwordProtection: true,
    customQrLogo: true,
    analytics: true,
    apiAccess: true,
    expirationDates: true,
    bulkOperations: true,
    prioritySupport: true,
  },
};

export const SLUG_CONSTRAINTS = {
  minLength: 3,
  maxLength: 50,
  pattern: /^[a-zA-Z0-9_-]+$/,
};

export const URL_CONSTRAINTS = {
  maxLength: 2048,
};

export const PASSWORD_CONSTRAINTS = {
  minLength: 4,
  maxLength: 100,
};
