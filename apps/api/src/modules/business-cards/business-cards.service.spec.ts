import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { BusinessCardDocument, BusinessCardRecord } from '@wrx/shared';
import { JwtAuthGuard } from '../../common/guards';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { BusinessCardsController } from './business-cards.controller';
import { BusinessCardsService } from './business-cards.service';
import { CreateBusinessCardRequestDto, UpdateBusinessCardRequestDto } from './dto';

const userId = '2c783f2e-3d72-41b9-83d6-a6adbe6e8501';
const otherUserId = '8c1b8af9-2c08-47c6-bf3c-85ad4aa1f214';
const cardId = 'c65f92ba-930f-46b7-a038-95a3b31f8699';
const qrId = 'c1aa99cc-6f9d-4130-8a61-f20d12aa47e1';

const documentFixture: BusinessCardDocument = {
  schemaVersion: 1,
  templateKey: 'classic',
  identity: {
    fullName: 'Ada Lovelace',
    jobTitle: 'Engineer',
    company: 'Analytical Engines',
    email: 'ada@example.com',
    phone: '+1 555 123 4567',
    website: 'https://example.com',
    address: null,
    socialLinks: { linkedin: 'https://linkedin.com/in/ada' },
    avatarPath: `${userId}/avatar`,
    companyLogoPath: null,
  },
  visibility: {
    fullName: true,
    jobTitle: true,
    company: true,
    email: true,
    phone: true,
    website: true,
    address: false,
    linkedin: true,
    github: false,
    instagram: false,
    x: false,
    avatar: true,
    companyLogo: false,
    qr: false,
  },
  brand: { primaryColor: '#235EE7', secondaryColor: '#14243A' },
  sides: {
    front: { composition: 'identity' },
    back: { enabled: true, composition: 'contact' },
  },
};

function row(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: cardId,
    user_id: userId,
    title: 'Ada — Business card',
    template_key: documentFixture.templateKey,
    schema_version: 1,
    document: documentFixture,
    created_at: '2026-10-05T10:00:00.000Z',
    updated_at: '2026-10-05T10:00:00.000Z',
    ...overrides,
  };
}

function database(
  resolve: (table: string, query: QueryRecord) => { data: unknown; error: unknown }
) {
  const queries: QueryRecord[] = [];
  const client = {
    from: jest.fn((table: string) => {
      const query: QueryRecord = {
        table,
        filters: [],
        select: jest.fn(() => query),
        eq: jest.fn((column: string, value: string) => {
          query.filters.push([column, value]);
          return query;
        }),
        order: jest.fn(() => query.result()),
        insert: jest.fn((payload: unknown) => {
          query.payload = payload;
          return query;
        }),
        update: jest.fn((payload: unknown) => {
          query.payload = payload;
          return query;
        }),
        delete: jest.fn(() => query),
        single: jest.fn(() => query.result()),
        maybeSingle: jest.fn(() => query.result()),
        result: () => Promise.resolve(resolve(table, query)),
      };
      queries.push(query);
      return query;
    }),
  };
  const service = new BusinessCardsService({
    getAdminClient: () => client,
  } as unknown as SupabaseService);
  return { service, client, queries };
}

interface QueryRecord {
  table: string;
  filters: Array<[string, string]>;
  payload?: unknown;
  select: jest.Mock;
  eq: jest.Mock;
  order: jest.Mock;
  insert: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  single: jest.Mock;
  maybeSingle: jest.Mock;
  result: () => Promise<{ data: unknown; error: unknown }>;
}

describe('BusinessCardsService', () => {
  it('lists only rows scoped to the authenticated owner', async () => {
    const db = database((table) => ({
      data: table === 'business_cards' ? [row()] : null,
      error: null,
    }));

    const result = await db.service.list(userId);

    expect(result).toHaveLength(1);
    expect(db.queries[0]!.filters).toContainEqual(['user_id', userId]);
    expect(db.queries[0]!.order).toHaveBeenCalledWith('updated_at', { ascending: false });
  });

  it('returns not found rather than exposing another user’s card', async () => {
    const db = database(() => ({ data: null, error: { code: 'PGRST116' } }));

    await expect(db.service.findOne(userId, cardId)).rejects.toBeInstanceOf(NotFoundException);
    expect(db.queries[0]!.filters).toEqual([
      ['id', cardId],
      ['user_id', userId],
    ]);
  });

  it('creates an independent identity snapshot and persists normalized metadata', async () => {
    const db = database((_table, query) => ({
      data: row(query.payload as Partial<Record<string, unknown>>),
      error: null,
    }));
    const document = structuredClone(documentFixture);
    document.identity.website = ' example.com ';
    document.identity.address = '   ';
    document.brand.primaryColor = '#235ee7';

    const result = await db.service.create(userId, { title: '  Ada Card  ', document });

    expect(result).toMatchObject<Partial<BusinessCardRecord>>({
      userId,
      title: 'Ada Card',
      templateKey: 'classic',
      schemaVersion: 1,
    });
    const payload = db.queries[0]!.payload as {
      document: BusinessCardDocument;
      user_id: string;
      title: string;
      template_key: string;
      schema_version: number;
    };
    expect(payload).toMatchObject({
      user_id: userId,
      title: 'Ada Card',
      template_key: 'classic',
      schema_version: 1,
    });
    expect(payload['document']['identity']['website']).toBe('https://example.com');
    expect(payload['document']['identity']['address']).toBeNull();
    expect(payload['document']['brand']['primaryColor']).toBe('#235EE7');
    expect(payload['document']).not.toHaveProperty('profileId');
    expect(payload['document']['identity']['avatarPath']).toBe(`${userId}/avatar`);
  });

  it('updates and deletes only the current user’s row', async () => {
    const updateDb = database(() => ({ data: row({ title: 'Updated card' }), error: null }));
    const updated = await updateDb.service.update(userId, cardId, { title: ' Updated card ' });
    expect(updated.title).toBe('Updated card');
    expect(updateDb.queries[0]!.filters).toEqual([
      ['id', cardId],
      ['user_id', userId],
    ]);

    const deleteDb = database(() => ({ data: { id: cardId }, error: null }));
    await expect(deleteDb.service.remove(userId, cardId)).resolves.toEqual({
      id: cardId,
      deleted: true,
    });
    expect(deleteDb.queries[0]!.filters).toEqual([
      ['id', cardId],
      ['user_id', userId],
    ]);
  });

  it('does not report another owner’s update or delete as successful', async () => {
    const db = database(() => ({ data: null, error: null }));
    await expect(db.service.update(userId, cardId, { title: 'No access' })).rejects.toBeInstanceOf(
      NotFoundException
    );
    await expect(db.service.remove(userId, cardId)).rejects.toBeInstanceOf(NotFoundException);
    expect(
      db.queries.every((query) =>
        query.filters.some(([column, value]) => column === 'user_id' && value === userId)
      )
    ).toBe(true);
  });

  it('rejects unsafe assets and malformed documents before database writes', async () => {
    const db = database(() => ({ data: row(), error: null }));
    const badAsset = {
      ...documentFixture,
      identity: {
        ...documentFixture.identity,
        avatarPath: 'https://storage.example/signed?token=secret',
      },
    };

    await expect(
      db.service.create(userId, { title: 'Card', document: badAsset as BusinessCardDocument })
    ).rejects.toBeInstanceOf(BadRequestException);
    const badTemplate = {
      ...documentFixture,
      templateKey: 'freeform',
    } as unknown as BusinessCardDocument;
    await expect(
      db.service.create(userId, { title: 'Card', document: badTemplate })
    ).rejects.toBeInstanceOf(BadRequestException);
    const foreignAsset = structuredClone(documentFixture);
    foreignAsset.identity.avatarPath = `${otherUserId}/avatar`;
    await expect(
      db.service.create(userId, { title: 'Card', document: foreignAsset })
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(db.client.from).not.toHaveBeenCalled();
  });

  it('rejects invalid URLs, phone values, colors, versions, and QR payloads', async () => {
    const db = database(() => ({ data: row(), error: null }));
    const invalidWebsite = structuredClone(documentFixture);
    invalidWebsite.identity.website = 'javascript:alert(1)';
    const invalidSocial = structuredClone(documentFixture);
    invalidSocial.identity.socialLinks.github = 'ftp://github.com/ada';
    const invalidPhone = structuredClone(documentFixture);
    invalidPhone.identity.phone = 'call me';
    const invalidColor = structuredClone(documentFixture);
    invalidColor.brand.primaryColor = 'blue';
    const invalidVersion = {
      ...documentFixture,
      schemaVersion: 2,
    } as unknown as BusinessCardDocument;
    const invalidQr = structuredClone(documentFixture);
    invalidQr.sides.back.composition = 'qr';
    invalidQr.qr = { mode: 'static', type: 'email', content: 'not-an-email' };

    for (const document of [
      invalidWebsite,
      invalidSocial,
      invalidPhone,
      invalidColor,
      invalidVersion,
      invalidQr,
    ]) {
      await expect(db.service.create(userId, { title: 'Card', document })).rejects.toBeInstanceOf(
        BadRequestException
      );
    }
    expect(db.client.from).not.toHaveBeenCalled();
  });

  it('rejects managed QR references not owned by the current user without creating a QR', async () => {
    const document = structuredClone(documentFixture);
    document.sides.back.composition = 'qr';
    document.visibility.qr = true;
    document.qr = { mode: 'managed', qrCodeId: qrId };
    const db = database((table) => ({ data: table === 'qr_codes' ? null : row(), error: null }));

    await expect(db.service.create(userId, { title: 'Card', document })).rejects.toBeInstanceOf(
      BadRequestException
    );
    expect(db.queries.map((query) => query.table)).toEqual(['qr_codes']);
    expect(db.queries[0]!.filters).toEqual([
      ['id', qrId],
      ['user_id', userId],
    ]);
  });

  it('treats invalid stored documents as server-side data errors', async () => {
    const db = database(() => ({ data: [row({ document: { html: '<script>' } })], error: null }));
    await expect(db.service.list(userId)).rejects.toBeInstanceOf(InternalServerErrorException);
  });
});

describe('business card request validation and access boundary', () => {
  it('rejects unknown owner fields and malformed document payloads', async () => {
    const valid = {
      title: 'Ada card',
      document: documentFixture,
      user_id: otherUserId,
    };
    const dto = plainToInstance(CreateBusinessCardRequestDto, valid);
    const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });
    expect(errors.some((error) => error.property === 'user_id')).toBe(true);

    const malformed = plainToInstance(CreateBusinessCardRequestDto, {
      title: 'Ada card',
      document: { ...documentFixture, css: 'position:fixed' },
    });
    expect(await validate(malformed)).not.toHaveLength(0);

    const invalidTitle = plainToInstance(CreateBusinessCardRequestDto, {
      title: '   ',
      document: documentFixture,
    });
    expect(await validate(invalidTitle)).not.toHaveLength(0);
  });

  it('rejects update bodies with no editable fields', async () => {
    const dto = plainToInstance(UpdateBusinessCardRequestDto, {});
    expect(await validate(dto)).toHaveLength(0);
    const db = database(() => ({ data: row(), error: null }));
    await expect(db.service.update(userId, cardId, dto)).rejects.toBeInstanceOf(
      BadRequestException
    );
    expect(db.client.from).not.toHaveBeenCalled();
  });

  it('guards all business-card routes with the authenticated-user guard', () => {
    const guards = Reflect.getMetadata('__guards__', BusinessCardsController) as unknown[];
    expect(guards).toContain(JwtAuthGuard);
  });

  it('keeps database access private and owner-scoped in the migration', () => {
    const migration = readFileSync(
      resolve(
        __dirname,
        '../../../../../supabase/migrations/20261005045901_add_business_cards.sql'
      ),
      'utf8'
    );
    expect(migration).toMatch(/ALTER TABLE public\.business_cards ENABLE ROW LEVEL SECURITY/i);
    expect(migration).toMatch(
      /REVOKE ALL ON TABLE public\.business_cards FROM PUBLIC, anon, authenticated/i
    );
    expect(migration).toMatch(
      /GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public\.business_cards TO service_role/i
    );
    expect(migration).toMatch(/\(SELECT auth\.uid\(\)\) = user_id/i);
    expect(migration).not.toMatch(/GRANT[^;]*\b(?:anon|authenticated)\b/i);
    expect(migration).not.toMatch(/\bDROP\s+(?:TABLE|COLUMN)\b/i);
  });
});
