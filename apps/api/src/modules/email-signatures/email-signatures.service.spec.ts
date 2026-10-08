import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import type { User } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { EmailSignatureAssetsController } from './email-signature-assets.controller';
import { EmailSignaturesController } from './email-signatures.controller';
import { EmailSignaturesModule } from './email-signatures.module';
import { EmailSignaturesService, EMAIL_SIGNATURE_ASSET_BUCKET } from './email-signatures.service';
import { CreateEmailSignatureRequestDto, UpdateEmailSignatureRequestDto } from './dto';
import { JwtAuthGuard } from '../../common/guards';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { parseEmailSignatureDocument } from '@wrx/shared';

const ownerId = '2c783f2e-3d72-41b9-83d6-a6adbe6e8501';
const otherId = '8c1b8af9-2c08-47c6-bf3c-85ad4aa1f214';
const signatureId = 'c65f92ba-930f-46b7-a038-95a3b31f8699';
const assetId = '4b2e3a9e-18ac-4d77-b925-11b9d3497f6a';
const objectPath = `v1/${'a'.repeat(64)}.png`;

function doc(overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: 1,
    identity: { fullName: 'Ada Lovelace', jobTitle: 'Engineer', company: 'Engines' },
    contact: { email: 'ada@example.com', phone: '+1 555 123 4567', website: 'https://example.com', address: null },
    socialLinks: {},
    visibility: {
      fullName: true, jobTitle: true, company: true, email: true, phone: true, website: true,
      address: false, linkedin: false, github: false, instagram: false, x: false, avatar: true, companyLogo: false,
    },
    templateId: 'signal',
    brand: { accentColor: '#235EE7' },
    images: { avatar: { assetId, altText: 'Ada' }, companyLogo: null },
    ...overrides,
  };
}

function signatureRow(overrides: Record<string, unknown> = {}) {
  return {
    id: signatureId,
    user_id: ownerId,
    title: 'Work signature',
    schema_version: 1,
    document: doc(),
    created_at: '2026-10-08T10:00:00.000Z',
    updated_at: '2026-10-08T10:00:00.000Z',
    ...overrides,
  };
}

function assetRow(overrides: Record<string, unknown> = {}) {
  return {
    id: assetId,
    user_id: ownerId,
    object_path: objectPath,
    kind: 'avatar',
    content_type: 'image/png',
    byte_size: 16,
    created_at: '2026-10-08T10:00:00.000Z',
    ...overrides,
  };
}

function makeQuery(result: { data: unknown; error: unknown }) {
  const filters: Array<[string, unknown]> = [];
  const query: Record<string, jest.Mock | unknown> = {};
  for (const method of ['select', 'order', 'insert', 'update', 'delete']) {
    query[method] = jest.fn(() => query);
  }
  query['eq'] = jest.fn((column: string, value: unknown) => { filters.push([column, value]); return query; });
  query['in'] = jest.fn((column: string, value: unknown) => { filters.push([column, value]); return query; });
  query['single'] = jest.fn(async () => result);
  query['maybeSingle'] = jest.fn(async () => result);
  query['filters'] = filters;
  query['then'] = (resolvePromise: (value: unknown) => unknown, rejectPromise?: (reason: unknown) => unknown) =>
    Promise.resolve(result).then(resolvePromise, rejectPromise);
  return query as typeof query & { filters: Array<[string, unknown]> };
}

function harness(results: Record<string, Array<{ data: unknown; error: unknown }>> = {}) {
  const queries: Array<{ table: string; query: ReturnType<typeof makeQuery> }> = [];
  const uploads: Array<{ bucket: string; path: string; options: unknown }> = [];
  const removals: Array<{ bucket: string; paths: string[] }> = [];
  const downloads: Array<{ bucket: string; path: string }> = [];
  const queues = new Map(Object.entries(results));
  const storage = {
    from: jest.fn((bucket: string) => ({
      upload: jest.fn(async (path: string, _buffer: Buffer, options: unknown) => {
        uploads.push({ bucket, path, options });
        return { data: { path }, error: null };
      }),
      remove: jest.fn(async (paths: string[]) => {
        removals.push({ bucket, paths });
        return { data: paths.map((name) => ({ name })), error: null };
      }),
      download: jest.fn(async (path: string) => {
        downloads.push({ bucket, path });
        return { data: new Blob([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/K/8AAAAASUVORK5CYII=', 'base64')], { type: 'image/png' }), error: null };
      }),
      getPublicUrl: jest.fn((path: string) => ({ data: { publicUrl: `https://project.supabase.co/storage/v1/object/public/${bucket}/${path}` } })),
    })),
  };
  const admin = {
    from: jest.fn((table: string) => {
      const queue = queues.get(table) ?? [];
      const result = queue.shift() ?? { data: null, error: null };
      queues.set(table, queue);
      const query = makeQuery(result);
      queries.push({ table, query });
      return query;
    }),
    storage,
  };
  const service = new EmailSignaturesService({ getAdminClient: () => admin } as unknown as SupabaseService);
  return { service, admin, storage, queries, uploads, removals, downloads };
}

describe('EmailSignaturesService owner boundaries', () => {
  it('scopes list and get to the JWT-derived owner', async () => {
    const h = harness({
      email_signatures: [
        { data: [signatureRow()], error: null },
        { data: signatureRow(), error: null },
        { data: null, error: null },
      ],
    });
    await expect(h.service.list(ownerId)).resolves.toHaveLength(1);
    expect(h.queries[0]!.query.filters).toContainEqual(['user_id', ownerId]);
    await expect(h.service.findOne(ownerId, signatureId)).resolves.toMatchObject({ userId: ownerId });
    expect(h.queries[1]!.query.filters).toEqual([['id', signatureId], ['user_id', ownerId]]);
    await expect(h.service.findOne(ownerId, signatureId)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('creates and updates independent snapshots after verifying every referenced asset owner and role', async () => {
    const h = harness({
      email_signature_assets: [{ data: [{ id: assetId, kind: 'avatar' }], error: null }, { data: [{ id: assetId, kind: 'avatar' }], error: null }],
      email_signatures: [{ data: signatureRow(), error: null }, { data: signatureRow({ title: 'Updated' }), error: null }],
    });
    const parsed = parseEmailSignatureDocument(doc());
    await h.service.create(ownerId, { title: 'Work signature', document: parsed });
    await h.service.update(ownerId, signatureId, { title: 'Updated', document: parsed });
    expect(h.queries.filter(({ table }) => table === 'email_signature_assets').every(({ query }) =>
      query.filters.some(([key, value]) => key === 'user_id' && value === ownerId)
    )).toBe(true);
    const signatureQueries = h.queries.filter(({ table }) => table === 'email_signatures');
    expect(signatureQueries[0]!.query['insert']).toHaveBeenCalledWith(expect.objectContaining({ user_id: ownerId }));
    expect(signatureQueries[1]!.query.filters).toContainEqual(['user_id', ownerId]);
    expect(signatureQueries[1]!.query.filters).toContainEqual(['id', signatureId]);
    expect(signatureQueries).toHaveLength(2);
    expect(signatureQueries.some(({ query }) =>
      query.filters.some(([key, value]) => key === 'user_id' && value === ownerId)
    )).toBe(true);
  });

  it('scopes update and delete and returns not-found for another owner record', async () => {
    const h = harness({
      email_signatures: [
        { data: signatureRow(), error: null },
        { data: { id: signatureId }, error: null },
        { data: null, error: null },
      ],
    });
    await h.service.update(ownerId, signatureId, { title: 'Updated title' });
    expect(h.queries[0]!.query.filters).toEqual([['id', signatureId], ['user_id', ownerId]]);
    await h.service.remove(ownerId, signatureId);
    expect(h.queries[1]!.query.filters).toEqual([['id', signatureId], ['user_id', ownerId]]);
    await expect(h.service.findOne(ownerId, signatureId)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects foreign or wrong-role assets before persistence', async () => {
    const foreign = harness({ email_signature_assets: [{ data: [], error: null }] });
    await expect(foreign.service.create(ownerId, { title: 'Work', document: parseEmailSignatureDocument(doc()) }))
      .rejects.toBeInstanceOf(BadRequestException);
    expect(foreign.admin.from).toHaveBeenCalledTimes(1);

    const wrongRole = harness({ email_signature_assets: [{ data: [{ id: assetId, kind: 'company-logo' }], error: null }] });
    await expect(wrongRole.service.create(ownerId, { title: 'Work', document: parseEmailSignatureDocument(doc()) }))
      .rejects.toThrow(/role does not match/);
  });

  it('does not delete an asset while a saved signature references it', async () => {
    const h = harness({ email_signature_assets: [
      { data: assetRow(), error: null },
      { data: null, error: { code: '23503', message: 'foreign key violation' } },
    ] });
    await expect(h.service.removeAsset(ownerId, assetId)).rejects.toBeInstanceOf(ConflictException);
    expect(h.removals).toHaveLength(0);
    expect(h.queries.every(({ query }) => query.filters.some(([key, value]) => key === 'user_id' && value === ownerId))).toBe(true);
  });

  it('hides another owner asset and only removes the owned storage object', async () => {
    const notOwned = harness({ email_signature_assets: [{ data: null, error: null }] });
    await expect(notOwned.service.removeAsset(ownerId, assetId)).rejects.toBeInstanceOf(NotFoundException);
    expect(notOwned.removals).toHaveLength(0);

    const h = harness({ email_signature_assets: [
      { data: assetRow(), error: null },
      { data: { id: assetId }, error: null },
    ] });
    await expect(h.service.removeAsset(ownerId, assetId)).resolves.toEqual({ id: assetId, deleted: true });
    expect(h.removals).toEqual([{ bucket: EMAIL_SIGNATURE_ASSET_BUCKET, paths: [objectPath] }]);
  });
});

describe('Email Signature image publication boundary', () => {
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/K/8AAAAASUVORK5CYII=', 'base64');
  const jpeg = Buffer.from([
    0xff, 0xd8,
    0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01, 0x00, 0x01, 0x01, 0x01, 0x11, 0x00,
    0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00,
    0x00, 0xff, 0xd9,
  ]);

  it('accepts valid PNG, uses a randomized path and returns only a durable HTTPS URL', async () => {
    const h = harness({ email_signature_assets: [{ data: assetRow(), error: null }, { data: assetRow({ id: otherId }), error: null }] });
    const result = await h.service.uploadAsset(ownerId, { buffer: png, size: png.length, mimetype: 'image/png' }, 'avatar');
    expect(result.publicUrl).toMatch(/^https:\/\/project\.supabase\.co\/storage\/v1\/object\/public\/email-signature-assets\//);
    expect(result.publicUrl).not.toContain('avatars/');
    expect(h.uploads[0]!.bucket).toBe(EMAIL_SIGNATURE_ASSET_BUCKET);
    expect(h.uploads[0]!.path).toMatch(/^v1\/[a-f0-9]{64}\.png$/);
    expect(h.uploads[0]!.options).toMatchObject({ contentType: 'image/png', cacheControl: '0', upsert: false });
    const second = await h.service.uploadAsset(ownerId, { buffer: png, size: png.length, mimetype: 'image/png' }, 'avatar');
    expect(h.uploads[1]!.path).toMatch(/^v1\/[a-f0-9]{64}\.png$/);
    expect(h.uploads[1]!.path).not.toBe(h.uploads[0]!.path);
    expect(second.id).toBe(otherId);
  });

  it('accepts JPEG only when the declared MIME matches a structurally valid JPEG', async () => {
    const h = harness({ email_signature_assets: [{ data: assetRow({ content_type: 'image/jpeg', kind: 'company-logo', object_path: `v1/${'b'.repeat(64)}.jpg` }), error: null }] });
    const result = await h.service.uploadAsset(ownerId, { buffer: jpeg, size: jpeg.length, mimetype: 'image/jpeg' }, 'company-logo');
    expect(result.contentType).toBe('image/jpeg');
    expect(result.kind).toBe('company-logo');
    expect(h.uploads[0]!.options).toMatchObject({ contentType: 'image/jpeg', upsert: false });
  });

  it('rejects spoofed MIME, SVG, unsupported WebP and over-limit files before storage writes', async () => {
    const h = harness();
    await expect(h.service.uploadAsset(ownerId, { buffer: png, size: png.length, mimetype: 'image/jpeg' }, 'avatar'))
      .rejects.toBeInstanceOf(BadRequestException);
    await expect(h.service.uploadAsset(ownerId, { buffer: Buffer.from('<svg/>'), size: 6, mimetype: 'image/svg+xml' }, 'avatar'))
      .rejects.toBeInstanceOf(BadRequestException);
    await expect(h.service.uploadAsset(ownerId, { buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), size: 8, mimetype: 'image/png' }, 'avatar'))
      .rejects.toBeInstanceOf(BadRequestException);
    await expect(h.service.uploadAsset(ownerId, { buffer: Buffer.from('RIFF....WEBP'), size: 12, mimetype: 'image/webp' }, 'avatar'))
      .rejects.toBeInstanceOf(BadRequestException);
    await expect(h.service.uploadAsset(ownerId, { buffer: png, size: 1_048_577, mimetype: 'image/png' }, 'avatar'))
      .rejects.toThrow(/1 MiB/);
    expect(h.uploads).toHaveLength(0);
  });

  it('copies only the authenticated owner private Profile path and never consumes a signed URL', async () => {
    const h = harness({
      profiles: [{ data: { avatar_path: `${ownerId}/avatar` }, error: null }],
      email_signature_assets: [{ data: assetRow(), error: null }],
    });
    await h.service.copyProfileAsset(ownerId, 'avatar');
    expect(h.queries[0]!.query.filters).toEqual([['id', ownerId]]);
    expect(h.downloads).toEqual([{ bucket: 'avatars', path: `${ownerId}/avatar` }]);
    expect(h.uploads[0]!.bucket).toBe(EMAIL_SIGNATURE_ASSET_BUCKET);
    expect(h.uploads[0]!.path).not.toContain(ownerId);
  });

  it('does not change Profile storage configuration and keeps public bucket separate', () => {
    const migration = readFileSync(resolve(__dirname, '../../../../../supabase/migrations/20261008040120_email_signatures.sql'), 'utf8');
    expect(migration).toMatch(/'email-signature-assets',[\s\S]*TRUE[\s\S]*1048576[\s\S]*ARRAY\['image\/png', 'image\/jpeg'\]/);
    expect(migration).toMatch(/object_path ~ '\^v1\/\[a-f0-9\]\{64\}\\\.\(png\|jpg\)\$'/);
    expect(migration).toMatch(/ON DELETE RESTRICT/);
    expect(migration).toMatch(/CREATE TRIGGER sync_email_signature_asset_refs/);
    expect(migration).not.toMatch(/UPDATE storage\.buckets SET public = .*avatars/i);
    expect(migration).not.toMatch(/CREATE POLICY .*email-signature-assets.*SELECT/i);
  });
});

describe('Email Signature controllers', () => {
  it('derives owner IDs from the authenticated user for signature and asset operations', async () => {
    const service = {
      list: jest.fn(), findOne: jest.fn(), create: jest.fn(), update: jest.fn(), remove: jest.fn(),
      listAssets: jest.fn(), uploadAsset: jest.fn(), copyProfileAsset: jest.fn(), removeAsset: jest.fn(),
    } as unknown as EmailSignaturesService;
    const signatures = new EmailSignaturesController(service);
    const assets = new EmailSignatureAssetsController(service);
    const user = { id: ownerId } as User;
    await signatures.list(user);
    await signatures.findOne(user, signatureId);
    await signatures.create(user, { title: 'x', document: parseEmailSignatureDocument(doc()) });
    await signatures.update(user, signatureId, { title: 'y' });
    await signatures.remove(user, signatureId);
    await assets.list(user);
    await assets.upload(user, { buffer: Buffer.alloc(0), size: 0, mimetype: 'image/png' }, 'avatar');
    await assets.copyProfile(user, 'avatar');
    await assets.remove(user, assetId);
    expect((service as unknown as { list: jest.Mock }).list).toHaveBeenCalledWith(ownerId);
    expect((service as unknown as { findOne: jest.Mock }).findOne).toHaveBeenCalledWith(ownerId, signatureId);
    expect((service as unknown as { uploadAsset: jest.Mock }).uploadAsset).toHaveBeenCalledWith(
      ownerId, expect.objectContaining({ size: 0 }), 'avatar'
    );
    expect((service as unknown as { copyProfileAsset: jest.Mock }).copyProfileAsset).toHaveBeenCalledWith(ownerId, 'avatar');
    expect((service as unknown as { removeAsset: jest.Mock }).removeAsset).toHaveBeenCalledWith(ownerId, assetId);
  });

  it('protects both owner and asset controllers with JWT auth and has no public signature controller', () => {
    expect(Reflect.getMetadata('__guards__', EmailSignaturesController)).toContain(JwtAuthGuard);
    expect(Reflect.getMetadata('__guards__', EmailSignatureAssetsController)).toContain(JwtAuthGuard);
    const controllers = Reflect.getMetadata('controllers', EmailSignaturesModule) as unknown[];
    expect(controllers).toEqual([EmailSignatureAssetsController, EmailSignaturesController]);
  });

  it('rejects owner and persistence metadata supplied in create/update bodies', async () => {
    const create = plainToInstance(CreateEmailSignatureRequestDto, {
      title: 'Work', document: doc(), userId: otherId, user_id: otherId, schemaVersion: 8,
    });
    expect((await validate(create, { whitelist: true, forbidNonWhitelisted: true }))
      .map((error) => error.property)).toEqual(expect.arrayContaining(['userId', 'user_id', 'schemaVersion']));
    const update = plainToInstance(UpdateEmailSignatureRequestDto, { user_id: otherId, created_at: 'spoofed' });
    expect((await validate(update, { whitelist: true, forbidNonWhitelisted: true }))
      .map((error) => error.property)).toEqual(expect.arrayContaining(['user_id', 'created_at']));
  });
});
