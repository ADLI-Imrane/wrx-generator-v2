// App constants

export const APP_NAME = 'WRX Generator';
export const APP_VERSION = '2.0.0';
export const APP_DESCRIPTION =
  "Plateforme de génération d'URLs raccourcies et de QR codes personnalisés";

export const DEFAULT_DOMAIN = 'wrx.io';

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  LINKS: '/dashboard/links',
  QR_CODES: '/dashboard/qr',
  ANALYTICS: '/dashboard/analytics',
  SETTINGS: '/dashboard/settings',
  PRICING: '/pricing',
} as const;

export const API_ROUTES = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
  },
  LINKS: {
    BASE: '/links',
    BY_ID: (id: string) => `/links/${id}`,
    STATS: (id: string) => `/links/${id}/stats`,
  },
  QR: {
    BASE: '/qr',
    GENERATE: '/qr/generate',
    UPLOAD_LOGO: '/qr/upload-logo',
  },
  PUBLIC: {
    REDIRECT: (slug: string) => `/${slug}`,
  },
} as const;
