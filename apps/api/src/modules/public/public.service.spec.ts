import { ForbiddenException, GoneException, UnauthorizedException } from '@nestjs/common';
import { scryptSync } from 'node:crypto';
import { PublicService } from './public.service';

const activeLink = {
  id: 'link-1',
  slug: 'stableSlug',
  original_url: 'https://example.com/new',
  is_active: true,
  expires_at: null,
  max_clicks: null,
  clicks: 0,
  password_hash: null,
  title: 'Destination',
};

function makeBuilder(result: { data?: unknown; error?: Error | null; count?: number | null }) {
  const promise = Promise.resolve(result);
  const builder = Object.assign(promise, {}) as Promise<typeof result> & { insert: jest.Mock };
  Object.assign(builder, {
    select: jest.fn(() => builder),
    eq: jest.fn(() => builder),
    in: jest.fn(() => builder),
    insert: jest.fn(() => builder),
    single: jest.fn(async () => result),
    maybeSingle: jest.fn(async () => result),
  });
  return builder;
}

function makeService(options: {
  link?: Record<string, unknown>;
  managedQrIds?: string[];
  managedScans?: number;
} = {}) {
  const clickInsert = makeBuilder({ error: null });
  const supabase = {
    from: jest.fn((table: string) => {
      if (table === 'links') return makeBuilder({ data: options.link ?? activeLink, error: null });
      if (table === 'qr_codes') return makeBuilder({ data: (options.managedQrIds || []).map((id) => ({ id })), error: null });
      if (table === 'scans') return makeBuilder({ data: null, error: null, count: options.managedScans || 0 });
      if (table === 'clicks') return clickInsert;
      return makeBuilder({ data: null, error: null });
    }),
  };
  const service = new PublicService({ getAdminClient: () => supabase } as never);
  return { service, supabase, clickInsert };
}

describe('PublicService shared Link resolution policy', () => {
  it('resolves a direct stable Link and records one click', async () => {
    const { service, clickInsert } = makeService();
    await expect(service.redirect('stableSlug', { linkId: '' })).resolves.toMatchObject({
      url: 'https://example.com/new',
    });
    expect(clickInsert['insert']).toHaveBeenCalledTimes(1);
  });

  it('resolves a managed QR through the same policy without recording a Link click', async () => {
    const { service, supabase, clickInsert } = makeService();
    await expect(service.resolveManagedQr('link-1')).resolves.toMatchObject({
      url: 'https://example.com/new',
    });
    expect(supabase.from).not.toHaveBeenCalledWith('clicks');
    expect(clickInsert['insert']).not.toHaveBeenCalled();
  });

  it.each([
    ['inactive', { is_active: false }, GoneException],
    ['expired', { expires_at: '2000-01-01T00:00:00.000Z' }, GoneException],
    ['max clicks reached', { max_clicks: 2, clicks: 2 }, GoneException],
    ['unsafe stored destination', { original_url: 'javascript:alert(1)' }, GoneException],
  ])('blocks a %s Link for both ingress routes', async (_label, override, exception) => {
    const row = { ...activeLink, ...(override as object) };
    const { service } = makeService({ link: row });
    await expect(service.redirect('stableSlug', { linkId: '' })).rejects.toBeInstanceOf(exception);
    await expect(service.resolveManagedQr('link-1')).rejects.toBeInstanceOf(exception);
  });

  it('applies the existing max-click boundary to combined Link clicks and managed QR scans', async () => {
    const { service } = makeService({
      link: { ...activeLink, max_clicks: 4, clicks: 2 },
      managedQrIds: ['qr-1'],
      managedScans: 2,
    });
    await expect(service.resolveManagedQr('link-1')).rejects.toBeInstanceOf(GoneException);
  });

  it('requires the Link password through both direct and managed QR resolution', async () => {
    const salt = 'test-salt';
    const hash = scryptSync('correct-password', salt, 64).toString('hex');
    const { service } = makeService({ link: { ...activeLink, password_hash: `scrypt$${salt}$${hash}` } });

    await expect(service.redirect('stableSlug', { linkId: '' })).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(service.resolveManagedQr('link-1', 'wrong-password')).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.resolveManagedQr('link-1', 'correct-password')).resolves.toMatchObject({
      url: 'https://example.com/new',
    });
  });

  it('uses the latest associated Link destination without a QR content snapshot', async () => {
    const { service } = makeService({ link: { ...activeLink, original_url: 'https://example.com/updated' } });
    await expect(service.resolveManagedQr('link-1')).resolves.toMatchObject({
      url: 'https://example.com/updated',
    });
  });
});
