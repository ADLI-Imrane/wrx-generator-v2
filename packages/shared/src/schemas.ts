import { z } from 'zod';
import { isValidCustomSlug } from './slug';

const httpUrl = z
  .string()
  .trim()
  .url({ message: 'Enter a full URL, starting with https://' })
  .refine((u) => /^https?:\/\//i.test(u), 'Only http and https links are supported')
  .max(2048);

export const UtmSchema = z
  .object({
    source: z.string().max(100).optional(),
    medium: z.string().max(100).optional(),
    campaign: z.string().max(100).optional(),
    term: z.string().max(100).optional(),
    content: z.string().max(100).optional(),
  })
  .partial();

export const DEVICE_TARGETS = ['ios', 'android', 'desktop'] as const;

export const RuleSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('country'),
    countries: z.array(z.string().length(2).toUpperCase()).min(1).max(50),
    url: httpUrl,
  }),
  z.object({ type: z.literal('device'), devices: z.array(z.enum(DEVICE_TARGETS)).min(1), url: httpUrl }),
]);

export const VariantSchema = z.object({ url: httpUrl, weight: z.number().int().min(1).max(100) });

export const LinkInputSchema = z.object({
  url: httpUrl,
  slug: z
    .string()
    .trim()
    .refine(isValidCustomSlug, 'Use 3–50 letters, numbers, - or _, and avoid reserved words')
    .optional(),
  title: z.string().trim().max(120).optional(),
  tags: z.array(z.string().trim().min(1).max(24)).max(10).default([]),
  expiresAt: z.iso.datetime().nullish(),
  maxClicks: z.number().int().positive().max(10_000_000).nullish(),
  password: z.string().min(4).max(64).nullish(),
  utm: UtmSchema.nullish(),
  rules: z.array(RuleSchema).max(10).default([]),
  variants: z.array(VariantSchema).max(5).default([]),
});
export type LinkInput = z.infer<typeof LinkInputSchema>;

export const LinkUpdateSchema = LinkInputSchema.partial().extend({
  archived: z.boolean().optional(),
  removePassword: z.boolean().optional(),
});
export type LinkUpdate = z.infer<typeof LinkUpdateSchema>;

export interface Link {
  id: string;
  slug: string;
  url: string;
  title: string | null;
  tags: string[];
  expiresAt: string | null;
  maxClicks: number | null;
  hasPassword: boolean;
  utm: z.infer<typeof UtmSchema> | null;
  rules: z.infer<typeof RuleSchema>[];
  variants: z.infer<typeof VariantSchema>[];
  archived: boolean;
  clicks: number;
  createdAt: string;
  updatedAt: string;
  shortUrl: string;
}

export const QR_DOTS = ['square', 'rounded', 'dots', 'classy', 'classy-rounded', 'extra-rounded'] as const;
export const QR_CORNERS = ['square', 'dot', 'extra-rounded'] as const;
export const QR_FRAMES = ['none', 'label', 'ticket'] as const;
const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Use a hex colour like #1A2B3C');

export const QrDesignSchema = z.object({
  fg: hex.default('#14213D'),
  bg: hex.default('#FFFFFF'),
  gradient: z.object({ to: hex, rotation: z.number().min(0).max(360).default(45) }).nullish(),
  dots: z.enum(QR_DOTS).default('rounded'),
  corners: z.enum(QR_CORNERS).default('extra-rounded'),
  logo: z
    .string()
    .regex(/^data:image\/(png|jpeg|svg\+xml|webp);base64,/, 'Logo must be an image')
    .max(200_000, 'Logo must be under 150 KB')
    .nullish(),
  frame: z.enum(QR_FRAMES).default('none'),
  frameText: z.string().max(24).default('Scan me'),
  margin: z.number().int().min(0).max(40).default(12),
});
export type QrDesign = z.infer<typeof QrDesignSchema>;

export const QrInputSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    linkId: z.string().optional(),
    url: httpUrl.optional(),
    design: QrDesignSchema.default(QrDesignSchema.parse({})),
  })
  .refine((v) => v.linkId || v.url, { message: 'Pick a link or enter a destination URL', path: ['url'] });
export type QrInput = z.infer<typeof QrInputSchema>;

export interface QrCode {
  id: string;
  name: string;
  linkId: string;
  slug: string;
  destination: string;
  encodedUrl: string;
  design: QrDesign;
  scans: number;
  createdAt: string;
}

export const BIO_THEMES = ['ink', 'signal', 'paper', 'route'] as const;
export const PROFILE_KINDS = ['person', 'startup', 'company'] as const;
export type ProfileKind = (typeof PROFILE_KINDS)[number];
/** What a profile is looking for — drives the directory filters and the "Contact" form intents. */
export const OPEN_TO = [
  'hiring',
  'jobs',
  'internships',
  'freelance',
  'cofounder',
  'partnerships',
  'investment',
  'mentoring',
] as const;
export type OpenTo = (typeof OPEN_TO)[number];

export const CardSchema = z
  .object({
    email: z.email().optional().or(z.literal('')),
    phone: z.string().trim().max(30).optional(),
    website: httpUrl.optional().or(z.literal('')),
    company: z.string().trim().max(80).optional(),
    role: z.string().trim().max(80).optional(),
  })
  .default({});

export const BioInputSchema = z.object({
  handle: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_.-]{3,30}$/, 'Use 3–30 lowercase letters, numbers, . _ or -'),
  kind: z.enum(PROFILE_KINDS).default('person'),
  title: z.string().trim().min(1).max(60),
  headline: z.string().trim().max(100).default(''),
  bio: z.string().trim().max(400).default(''),
  avatar: z
    .string()
    .regex(/^data:image\/(png|jpeg|webp);base64,/)
    .max(200_000)
    .nullish(),
  theme: z.enum(BIO_THEMES).default('ink'),
  location: z.string().trim().max(60).default(''),
  industry: z.string().trim().max(60).default(''),
  skills: z.array(z.string().trim().min(1).max(30)).max(15).default([]),
  openTo: z.array(z.enum(OPEN_TO)).max(8).default([]),
  discoverable: z.boolean().default(false),
  card: CardSchema,
  links: z
    .array(z.object({ label: z.string().trim().min(1).max(60), url: httpUrl }))
    .max(20)
    .default([]),
});
export type BioInput = z.infer<typeof BioInputSchema>;
export interface BioPage extends BioInput {
  id: string;
  views: number;
  createdAt: string;
  publicUrl: string;
}
export type PublicProfile = Omit<BioPage, 'id' | 'views'> & { openOpportunities: number };

export const OPPORTUNITY_TYPES = [
  'job',
  'internship',
  'freelance',
  'cofounder',
  'partnership',
  'investment',
] as const;
export type OpportunityType = (typeof OPPORTUNITY_TYPES)[number];
export const OpportunityInputSchema = z.object({
  pageId: z.string().min(1, 'Choose the profile that publishes this'),
  type: z.enum(OPPORTUNITY_TYPES),
  title: z.string().trim().min(4).max(90),
  location: z.string().trim().max(60).default(''),
  remote: z.boolean().default(false),
  description: z.string().trim().min(20, 'Describe it in at least 20 characters').max(4000),
  tags: z.array(z.string().trim().min(1).max(24)).max(10).default([]),
  status: z.enum(['open', 'closed']).default('open'),
});
export type OpportunityInput = z.infer<typeof OpportunityInputSchema>;
export interface Opportunity extends Omit<OpportunityInput, 'pageId'> {
  id: string;
  views: number;
  responses: number;
  createdAt: string;
  publicUrl: string;
  publisher: {
    id: string;
    handle: string;
    title: string;
    kind: ProfileKind;
    avatar: string | null;
    location: string;
  };
}

export const CONTACT_INTENTS = [
  'collaboration',
  'hiring',
  'job',
  'partnership',
  'investment',
  'mentoring',
  'other',
] as const;
export const ContactInputSchema = z.object({
  intent: z.enum(CONTACT_INTENTS),
  name: z.string().trim().min(2).max(80),
  email: z.email(),
  company: z.string().trim().max(80).optional(),
  profileUrl: httpUrl.optional().or(z.literal('')),
  message: z.string().trim().min(10, 'Write at least 10 characters').max(2000),
  opportunityId: z.string().optional(),
  /** Honeypot — real people never fill it. */
  website: z.string().max(0).optional(),
});
export type ContactInput = z.infer<typeof ContactInputSchema>;
export const CONTACT_STATUSES = ['new', 'in_progress', 'closed'] as const;
export interface ContactRequest {
  id: string;
  intent: (typeof CONTACT_INTENTS)[number];
  name: string;
  email: string;
  company: string | null;
  profileUrl: string | null;
  message: string;
  status: (typeof CONTACT_STATUSES)[number];
  createdAt: string;
  page: { handle: string; title: string };
  opportunity: { id: string; title: string } | null;
}

export const RegisterSchema = z.object({
  name: z.string().trim().min(2).max(60),
  email: z.email().toLowerCase(),
  password: z.string().min(8, 'Use at least 8 characters').max(128),
});
export const LoginSchema = z.object({ email: z.email().toLowerCase(), password: z.string().min(1).max(128) });

export interface User {
  id: string;
  email: string;
  name: string;
  plan: 'free' | 'pro';
  isDemo: boolean;
  createdAt: string;
}

export const ApiKeyInputSchema = z.object({ name: z.string().trim().min(1).max(40) });
export interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
  lastUsedAt: string | null;
}

export const RANGES = ['24h', '7d', '30d', '90d'] as const;
export type Range = (typeof RANGES)[number];

export interface Breakdown {
  key: string;
  value: number;
}
export interface Analytics {
  range: Range;
  total: number;
  uniqueVisitors: number;
  previousTotal: number;
  series: { t: string; clicks: number; qr: number }[];
  countries: Breakdown[];
  cities: Breakdown[];
  devices: Breakdown[];
  browsers: Breakdown[];
  os: Breakdown[];
  referrers: Breakdown[];
  sources: Breakdown[];
  topLinks: { id: string; slug: string; title: string | null; clicks: number }[];
  recent: {
    slug: string;
    country: string | null;
    city: string | null;
    device: string;
    browser: string;
    at: string;
  }[];
}

export const BulkImportSchema = z.object({
  rows: z
    .array(
      z.object({
        url: httpUrl,
        slug: z.string().optional(),
        title: z.string().optional(),
        tags: z.string().optional(),
      }),
    )
    .min(1)
    .max(500),
});

export interface ApiError {
  error: { code: string; message: string; fields?: Record<string, string> };
}
