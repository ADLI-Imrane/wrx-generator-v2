import { describe, expect, it } from 'vitest';
import { getManagedLinkStatus, isLinkEligibleForManagedQr, managedLinkStatusLabel } from './managed-qr';
import type { Link } from '@wrx/shared';

const link = (overrides: Partial<Link> = {}): Link => ({
  id: 'link-1', userId: 'owner-1', slug: 'stable', originalUrl: 'https://example.com',
  shortUrl: 'https://wrx.test/r/stable', clicks: 2, isActive: true,
  createdAt: '2026-10-08T00:00:00.000Z', updatedAt: '2026-10-08T00:00:00.000Z',
  ...overrides,
});

describe('managed QR Link status', () => {
  it('allows an active Link, including one protected by a password', () => {
    const active = link({ isPasswordProtected: true });
    expect(getManagedLinkStatus(active)).toBe('active');
    expect(isLinkEligibleForManagedQr(active)).toBe(true);
  });

  it.each([
    [link({ isActive: false }), 'inactive'],
    [link({ expiresAt: '2020-01-01T00:00:00.000Z' }), 'expired'],
    [link({ maxClicks: 2 }), 'limit-reached'],
  ] as const)('excludes unavailable Link status %s', (value, expected) => {
    expect(getManagedLinkStatus(value)).toBe(expected);
    expect(isLinkEligibleForManagedQr(value)).toBe(false);
    expect(managedLinkStatusLabel(expected)).not.toBe('Actif');
  });
});
