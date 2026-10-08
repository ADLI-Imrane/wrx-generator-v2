import { Test } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import { AddressInfo } from 'node:net';
import { RequestMethod, UnauthorizedException } from '@nestjs/common';
import { PublicController } from './public.controller';
import { PublicService } from './public.service';
import { QrService } from '../qr/qr.service';

describe('Public routing controller', () => {
  async function createApp(options: { passwordProtectedQr?: boolean; passwordProtectedLink?: boolean } = {}) {
    const publicService = {
      redirect: jest.fn(async (_slug: string, _data: unknown, password?: string) => {
        if (options.passwordProtectedLink && !password) throw new UnauthorizedException();
        return { url: 'https://example.com/final' };
      }),
      getLinkPreview: jest.fn(async () => ({ slug: 'stable' })),
      checkPassword: jest.fn(async () => ({ valid: true })),
      resolveManagedQr: jest.fn(async () => {
        if (options.passwordProtectedQr) throw new UnauthorizedException();
        return { url: 'https://example.com/final' };
      }),
    };
    const qrService = {
      findById: jest.fn(async () => ({ id: '00000000-0000-4000-8000-000000000001', routing_mode: 'managed_link', link_id: 'link-1' })),
      trackScan: jest.fn(async () => ({ content: 'https://example.com/legacy', type: 'url', routingMode: 'legacy' })),
    };
    const moduleRef = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot([{ ttl: 60_000, limit: 10 }])],
      controllers: [PublicController],
      providers: [
        { provide: PublicService, useValue: publicService },
        { provide: QrService, useValue: qrService },
      ],
    }).compile();
    const app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api', {
      exclude: [
        { path: 'r/:slug', method: RequestMethod.GET },
        { path: 'r/scan/:id', method: RequestMethod.GET },
        { path: 'r/:slug/verify-password', method: RequestMethod.POST },
      ],
    });
    await app.listen(0);
    const address = app.getHttpServer().address() as AddressInfo;
    return { app, baseUrl: `http://127.0.0.1:${address.port}`, publicService, qrService };
  }

  it('applies throttling to public redirect requests', async () => {
    const runtime = await createApp();
    try {
      const statuses: number[] = [];
      for (let i = 0; i < 11; i++) {
        const response = await fetch(`${runtime.baseUrl}/r/throttle-test`, { redirect: 'manual' });
        statuses.push(response.status);
      }
      expect(statuses.slice(0, 10).every((status) => status === 302)).toBe(true);
      expect(statuses[10]).toBe(429);
    } finally {
      await runtime.app.close();
    }
  });

  it('submits the password form to the existing prefixed route and throttles password attempts', async () => {
    const runtime = await createApp({ passwordProtectedLink: true });
    try {
      const passwordPage = await fetch(`${runtime.baseUrl}/r/protected`, { redirect: 'manual' });
      expect(await passwordPage.text()).toContain('action="/api/r/protected/unlock"');
      const unlock = await fetch(`${runtime.baseUrl}/api/r/protected/unlock`, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: 'password=secret',
        redirect: 'manual',
      });
      expect(unlock.status).toBe(302);
      expect(runtime.publicService.redirect).toHaveBeenCalledWith(
        'protected', expect.objectContaining({ linkId: '' }), 'secret'
      );

      const statuses: number[] = [];
      for (let i = 0; i < 6; i++) {
        const response = await fetch(`${runtime.baseUrl}/r/protected/verify-password`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ password: 'guess' }),
        });
        statuses.push(response.status);
      }
      expect(statuses.slice(0, 5).every((status) => status === 201)).toBe(true);
      expect(statuses[5]).toBe(429);

      const unprefixedPath = await fetch(`${runtime.baseUrl}/r/protected/unlock`, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: 'password=secret',
      });
      expect(unprefixedPath.status).toBe(404);

      const unlockStatuses: number[] = [];
      // The earlier successful unlock request already consumed one of the five attempts.
      for (let i = 0; i < 5; i++) {
        const response = await fetch(`${runtime.baseUrl}/api/r/protected/unlock`, {
          method: 'POST',
          headers: { 'content-type': 'application/x-www-form-urlencoded' },
          body: 'password=guess',
          redirect: 'manual',
        });
        unlockStatuses.push(response.status);
      }
      expect(unlockStatuses.slice(0, 4).every((status) => status === 302)).toBe(true);
      expect(unlockStatuses[4]).toBe(429);
    } finally {
      await runtime.app.close();
    }
  });

  it('resolves a managed QR without recording a Link click and records exactly one scan', async () => {
    const runtime = await createApp();
    try {
      const response = await fetch(`${runtime.baseUrl}/r/scan/00000000-0000-4000-8000-000000000001`, {
        redirect: 'manual',
      });
      expect(response.status).toBe(302);
      expect(response.headers.get('location')).toBe('https://example.com/final');
      expect(runtime.publicService.resolveManagedQr).toHaveBeenCalledWith('link-1');
      expect(runtime.qrService.trackScan).toHaveBeenCalledTimes(1);
      expect(runtime.publicService.redirect).not.toHaveBeenCalled();
    } finally {
      await runtime.app.close();
    }
  });

  it('shows a password form on managed QR and records one scan only after valid unlock', async () => {
    const runtime = await createApp({ passwordProtectedQr: true });
    try {
      const scanUrl = `${runtime.baseUrl}/r/scan/00000000-0000-4000-8000-000000000001`;
      const page = await fetch(scanUrl);
      expect(page.status).toBe(401);
      expect(await page.text()).toContain('/api/r/scan/00000000-0000-4000-8000-000000000001/unlock');
      expect(runtime.qrService.trackScan).not.toHaveBeenCalled();
      runtime.publicService.resolveManagedQr.mockResolvedValueOnce({ url: 'https://example.com/final' });
      const unlock = await fetch(`${runtime.baseUrl}/api/r/scan/00000000-0000-4000-8000-000000000001/unlock`, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: 'password=secret',
        redirect: 'manual',
      });
      expect(unlock.status).toBe(302);
      expect(runtime.qrService.trackScan).toHaveBeenCalledTimes(1);
    } finally {
      await runtime.app.close();
    }
  });
});
