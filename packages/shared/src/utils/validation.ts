// Validation utilities

import { URL_CONSTRAINTS, PASSWORD_CONSTRAINTS } from '../constants';

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  if (url.length > URL_CONSTRAINTS.maxLength) {
    return false;
  }
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
export function isValidPassword(password: string): { valid: boolean; message?: string } {
  if (password.length < PASSWORD_CONSTRAINTS.minLength) {
    return {
      valid: false,
      message: `Password must be at least ${PASSWORD_CONSTRAINTS.minLength} characters`,
    };
  }
  if (password.length > PASSWORD_CONSTRAINTS.maxLength) {
    return {
      valid: false,
      message: `Password must be at most ${PASSWORD_CONSTRAINTS.maxLength} characters`,
    };
  }
  return { valid: true };
}

/**
 * Check if a date is in the future
 */
export function isFutureDate(date: string | Date): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.getTime() > Date.now();
}

/**
 * Format date for display
 */
export function formatDate(date: string | Date, locale = 'fr-FR'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format relative time
 */
export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffInSeconds < 60) return "À l'instant";
  if (diffInSeconds < 3600) return `Il y a ${Math.floor(diffInSeconds / 60)} min`;
  if (diffInSeconds < 86400) return `Il y a ${Math.floor(diffInSeconds / 3600)} h`;
  if (diffInSeconds < 2592000) return `Il y a ${Math.floor(diffInSeconds / 86400)} j`;
  return formatDate(d);
}
