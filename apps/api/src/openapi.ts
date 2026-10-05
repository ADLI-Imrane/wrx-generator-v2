import { z } from 'zod';
import { LinkInputSchema, LinkUpdateSchema, QrInputSchema, BioInputSchema, BulkImportSchema } from '@wrx/shared';

const schema = (s: z.ZodType) => z.toJSONSchema(s, { io: 'input', unrepresentable: 'any' });
const json = (ref: string) => ({ content: { 'application/json': { schema: { $ref: `#/components/schemas/${ref}` } } } });
const ok = (description: string) => ({ description });
const errors = { 401: ok('Missing or invalid credentials'), 422: ok('Validation failed — see `error.fields`') };
const idParam = [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }];

/** OpenAPI 3.1 document generated from the same Zod schemas the API validates with. */
export const openapi = {
  openapi: '3.1.0',
  info: {
    title: 'WRX API',
    version: '3.0.0',
    description:
      'Create short links and QR codes, and read their analytics. Authenticate with an API key from **Settings → API keys**: `Authorization: Bearer wrx_…`.',
  },
  servers: [{ url: '/api/v1' }],
  security: [{ bearer: [] }],
  components: {
    securitySchemes: { bearer: { type: 'http', scheme: 'bearer', bearerFormat: 'wrx_…' } },
    schemas: {
      LinkInput: schema(LinkInputSchema),
      LinkUpdate: schema(LinkUpdateSchema),
      QrInput: schema(QrInputSchema),
      BioInput: schema(BioInputSchema),
      BulkImport: schema(BulkImportSchema),
    },
  },
  tags: [{ name: 'Links' }, { name: 'QR codes' }, { name: 'Analytics' }, { name: 'Bio pages' }],
  paths: {
    '/links': {
      get: {
        tags: ['Links'], summary: 'List links',
        parameters: [
          { name: 'q', in: 'query', schema: { type: 'string' }, description: 'Search slug, title or destination' },
          { name: 'tag', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { enum: ['active', 'archived', 'all'] } },
          { name: 'sort', in: 'query', schema: { enum: ['recent', 'clicks', 'alpha'] } },
          { name: 'limit', in: 'query', schema: { type: 'integer', maximum: 200 } },
          { name: 'offset', in: 'query', schema: { type: 'integer' } },
        ],
        responses: { 200: ok('A page of links'), ...errors },
      },
      post: { tags: ['Links'], summary: 'Create a link', requestBody: json('LinkInput'), responses: { 201: ok('Created'), 409: ok('Slug already taken'), ...errors } },
    },
    '/links/bulk': { post: { tags: ['Links'], summary: 'Import up to 500 links', requestBody: json('BulkImport'), responses: { 201: ok('Import report'), ...errors } } },
    '/links/{id}': {
      parameters: idParam,
      get: { tags: ['Links'], summary: 'Get a link', responses: { 200: ok('The link'), 404: ok('Not found'), ...errors } },
      patch: { tags: ['Links'], summary: 'Update a link', requestBody: json('LinkUpdate'), responses: { 200: ok('Updated'), ...errors } },
      delete: { tags: ['Links'], summary: 'Delete a link and its analytics', responses: { 204: ok('Deleted'), ...errors } },
    },
    '/qr': {
      get: { tags: ['QR codes'], summary: 'List QR codes', responses: { 200: ok('QR codes'), ...errors } },
      post: { tags: ['QR codes'], summary: 'Create a dynamic QR code', requestBody: json('QrInput'), responses: { 201: ok('Created'), ...errors } },
    },
    '/qr/{id}': {
      parameters: idParam,
      get: { tags: ['QR codes'], summary: 'Get a QR code', responses: { 200: ok('QR code'), ...errors } },
      delete: { tags: ['QR codes'], summary: 'Delete a QR code', responses: { 204: ok('Deleted'), ...errors } },
    },
    '/analytics': {
      get: {
        tags: ['Analytics'], summary: 'Clicks, visitors and breakdowns',
        parameters: [
          { name: 'range', in: 'query', schema: { enum: ['24h', '7d', '30d', '90d'] } },
          { name: 'linkId', in: 'query', schema: { type: 'string' }, description: 'Limit to one link' },
        ],
        responses: { 200: ok('Analytics report'), ...errors },
      },
    },
    '/bio': {
      get: { tags: ['Bio pages'], summary: 'List bio pages', responses: { 200: ok('Pages'), ...errors } },
      post: { tags: ['Bio pages'], summary: 'Create a bio page', requestBody: json('BioInput'), responses: { 201: ok('Created'), 409: ok('Handle taken'), ...errors } },
    },
  },
};
