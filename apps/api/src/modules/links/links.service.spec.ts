import { ConflictException } from '@nestjs/common';
import { validate } from 'class-validator';
import { CreateLinkDto } from './dto';
import { LinksService } from './links.service';

function createService(options: { qrReferences?: number; passwordHash?: string | null } = {}) {
  const inserted: Record<string, unknown>[] = [];
  const updated: Record<string, unknown>[] = [];
  const deleted: string[] = [];
  const profile = { id: 'owner-1', tier: 'free' };
  const existingLink = {
    id: 'link-1', user_id: 'owner-1', slug: 'stable-slug', original_url: 'https://example.com/old',
    clicks: 0, is_active: true, max_clicks: null, expires_at: null, password_hash: options.passwordHash ?? null,
  };
  const makeQuery = (table: string) => {
    let insertValues: Record<string, unknown> | undefined;
    let selection = '';
    const promise = Promise.resolve(
      table === 'qr_codes'
        ? { data: null, error: null, count: options.qrReferences || 0 }
        : { data: null, error: null }
    );
    const query = Object.assign(promise, {}) as typeof promise & {
      select: jest.Mock;
      eq: jest.Mock;
      single: jest.Mock;
      insert: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    Object.assign(query, {
      select: jest.fn((column: string): typeof query => { selection = column; return query; }),
      eq: jest.fn((): typeof query => query),
      single: jest.fn(async () => {
        if (table === 'profiles') return { data: profile, error: null };
        if (table === 'links' && insertValues) return { data: { ...existingLink, ...insertValues }, error: null };
        if (table === 'links') return { data: selection === 'id' ? null : existingLink, error: null };
        return { data: null, error: null };
      }),
      insert: jest.fn((values: Record<string, unknown>) => {
        insertValues = values;
        inserted.push(values);
        return query;
      }),
      update: jest.fn((values: Record<string, unknown>) => {
        updated.push(values);
        return query;
      }),
      delete: jest.fn((): typeof query => { deleted.push(table); return query; }),
      then: promise.then.bind(promise),
    });
    return query;
  };
  const client = { from: jest.fn((table: string) => makeQuery(table)) };
  return {
    service: new LinksService({ getAdminClient: () => client } as never),
    client,
    inserted,
    updated,
    deleted,
  };
}

describe('LinksService managed-routing foundation', () => {
  it('exposes only whether a Link is password protected, never its stored hash', async () => {
    const { service } = createService({ passwordHash: 'private-hash' });
    const result = await service.findOne('owner-1', 'link-1');
    expect(result.isPasswordProtected).toBe(true);
    expect(result).not.toHaveProperty('passwordHash');
    expect(JSON.stringify(result)).not.toContain('private-hash');
  });

  it('generates high-entropy URL-safe slugs and normalizes accepted HTTP(S) destinations', async () => {
    const { service, inserted } = createService();
    const link = await service.create('owner-1', { originalUrl: 'HTTPS://Example.com/path' });
    expect(link.slug).toMatch(/^[A-Za-z0-9_-]{22}$/);
    expect(inserted[0]?.['slug']).toBe(link.slug);
    expect(inserted[0]?.['original_url']).toBe('https://example.com/path');
  });

  it.each(['javascript:alert(1)', 'data:text/html,hello', 'file:///tmp/x', 'ftp://example.com/file'])(
    'rejects unsafe destinations before persistence: %s',
    async (originalUrl) => {
      const { service, inserted } = createService();
      await expect(service.create('owner-1', { originalUrl })).rejects.toThrow();
      expect(inserted).toHaveLength(0);
    }
  );

  it('keeps an existing slug unchanged during destination edits', async () => {
    const { service, updated } = createService();
    await service.update('owner-1', 'link-1', { originalUrl: 'https://example.com/new' });
    expect(updated[0]).toMatchObject({ original_url: 'https://example.com/new' });
    expect(updated[0]).not.toHaveProperty('slug');
  });

  it('blocks Link deletion while any saved QR references it', async () => {
    const { service, deleted } = createService({ qrReferences: 1 });
    await expect(service.remove('owner-1', 'link-1')).rejects.toBeInstanceOf(ConflictException);
    expect(deleted).toHaveLength(0);
  });

  it.each(['http://example.com', 'https://example.com'])('validates web URL %s at the DTO boundary', async (originalUrl) => {
    const dto = Object.assign(new CreateLinkDto(), { originalUrl });
    expect(await validate(dto)).toHaveLength(0);
  });

  it.each(['javascript:alert(1)', 'data:text/html,hello', 'file:///tmp/x', 'ftp://example.com/file'])(
    'rejects non-HTTP(S) DTO URL %s',
    async (originalUrl) => {
      const dto = Object.assign(new CreateLinkDto(), { originalUrl });
      expect(await validate(dto)).not.toHaveLength(0);
    }
  );
});
