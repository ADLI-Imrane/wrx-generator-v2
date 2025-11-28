// Link types

export interface Link {
  id: string;
  userId: string;
  slug: string;
  originalUrl: string;
  shortUrl: string;
  title?: string;
  description?: string;
  passwordHash?: string;
  expiresAt?: string;
  clicks: number;
  isActive: boolean;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateLinkDto {
  originalUrl: string;
  slug?: string;
  title?: string;
  description?: string;
  password?: string;
  expiresAt?: string;
  tags?: string[];
}

export interface UpdateLinkDto {
  originalUrl?: string;
  slug?: string;
  title?: string;
  description?: string;
  password?: string;
  expiresAt?: string;
  isActive?: boolean;
  tags?: string[];
}

export interface Click {
  id: string;
  linkId: string;
  ipHash?: string;
  userAgent?: string;
  referrer?: string;
  country?: string;
  city?: string;
  device?: string;
  browser?: string;
  os?: string;
  clickedAt: string;
}

export interface LinkStats {
  totalClicks: number;
  uniqueClicks: number;
  clicksByDay: Array<{ date: string; count: number }>;
  clicksByCountry: Array<{ country: string; count: number }>;
  clicksByDevice: Array<{ device: string; count: number }>;
  clicksByBrowser: Array<{ browser: string; count: number }>;
  topReferrers: Array<{ referrer: string; count: number }>;
}
