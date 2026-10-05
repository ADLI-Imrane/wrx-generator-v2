import type { Link, QrCode, BioPage, ApiKey, User, QrDesign, Opportunity } from '@wrx/shared';

export interface LinkRow {
  id: string;
  user_id: string;
  slug: string;
  url: string;
  title: string | null;
  tags: string;
  expires_at: string | null;
  max_clicks: number | null;
  password_hash: string | null;
  utm: string | null;
  rules: string;
  variants: string;
  archived: number;
  clicks: number;
  created_at: string;
  updated_at: string;
}
export interface UserRow {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  plan: 'free' | 'pro';
  is_demo: number;
  created_at: string;
}

const j = <T>(s: string | null, fallback: T): T => {
  try {
    return s ? (JSON.parse(s) as T) : fallback;
  } catch {
    return fallback;
  }
};

export const toLink = (r: LinkRow, origin: string): Link => ({
  id: r.id,
  slug: r.slug,
  url: r.url,
  title: r.title,
  tags: j(r.tags, []),
  expiresAt: r.expires_at,
  maxClicks: r.max_clicks,
  hasPassword: !!r.password_hash,
  utm: j(r.utm, null),
  rules: j(r.rules, []),
  variants: j(r.variants, []),
  archived: !!r.archived,
  clicks: r.clicks,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
  shortUrl: `${origin}/${r.slug}`,
});

export const toUser = (r: UserRow): User => ({
  id: r.id,
  email: r.email,
  name: r.name,
  plan: r.plan,
  isDemo: !!r.is_demo,
  createdAt: r.created_at,
});

export interface QrRow {
  id: string;
  name: string;
  link_id: string;
  design: string;
  created_at: string;
  slug: string;
  url: string;
  clicks_qr: number;
}
export const toQr = (r: QrRow, origin: string): QrCode => ({
  id: r.id,
  name: r.name,
  linkId: r.link_id,
  slug: r.slug,
  destination: r.url,
  encodedUrl: `${origin}/${r.slug}?r=qr`,
  design: j<QrDesign>(r.design, {} as QrDesign),
  scans: r.clicks_qr ?? 0,
  createdAt: r.created_at,
});

export interface BioRow {
  id: string;
  user_id: string;
  handle: string;
  kind: BioPage['kind'];
  title: string;
  headline: string;
  bio: string;
  avatar: string | null;
  theme: BioPage['theme'];
  location: string;
  industry: string;
  skills: string;
  open_to: string;
  discoverable: number;
  card: string;
  links: string;
  views: number;
  created_at: string;
}
export const toBio = (r: BioRow, origin: string): BioPage => ({
  id: r.id,
  handle: r.handle,
  kind: r.kind,
  title: r.title,
  headline: r.headline,
  bio: r.bio,
  avatar: r.avatar,
  theme: r.theme,
  location: r.location,
  industry: r.industry,
  skills: j(r.skills, []),
  openTo: j(r.open_to, []),
  discoverable: !!r.discoverable,
  card: j(r.card, {}),
  links: j(r.links, []),
  views: r.views,
  createdAt: r.created_at,
  publicUrl: `${origin}/b/${r.handle}`,
});

export interface OppRow {
  id: string;
  type: Opportunity['type'];
  title: string;
  location: string;
  remote: number;
  description: string;
  tags: string;
  status: Opportunity['status'];
  views: number;
  created_at: string;
  responses: number;
  page_id: string;
  handle: string;
  page_title: string;
  kind: BioPage['kind'];
  avatar: string | null;
  page_location: string;
}
export const OPP_SELECT = `SELECT o.*, p.handle, p.title AS page_title, p.kind, p.avatar, p.location AS page_location,
  (SELECT COUNT(*) FROM contact_requests r WHERE r.opportunity_id = o.id) AS responses
  FROM opportunities o JOIN bio_pages p ON p.id = o.page_id`;
export const toOpp = (r: OppRow, origin: string): Opportunity => ({
  id: r.id,
  type: r.type,
  title: r.title,
  location: r.location,
  remote: !!r.remote,
  description: r.description,
  tags: j(r.tags, []),
  status: r.status,
  views: r.views,
  responses: r.responses,
  createdAt: r.created_at,
  publicUrl: `${origin}/o/${r.id}`,
  publisher: {
    id: r.page_id,
    handle: r.handle,
    title: r.page_title,
    kind: r.kind,
    avatar: r.avatar,
    location: r.page_location,
  },
});

export interface KeyRow {
  id: string;
  name: string;
  prefix: string;
  created_at: string;
  last_used_at: string | null;
}
export const toKey = (r: KeyRow): ApiKey => ({
  id: r.id,
  name: r.name,
  prefix: r.prefix,
  createdAt: r.created_at,
  lastUsedAt: r.last_used_at,
});
