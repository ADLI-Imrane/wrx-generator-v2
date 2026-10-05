import type { ApiError as ApiErrorBody } from '@wrx/shared';

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fields: Record<string, string> = {},
  ) {
    super(message);
  }
}

export async function api<T>(
  path: string,
  init: { method?: string; body?: unknown; signal?: AbortSignal } = {},
): Promise<T> {
  const res = await fetch(`/api/v1${path}`, {
    method: init.method ?? 'GET',
    credentials: 'same-origin',
    headers: init.body !== undefined ? { 'content-type': 'application/json' } : undefined,
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    signal: init.signal,
  });
  if (res.status === 204) return undefined as T;
  const data = (await res.json().catch(() => null)) as T | ApiErrorBody | null;
  if (!res.ok) {
    const e = (data as ApiErrorBody | null)?.error;
    throw new ApiError(
      res.status,
      e?.code ?? 'network',
      e?.message ?? 'The server did not answer. Check your connection.',
      e?.fields,
    );
  }
  return data as T;
}

export const errorMessage = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong');
