import { BadRequestException, NotFoundException } from '@nestjs/common';
import { QrService } from './qr.service';

function createService(linkOwner = 'owner-1', qrRow?: Record<string, unknown>) {
  let insertValues: Record<string, unknown> | undefined;
  let updateValues: Record<string, unknown> | undefined;
  const chainFor = (table: string) => {
    const result = Promise.resolve(
      table === 'qr_codes' ? { data: null, error: null, count: 0 } : { data: null, error: null }
    );
    const chain = Object.assign(result, {}) as typeof result & {
      select: jest.Mock;
      eq: jest.Mock;
      insert: jest.Mock;
      single: jest.Mock;
      maybeSingle: jest.Mock;
    };
    Object.assign(chain, {
      select: jest.fn((): typeof chain => chain),
      eq: jest.fn((): typeof chain => chain),
      insert: jest.fn((values: Record<string, unknown>) => {
        insertValues = values;
        return chain;
      }),
      update: jest.fn((values: Record<string, unknown>) => {
        updateValues = values;
        return chain;
      }),
      single: jest.fn(async () => {
        if (table === 'profiles') return { data: { tier: 'free' }, error: null };
        if (table === 'links') return { data: linkOwner === 'owner-1' ? { id: 'link-1' } : null, error: null };
        if (table === 'qr_codes') return { data: insertValues ? { id: 'qr-1', user_id: 'owner-1', ...insertValues } : qrRow, error: null };
        return { data: null, error: null };
      }),
      maybeSingle: jest.fn(async () => ({ data: linkOwner === 'owner-1' ? { id: 'link-1' } : null, error: null })),
    });
    return chain;
  };
  const client = {
    from: jest.fn((table: string) => chainFor(table)),
    rpc: jest.fn(async () => ({ error: null })),
  };
  const config = { get: jest.fn(() => 'https://api.example.test') };
  return {
    service: new QrService({ getAdminClient: () => client } as never, config as never),
    client,
    get updateValues() { return updateValues; },
  };
}

describe('QrService Link association contract', () => {
  it('accepts and persists an explicit same-owner Link association as managed_link', async () => {
    const { service } = createService();
    const result = await service.create('owner-1', {
      type: 'url',
      content: 'https://example.com',
      linkId: 'link-1',
    });
    expect(result).toMatchObject({ linkId: 'link-1', routingMode: 'managed_link' });
  });

  it('returns only a safe linked Link summary, including password-protected status', async () => {
    const { service } = createService('owner-1', {
      id: 'qr-1', user_id: 'owner-1', type: 'url', content: 'https://example.com',
      link_id: 'link-1', routing_mode: 'managed_link',
      links: {
        id: 'link-1', slug: 'stable', title: 'Current offer', original_url: 'https://new.example',
        is_active: true, expires_at: null, max_clicks: 40, clicks: 2, password_hash: 'must-not-leak',
      },
    });
    const result = await service.findOne('owner-1', 'qr-1');
    expect(result).toMatchObject({
      linkedLink: {
        id: 'link-1', title: 'Current offer', originalUrl: 'https://new.example',
        isPasswordProtected: true, maxClicks: 40,
      },
    });
    expect(JSON.stringify(result)).not.toContain('must-not-leak');
  });

  it('rejects an association to another owner or a missing Link', async () => {
    const foreign = createService('owner-2').service;
    const missing = createService('missing').service;
    const dto = { type: 'url' as const, content: 'https://example.com', linkId: 'link-1' };
    await expect(foreign.create('owner-1', dto)).rejects.toBeInstanceOf(NotFoundException);
    await expect(missing.create('owner-1', dto)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('keeps unassociated QR records in legacy mode', async () => {
    const { service } = createService();
    const result = await service.create('owner-1', { type: 'text', content: 'hello' });
    expect(result).toMatchObject({ routingMode: 'legacy' });
  });

  it('preserves the legacy scan/content response for saved QR records', async () => {
    const { service } = createService('owner-1', {
      id: 'qr-legacy', user_id: 'owner-1', type: 'url', content: 'https://example.com/legacy', routing_mode: 'legacy',
    });
    await expect(service.trackScan('qr-legacy', { ipAddress: '127.0.0.1' })).resolves.toMatchObject({
      content: 'https://example.com/legacy',
      type: 'url',
      routingMode: 'legacy',
      linkId: undefined,
    });
  });

  it('requires URL type for managed QR and explicit replacement content when detaching', async () => {
    const { service } = createService();
    await expect(service.create('owner-1', { type: 'text', content: 'hello', linkId: 'link-1' }))
      .rejects.toBeInstanceOf(BadRequestException);
  });

  it('supports only explicit same-owner association and requires content when detaching', async () => {
    const row = {
      id: 'qr-1', user_id: 'owner-1', type: 'url', content: 'https://original.example',
      link_id: null, routing_mode: 'legacy',
    };
    const harness = createService('owner-1', row);
    const { service } = harness;
    await service.update('owner-1', 'qr-1', { linkId: 'link-1' });
    expect(harness.updateValues).toMatchObject({ link_id: 'link-1', routing_mode: 'managed_link' });

    await expect(service.update('owner-1', 'qr-1', { linkId: null }))
      .rejects.toBeInstanceOf(BadRequestException);
    await service.update('owner-1', 'qr-1', { linkId: null, content: 'https://manual.example' });
    expect(harness.updateValues).toMatchObject({ link_id: null, routing_mode: 'legacy' });

    const foreignLink = createService('owner-2', row).service;
    await expect(foreignLink.update('owner-1', 'qr-1', { linkId: 'link-1' }))
      .rejects.toBeInstanceOf(NotFoundException);
  });
});
