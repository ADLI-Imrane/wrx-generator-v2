import { describe, expect, it, vi } from 'vitest';
import type { DigitalCardRecord } from '@wrx/shared';
import {
  copyDigitalCardLink,
  getDigitalCardSharingTarget,
  isNativeDigitalCardShareAvailable,
  shareDigitalCard,
} from './digital-card-sharing';

const card: DigitalCardRecord = {
  id: 'card-1',
  userId: 'owner-1',
  title: 'Carte professionnelle',
  slug: 'a1b2c3d4e5f6a7b8c9d0a1b2c3d4e5f6',
  status: 'published',
  schemaVersion: 1,
  document: {
    schemaVersion: 1,
    identity: { fullName: 'Nora Benali', jobTitle: null, company: null, avatarPath: null, companyLogoPath: null },
    contact: { email: null, phone: null, website: null, address: null },
    socialLinks: {},
    visibility: {
      fullName: true, jobTitle: false, company: false, avatar: false, companyLogo: false,
      email: false, phone: false, website: false, address: false, linkedin: false,
      github: false, instagram: false, x: false,
    },
    brand: { primaryColor: '#235EE7', secondaryColor: null },
    presentation: { style: 'light' },
  },
  createdAt: '2026-10-08T00:00:00Z',
  updatedAt: '2026-10-08T00:00:00Z',
  publishedAt: '2026-10-08T00:00:00Z',
};

describe('Digital Card sharing foundation', () => {
  it('uses the stable absolute public URL verbatim as QR payload, without tracking parameters', () => {
    const target = getDigitalCardSharingTarget(card, 'https://wrx.example');
    expect(target).toMatchObject({
      url: 'https://wrx.example/c/a1b2c3d4e5f6a7b8c9d0a1b2c3d4e5f6',
      qrPayload: 'https://wrx.example/c/a1b2c3d4e5f6a7b8c9d0a1b2c3d4e5f6',
      title: 'Nora Benali',
      text: 'Carte numérique',
    });
    expect(target?.url).not.toMatch(/[?&](utm_|track|analytics)/i);
    expect(target?.url).not.toContain('mailto:');
  });

  it('does not provide a sharing target for drafts', () => {
    expect(getDigitalCardSharingTarget({ ...card, status: 'draft' }, 'https://wrx.example')).toBeNull();
  });

  it('detects Web Share safely when unavailable or outside a browser', () => {
    expect(isNativeDigitalCardShareAvailable(null)).toBe(false);
    expect(isNativeDigitalCardShareAvailable({ share: vi.fn() })).toBe(true);
  });

  it('copies the stable link when native share is unavailable', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const target = getDigitalCardSharingTarget(card, 'https://wrx.example')!;
    await expect(shareDigitalCard(target, { clipboard: { writeText } })).resolves.toBe('copied');
    expect(writeText).toHaveBeenCalledWith(target.url);
  });

  it('uses native share first and falls back to copy if sharing fails', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const target = getDigitalCardSharingTarget(card, 'https://wrx.example')!;
    const share = vi.fn().mockRejectedValue(new Error('share unavailable'));
    await expect(shareDigitalCard(target, { share, clipboard: { writeText } })).resolves.toBe('copied');
    expect(share).toHaveBeenCalledWith({ title: target.title, text: target.text, url: target.url });
    expect(writeText).toHaveBeenCalledWith(target.url);
  });

  it('does not copy or report success when the user cancels native share', async () => {
    const writeText = vi.fn();
    const abort = new Error('cancelled');
    abort.name = 'AbortError';
    const target = getDigitalCardSharingTarget(card, 'https://wrx.example')!;
    await expect(shareDigitalCard(target, { share: vi.fn().mockRejectedValue(abort), clipboard: { writeText } }))
      .resolves.toBe('cancelled');
    expect(writeText).not.toHaveBeenCalled();
  });

  it('returns unavailable rather than claiming a copy when clipboard is absent or fails', async () => {
    const target = getDigitalCardSharingTarget(card, 'https://wrx.example')!;
    await expect(copyDigitalCardLink(target.url, null)).resolves.toBe(false);
    await expect(shareDigitalCard(target, { clipboard: { writeText: vi.fn().mockRejectedValue(new Error()) } }))
      .resolves.toBe('unavailable');
  });
});
