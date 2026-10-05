import { describe, expect, it } from 'vitest';
import { parseUA, randomSlug, isValidCustomSlug, withUtm } from '@wrx/shared';
import { chooseDestination, availability } from '../src/lib/route';
import { fillSeries } from '../src/routes/analytics';
import { hashPassword, verifyPassword } from '../src/lib/crypto';

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const PIXEL = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36';
const MAC = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

describe('parseUA', () => {
  it('classifies phones, desktops and bots', () => {
    expect(parseUA(IPHONE)).toEqual({ device: 'mobile', os: 'iOS', browser: 'Safari' });
    expect(parseUA(PIXEL)).toMatchObject({ device: 'mobile', os: 'Android', browser: 'Chrome' });
    expect(parseUA(MAC)).toMatchObject({ device: 'desktop', os: 'macOS', browser: 'Chrome' });
    expect(parseUA('Twitterbot/1.0').device).toBe('bot');
    expect(parseUA(undefined).device).toBe('bot');
  });
});

describe('slugs', () => {
  it('generates unambiguous slugs of the requested length', () => {
    const s = randomSlug(8);
    expect(s).toHaveLength(8);
    expect(s).not.toMatch(/[0O1lI]/);
  });
  it('rejects reserved and malformed custom slugs', () => {
    expect(isValidCustomSlug('summer-sale')).toBe(true);
    expect(isValidCustomSlug('api')).toBe(false);
    expect(isValidCustomSlug('-bad')).toBe(false);
    expect(isValidCustomSlug('has space')).toBe(false);
  });
});

describe('chooseDestination', () => {
  const base = { url: 'https://main.test/', utm: null, rules: [], variants: [] };
  it('applies country rules before device rules', () => {
    const link = { ...base, rules: [
      { type: 'country' as const, countries: ['MA'], url: 'https://ma.test/' },
      { type: 'device' as const, devices: ['ios' as const], url: 'https://ios.test/' },
    ] };
    expect(chooseDestination(link, { country: 'MA', os: 'iOS' })).toBe('https://ma.test/');
    expect(chooseDestination(link, { country: 'FR', os: 'iOS' })).toBe('https://ios.test/');
    expect(chooseDestination(link, { country: 'FR', os: 'Windows' })).toBe('https://main.test/');
  });
  it('splits traffic by weight and leaves the remainder to the main URL', () => {
    const link = { ...base, variants: [{ url: 'https://b.test/', weight: 30 }] };
    expect(chooseDestination(link, {}, () => 0.1)).toBe('https://b.test/');
    expect(chooseDestination(link, {}, () => 0.5)).toBe('https://main.test/');
  });
  it('adds UTM parameters to the winning URL', () => {
    expect(chooseDestination({ ...base, url: 'https://main.test/?a=1', utm: { source: 'ig', campaign: 'spring' } }, {}))
      .toBe('https://main.test/?a=1&utm_source=ig&utm_campaign=spring');
    expect(withUtm('https://x.test/', null)).toBe('https://x.test/');
  });
});

describe('availability', () => {
  const link = { id: 'l', userId: 'u', url: 'x', utm: null, rules: [], variants: [], expiresAt: null, maxClicks: null, clicks: 0, hasPassword: false, archived: false };
  it('reports why a link is closed', () => {
    expect(availability(link)).toBeNull();
    expect(availability({ ...link, archived: true })).toBe('archived');
    expect(availability({ ...link, expiresAt: '2000-01-01T00:00:00Z' })).toBe('expired');
    expect(availability({ ...link, maxClicks: 3, clicks: 3 })).toBe('limit');
  });
});

describe('fillSeries', () => {
  it('returns one point per day with zeros for silent days', () => {
    const now = Date.parse('2026-10-05T12:00:00Z');
    const s = fillSeries([{ t: '2026-10-04', clicks: 5, qr: 1 }], '7d', now);
    expect(s).toHaveLength(7);
    expect(s.at(-1)!.t).toBe('2026-10-05');
    expect(s.at(-2)).toEqual({ t: '2026-10-04', clicks: 5, qr: 1 });
    expect(s[0]!.clicks).toBe(0);
  });
});

describe('passwords', () => {
  it('verifies the right password only', async () => {
    const h = await hashPassword('s3cret!', 1000);
    expect(await verifyPassword('s3cret!', h)).toBe(true);
    expect(await verifyPassword('wrong', h)).toBe(false);
  });
});
