// Slug utilities

import { SLUG_CONSTRAINTS } from '../constants';

/**
 * Generate a random slug
 */
export function generateSlug(length = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Validate a slug format
 */
export function isValidSlug(slug: string): boolean {
  if (slug.length < SLUG_CONSTRAINTS.minLength || slug.length > SLUG_CONSTRAINTS.maxLength) {
    return false;
  }
  return SLUG_CONSTRAINTS.pattern.test(slug);
}

/**
 * Sanitize a string to be used as a slug
 */
export function sanitizeSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, SLUG_CONSTRAINTS.maxLength);
}
