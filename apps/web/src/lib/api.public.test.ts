import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from './api';

const auth = vi.hoisted(() => ({ getSession: vi.fn() }));
vi.mock('./supabase', () => ({ supabase: { auth } }));

describe('anonymous API reads', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('does not look up or send the signed-in owner token', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ slug: 'safe' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(api.getPublic<{ slug: string }>('/public/digital-cards/safe')).resolves.toEqual({ slug: 'safe' });
    expect(auth.getSession).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/public/digital-cards/safe',
      expect.objectContaining({ headers: { 'Content-Type': 'application/json' }, method: 'GET' })
    );
  });
});
