import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { User } from '@supabase/supabase-js';
import {
  type DigitalCardDocumentV1,
  type DigitalCardRecord,
} from '@wrx/shared';
import { JwtAuthGuard } from '../../common/guards';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { DigitalCardSlugGenerator } from './digital-card-slug';
import { DigitalCardsController } from './digital-cards.controller';
import { DigitalCardsService } from './digital-cards.service';
import { PublicDigitalCardsController } from './public-digital-cards.controller';
import { CreateDigitalCardRequestDto, UpdateDigitalCardRequestDto } from './dto';

const userId = '2c783f2e-3d72-41b9-83d6-a6adbe6e8501';
const otherUserId = '8c1b8af9-2c08-47c6-bf3c-85ad4aa1f214';
const cardId = 'c65f92ba-930f-46b7-a038-95a3b31f8699';
const slugA = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const slugB = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
const publishedAt = '2026-10-07T10:00:00.000Z';

function document(overrides: Partial<DigitalCardDocumentV1> = {}): DigitalCardDocumentV1 {
  return {
    schemaVersion: 1,
    identity: {
      fullName: 'Ada Lovelace',
      jobTitle: 'Engineer',
      company: 'Analytical Engines',
      avatarPath: `${userId}/avatar`,
      companyLogoPath: `${userId}/company-logo`,
      ...overrides.identity,
    },
    contact: {
      email: 'ada@example.com',
      phone: '+1 555 123 4567',
      website: 'https://example.com',
      address: 'London',
      ...overrides.contact,
    },
    socialLinks: { linkedin: 'https://linkedin.com/in/ada', ...overrides.socialLinks },
    visibility: {
      fullName: true,
      jobTitle: true,
      company: true,
      avatar: true,
      companyLogo: false,
      email: true,
      phone: true,
      website: true,
      address: false,
      linkedin: true,
      github: false,
      instagram: false,
      x: false,
      ...overrides.visibility,
    },
    brand: { primaryColor: '#235EE7', secondaryColor: '#14243A', ...overrides.brand },
    presentation: { style: 'light', ...overrides.presentation },
  };
}

interface DigitalCardRow {
  id: string;
  user_id: string;
  title: string;
  slug: string;
  status: 'draft' | 'published';
  schema_version: number;
  document: unknown;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

function row(overrides: Partial<DigitalCardRow> = {}): DigitalCardRow {
  const status = overrides.status ?? 'draft';
  return {
    id: cardId,
    user_id: userId,
    title: 'Ada — Digital Card',
    slug: slugA,
    status,
    schema_version: 1,
    document: document(),
    created_at: '2026-10-07T09:00:00.000Z',
    updated_at: '2026-10-07T09:30:00.000Z',
    published_at: status === 'published' ? publishedAt : null,
    ...overrides,
  };
}

interface QueryRecord {
  table: string;
  action: 'select' | 'insert' | 'update' | 'delete';
  filters: Array<[string, unknown]>;
  payload?: Record<string, unknown>;
  mode: 'many' | 'single' | 'maybeSingle';
  select: jest.Mock;
  eq: jest.Mock;
  order: jest.Mock;
  insert: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  single: jest.Mock;
  maybeSingle: jest.Mock;
  result: () => Promise<{ data: unknown; error: unknown }>;
  then: (onFulfilled: (value: unknown) => unknown, onRejected?: (reason: unknown) => unknown) => Promise<unknown>;
}

function database(initialRows: DigitalCardRow[] = []) {
  const rows = structuredClone(initialRows);
  const queries: QueryRecord[] = [];
  const signedAssets: Array<{ bucket: string; path: string; expiresIn: number }> = [];
  let clock = 0;

  const client = {
    from: jest.fn((table: string) => {
      const query = {
        table,
        action: 'select' as QueryRecord['action'],
        filters: [] as Array<[string, unknown]>,
        mode: 'many' as QueryRecord['mode'],
        select: jest.fn(() => query),
        eq: jest.fn((column: string, value: unknown) => {
          query.filters.push([column, value]);
          return query;
        }),
        order: jest.fn(() => query),
        insert: jest.fn((payload: Record<string, unknown>) => {
          query.action = 'insert';
          query.payload = payload;
          return query;
        }),
        update: jest.fn((payload: Record<string, unknown>) => {
          query.action = 'update';
          query.payload = payload;
          return query;
        }),
        delete: jest.fn(() => {
          query.action = 'delete';
          return query;
        }),
        single: jest.fn(() => {
          query.mode = 'single';
          return query.result();
        }),
        maybeSingle: jest.fn(() => {
          query.mode = 'maybeSingle';
          return query.result();
        }),
        result: async () => {
          const matches = () => rows.filter((item) =>
            query.filters.every(([column, value]) => (item as unknown as Record<string, unknown>)[column] === value)
          );

          if (query.action === 'insert') {
            const payload = query.payload ?? {};
            if (rows.some((item) => item.slug === payload['slug'])) {
              return {
                data: null,
                error: {
                  code: '23505',
                  constraint: 'digital_cards_slug_unique',
                  message: 'duplicate key violates digital_cards_slug_unique',
                },
              };
            }
            const inserted = row({
              id: '7f42a0c8-3c85-4b45-bc80-8f0f51c3ef21',
              user_id: payload['user_id'] as string,
              title: payload['title'] as string,
              slug: payload['slug'] as string,
              status: 'draft',
              document: payload['document'],
              schema_version: payload['schema_version'] as number,
            });
            rows.push(inserted);
            return { data: inserted, error: null };
          }

          const found = matches()[0];
          if (query.action === 'update') {
            if (!found) return { data: null, error: null };
            Object.assign(found, query.payload, {
              updated_at: `2026-10-07T10:${String(clock++).padStart(2, '0')}:00.000Z`,
            });
            return { data: found, error: null };
          }

          if (query.action === 'delete') {
            if (!found) return { data: null, error: null };
            rows.splice(rows.indexOf(found), 1);
            return { data: { id: found.id }, error: null };
          }

          if (query.mode === 'many') return { data: matches(), error: null };
          return { data: found ?? null, error: null };
        },
        then: (onFulfilled: (value: unknown) => unknown, onRejected?: (reason: unknown) => unknown) =>
          query.result().then(onFulfilled, onRejected),
      } as QueryRecord;
      queries.push(query);
      return query;
    }),
    storage: {
      from: jest.fn((bucket: string) => ({
        createSignedUrl: jest.fn(async (path: string, expiresIn: number) => {
          signedAssets.push({ bucket, path, expiresIn });
          return { data: { signedUrl: `https://storage.example/sign/${path}?token=ephemeral` }, error: null };
        }),
      })),
    },
  };

  const supabaseService = { getAdminClient: () => client } as unknown as SupabaseService;
  const slugGenerator = { generate: jest.fn(() => slugB) } as unknown as DigitalCardSlugGenerator;
  const service = new DigitalCardsService(supabaseService, slugGenerator);
  return { service, client, queries, rows, signedAssets, slugGenerator };
}

describe('DigitalCardsService owner boundary', () => {
  it('lists and reads only the authenticated owner records', async () => {
    const own = row();
    const foreign = row({ id: '4af4efab-f13f-4aed-8a97-0a10b491ccf5', user_id: otherUserId, slug: slugB });
    const db = database([own, foreign]);

    const cards = await db.service.list(userId);
    expect(cards).toHaveLength(1);
    expect(db.queries[0]!.filters).toContainEqual(['user_id', userId]);

    await expect(db.service.findOne(userId, own.id)).resolves.toMatchObject({ userId });
    await expect(db.service.findOne(userId, foreign.id)).rejects.toBeInstanceOf(NotFoundException);
    expect(db.queries[1]!.filters).toEqual([['id', own.id], ['user_id', userId]]);
  });

  it('creates multiple independent draft snapshots and retries a slug collision', async () => {
    const existing = row({ slug: slugA });
    const db = database([existing]);
    (db.slugGenerator.generate as jest.Mock)
      .mockReturnValueOnce(slugA)
      .mockReturnValueOnce(slugB);

    const created = await db.service.create(userId, { title: '  New card  ', document: document() });

    expect(created).toMatchObject<Partial<DigitalCardRecord>>({
      title: 'New card',
      slug: slugB,
      status: 'draft',
      userId,
      publishedAt: null,
    });
    expect(db.slugGenerator.generate).toHaveBeenCalledTimes(2);
    expect(db.rows).toHaveLength(2);
    expect(db.queries.at(-1)!.payload).toHaveProperty('slug', slugB);
    expect(db.queries.at(-1)!.payload).not.toHaveProperty('profileId');
  });

  it('stops after the bounded slug collision retry count', async () => {
    const db = database([row({ slug: slugA })]);
    (db.slugGenerator.generate as jest.Mock).mockReturnValue(slugA);

    await expect(db.service.create(userId, { title: 'Another', document: document() })).rejects.toBeInstanceOf(
      ConflictException
    );
    expect(db.slugGenerator.generate).toHaveBeenCalledTimes(5);
    expect(db.rows).toHaveLength(1);
  });

  it('updates only permitted fields and keeps the generated slug immutable', async () => {
    const db = database([row()]);
    const result = await db.service.update(userId, cardId, {
      title: 'Updated title',
      slug: slugB,
    } as unknown as { title: string });

    expect(result.title).toBe('Updated title');
    expect(result.slug).toBe(slugA);
    expect(db.queries.at(-1)!.filters).toEqual([
      ['id', cardId],
      ['user_id', userId],
      ['status', 'draft'],
      ['updated_at', '2026-10-07T09:30:00.000Z'],
    ]);
    expect(db.queries.at(-1)!.payload).not.toHaveProperty('slug');
  });

  it('cannot read, update, or delete another owner record', async () => {
    const foreign = row({ id: '4af4efab-f13f-4aed-8a97-0a10b491ccf5', user_id: otherUserId, slug: slugB });
    const db = database([foreign]);

    await expect(db.service.findOne(userId, foreign.id)).rejects.toBeInstanceOf(NotFoundException);
    await expect(db.service.update(userId, foreign.id, { title: 'No access' })).rejects.toBeInstanceOf(NotFoundException);
    await expect(db.service.remove(userId, foreign.id)).rejects.toBeInstanceOf(NotFoundException);
    expect(db.rows).toHaveLength(1);
    expect(db.rows[0]!.user_id).toBe(otherUserId);
    expect(db.queries.every((query) => query.filters.some(([key, value]) => key === 'user_id' && value === userId))).toBe(true);
  });

  it('rejects a foreign asset path before any insert', async () => {
    const db = database();
    const foreignDocument = document({
      identity: { ...document().identity, avatarPath: `${otherUserId}/avatar` },
    });

    await expect(db.service.create(userId, { title: 'Card', document: foreignDocument })).rejects.toBeInstanceOf(
      BadRequestException
    );
    expect(db.client.from).not.toHaveBeenCalled();
  });

  it('requires publishable content and validates changes to a published card', async () => {
    const incomplete = document({
      identity: { ...document().identity, fullName: '' },
      contact: { email: null, phone: null, website: null, address: null },
      socialLinks: {},
    });
    const db = database([row({ document: incomplete })]);

    await expect(db.service.publish(userId, cardId)).rejects.toBeInstanceOf(BadRequestException);
    expect(db.queries.some((query) => query.action === 'update')).toBe(false);

    const publishedDb = database([row({ status: 'published' })]);
    const hiddenContact = document({
      contact: { email: null, phone: null, website: null, address: null },
      socialLinks: {},
      visibility: { ...document().visibility, email: false, phone: false, website: false, linkedin: false },
    });
    await expect(publishedDb.service.update(userId, cardId, { document: hiddenContact })).rejects.toBeInstanceOf(
      BadRequestException
    );
    expect(publishedDb.queries.some((query) => query.action === 'update')).toBe(false);
  });

  it('publishes, resolves, then immediately unpublishes from the public API', async () => {
    const db = database([row()]);
    const published = await db.service.publish(userId, cardId);
    expect(published.status).toBe('published');
    expect(published.publishedAt).toBeTruthy();
    await expect(db.service.findPublished(slugA)).resolves.toMatchObject({ slug: slugA });

    const draft = await db.service.unpublish(userId, cardId);
    expect(draft.status).toBe('draft');
    expect(draft.publishedAt).toBeNull();
    await expect(db.service.findPublished(slugA)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns equivalent not-found behavior for unknown and unpublished slugs', async () => {
    const db = database([row()]);
    await expect(db.service.findPublished(slugA)).rejects.toBeInstanceOf(NotFoundException);
    await expect(db.service.findPublished(slugB)).rejects.toBeInstanceOf(NotFoundException);
    expect(db.queries[0]!.filters).toEqual([['slug', slugA], ['status', 'published']]);
  });

  it('projects only explicitly visible fields and signs only selected owner assets briefly', async () => {
    const publishedDocument = document({
      identity: { ...document().identity, companyLogoPath: `${userId}/company-logo` },
      visibility: {
        ...document().visibility,
        companyLogo: false,
        email: false,
        address: false,
        linkedin: false,
        github: true,
      },
      socialLinks: { github: 'https://github.com/ada' },
    });
    const db = database([row({ status: 'published', document: publishedDocument })]);

    const result = await db.service.findPublished(slugA);

    expect(result).toEqual({
      slug: slugA,
      identity: {
        fullName: 'Ada Lovelace',
        jobTitle: 'Engineer',
        company: 'Analytical Engines',
        avatarUrl: 'https://storage.example/sign/2c783f2e-3d72-41b9-83d6-a6adbe6e8501/avatar?token=ephemeral',
      },
      contact: { phone: '+1 555 123 4567', website: 'https://example.com' },
      socialLinks: { github: 'https://github.com/ada' },
      brand: { primaryColor: '#235EE7', secondaryColor: '#14243A' },
      presentation: { style: 'light' },
    });
    expect(result).not.toHaveProperty('userId');
    expect(result).not.toHaveProperty('id');
    expect(result).not.toHaveProperty('title');
    expect(result.identity).not.toHaveProperty('avatarPath');
    expect(result.identity).not.toHaveProperty('companyLogoUrl');
    expect(result.contact).not.toHaveProperty('email');
    expect(result.contact).not.toHaveProperty('address');
    expect(db.signedAssets).toEqual([
      { bucket: 'avatars', path: `${userId}/avatar`, expiresIn: 300 },
    ]);
    expect(db.rows[0]!.document).toMatchObject({ identity: { avatarPath: `${userId}/avatar` } });
    expect(JSON.stringify(db.rows[0]!.document)).not.toContain('ephemeral');
  });

  it('does not sign hidden assets and rejects corrupted foreign asset paths before signing', async () => {
    const hidden = document({ visibility: { ...document().visibility, avatar: false } });
    const hiddenDb = database([row({ status: 'published', document: hidden })]);
    const hiddenProjection = await hiddenDb.service.findPublished(slugA);
    expect(hiddenProjection.identity).not.toHaveProperty('avatarUrl');
    expect(hiddenDb.signedAssets).toHaveLength(0);

    const corrupted = document({
      identity: { ...document().identity, avatarPath: `${otherUserId}/avatar` },
    });
    const corruptDb = database([row({ status: 'published', document: corrupted })]);
    await expect(corruptDb.service.findPublished(slugA)).rejects.toThrow('Stored Digital Card document is invalid');
    expect(corruptDb.signedAssets).toHaveLength(0);
  });

  it('deletes only an owned card', async () => {
    const db = database([row()]);
    await expect(db.service.remove(userId, cardId)).resolves.toEqual({ id: cardId, deleted: true });
    expect(db.rows).toHaveLength(0);
    expect(db.queries[0]!.filters).toEqual([['id', cardId], ['user_id', userId]]);
  });
});

describe('Digital Card API validation and security metadata', () => {
  it('routes owner operations with the authenticated user id, never a request-supplied owner id', async () => {
    const service = {
      list: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      publish: jest.fn(),
      unpublish: jest.fn(),
    } as unknown as DigitalCardsService;
    const controller = new DigitalCardsController(service);
    const user = { id: userId } as User;
    const createDto = { title: 'Ada', document: document() };
    const updateDto = { title: 'Updated' };

    await controller.list(user);
    await controller.findOne(user, cardId);
    await controller.create(user, createDto);
    await controller.update(user, cardId, updateDto);
    await controller.remove(user, cardId);
    await controller.publish(user, cardId);
    await controller.unpublish(user, cardId);

    expect(service.list).toHaveBeenCalledWith(userId);
    expect(service.findOne).toHaveBeenCalledWith(userId, cardId);
    expect(service.create).toHaveBeenCalledWith(userId, createDto);
    expect(service.update).toHaveBeenCalledWith(userId, cardId, updateDto);
    expect(service.remove).toHaveBeenCalledWith(userId, cardId);
    expect(service.publish).toHaveBeenCalledWith(userId, cardId);
    expect(service.unpublish).toHaveBeenCalledWith(userId, cardId);
  });

  it('uses the anonymous public resolver only for valid generated slugs', async () => {
    const service = { findPublished: jest.fn() } as unknown as DigitalCardsService;
    const controller = new PublicDigitalCardsController(service);
    await controller.findPublished(slugA);
    expect(service.findPublished).toHaveBeenCalledWith(slugA);
    expect(() => controller.findPublished('not-a-slug')).toThrow(NotFoundException);
    expect(service.findPublished).toHaveBeenCalledTimes(1);
  });

  it('rejects slug, status, and user ownership fields from request DTOs', async () => {
    const create = plainToInstance(CreateDigitalCardRequestDto, {
      title: 'Ada',
      document: document(),
      slug: slugA,
      status: 'published',
      user_id: otherUserId,
    });
    const createErrors = await validate(create, { whitelist: true, forbidNonWhitelisted: true });
    expect(createErrors.map((error) => error.property)).toEqual(expect.arrayContaining(['slug', 'status', 'user_id']));

    const update = plainToInstance(UpdateDigitalCardRequestDto, { slug: slugB, status: 'published' });
    const updateErrors = await validate(update, { whitelist: true, forbidNonWhitelisted: true });
    expect(updateErrors.map((error) => error.property)).toEqual(expect.arrayContaining(['slug', 'status']));
  });

  it('requires a document at create time but permits an empty partial update DTO for service rejection', async () => {
    const missing = plainToInstance(CreateDigitalCardRequestDto, { title: 'Ada' });
    expect(await validate(missing)).not.toHaveLength(0);
    const emptyUpdate = plainToInstance(UpdateDigitalCardRequestDto, {});
    expect(await validate(emptyUpdate)).toHaveLength(0);
    await expect(database([row()]).service.update(userId, cardId, {})).rejects.toBeInstanceOf(BadRequestException);
  });

  it('guards owner CRUD while keeping the public resolver anonymous and throttled', () => {
    const ownerGuards = Reflect.getMetadata('__guards__', DigitalCardsController) as unknown[];
    const publicGuards = Reflect.getMetadata('__guards__', PublicDigitalCardsController) as unknown[];
    expect(ownerGuards).toContain(JwtAuthGuard);
    expect(publicGuards).toContain(ThrottlerGuard);
    expect(publicGuards).not.toContain(JwtAuthGuard);
  });

  it('keeps client table grants revoked and defines owner RLS without public table access', () => {
    const migration = readFileSync(
      resolve(__dirname, '../../../../../supabase/migrations/20261007055552_digital_cards.sql'),
      'utf8'
    );
    expect(migration).toMatch(/ALTER TABLE public\.digital_cards ENABLE ROW LEVEL SECURITY/i);
    expect(migration).toMatch(/REVOKE ALL ON TABLE public\.digital_cards FROM PUBLIC, anon, authenticated/i);
    expect(migration).toMatch(/GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public\.digital_cards TO service_role/i);
    expect(migration).toMatch(/\(SELECT auth\.uid\(\)\) = user_id/i);
    expect(migration).toMatch(/CREATE UNIQUE \(slug\)|CONSTRAINT digital_cards_slug_unique UNIQUE \(slug\)/i);
    const grantStatements = migration
      .replace(/--[^\r\n]*/g, '')
      .match(/\bGRANT\b[^;]*;/gi) ?? [];
    expect(grantStatements).toEqual([
      'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.digital_cards TO service_role;',
    ]);
    expect(migration).not.toMatch(/REFERENCES public\.business_cards/i);
    expect(migration).not.toMatch(/\bDROP\s+(?:TABLE|COLUMN)\b/i);
  });
});
