import type { z } from 'zod';
import type { RuleSchema, VariantSchema, UtmSchema } from '@wrx/shared';
import { withUtm } from '@wrx/shared';

export interface CachedLink {
  id: string;
  userId: string;
  url: string;
  utm: z.infer<typeof UtmSchema> | null;
  rules: z.infer<typeof RuleSchema>[];
  variants: z.infer<typeof VariantSchema>[];
  expiresAt: string | null;
  maxClicks: number | null;
  clicks: number;
  hasPassword: boolean;
  archived: boolean;
}

export type Unavailable = 'archived' | 'expired' | 'limit';

export function availability(link: CachedLink, now = Date.now()): Unavailable | null {
  if (link.archived) return 'archived';
  if (link.expiresAt && Date.parse(link.expiresAt) <= now) return 'expired';
  if (link.maxClicks != null && link.clicks >= link.maxClicks) return 'limit';
  return null;
}

/**
 * Picks the destination for one visit. Order of precedence:
 * 1. first matching targeting rule (country, then device, in the order the user set them)
 * 2. weighted A/B split — the main URL keeps whatever weight the variants leave
 * 3. the main URL. UTM parameters are applied last, to whichever URL won.
 */
export function chooseDestination(
  link: Pick<CachedLink, 'url' | 'rules' | 'variants' | 'utm'>,
  ctx: { country?: string | null; os?: string },
  random: () => number = Math.random,
): string {
  const target = deviceTarget(ctx.os);
  for (const rule of link.rules) {
    if (rule.type === 'country' && ctx.country && rule.countries.includes(ctx.country.toUpperCase())) return withUtm(rule.url, link.utm);
    if (rule.type === 'device' && rule.devices.includes(target)) return withUtm(rule.url, link.utm);
  }
  if (link.variants.length) {
    const used = link.variants.reduce((s, v) => s + v.weight, 0);
    let roll = random() * 100;
    for (const v of link.variants) {
      if (roll < v.weight) return withUtm(v.url, link.utm);
      roll -= v.weight;
    }
    void used; // remaining (100 - used)% falls through to the main URL
  }
  return withUtm(link.url, link.utm);
}

const deviceTarget = (os?: string) => (os === 'iOS' ? 'ios' : os === 'Android' ? 'android' : 'desktop');
