import { vi } from 'vitest';
import type { Link, QRCode, PaginatedResponse } from '@wrx/shared';

// Mock Links
export const mockLinks: Link[] = [
  {
    id: 'link-1',
    userId: 'test-user-id',
    slug: 'abc123',
    originalUrl: 'https://example.com/very-long-url',
    shortUrl: 'https://wrx.io/abc123',
    title: 'Example Link',
    description: 'A test link',
    clicks: 42,
    isActive: true,
    tags: ['test', 'example'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'link-2',
    userId: 'test-user-id',
    slug: 'xyz789',
    originalUrl: 'https://another-example.com',
    shortUrl: 'https://wrx.io/xyz789',
    title: 'Another Link',
    clicks: 15,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Mock QR Codes
export const mockQRCodes: QRCode[] = [
  {
    id: 'qr-1',
    userId: 'test-user-id',
    type: 'url',
    title: 'My QR Code',
    content: 'https://example.com',
    linkId: 'link-1',
    scans: 10,
    style: {
      foregroundColor: '#000000',
      backgroundColor: '#ffffff',
      style: 'squares',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'qr-2',
    userId: 'test-user-id',
    type: 'wifi',
    title: 'WiFi QR',
    content: 'WIFI:T:WPA;S:MyNetwork;P:password123;;',
    scans: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Mock paginated responses
export const mockLinksResponse: PaginatedResponse<Link> = {
  data: mockLinks,
  total: mockLinks.length,
  page: 1,
  limit: 10,
  totalPages: 1,
};

export const mockQRResponse: PaginatedResponse<QRCode> = {
  data: mockQRCodes,
  total: mockQRCodes.length,
  page: 1,
  limit: 10,
  totalPages: 1,
};

// Mock API client
export const mockApi = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
};

vi.mock('@/lib/api', () => ({
  api: mockApi,
}));
