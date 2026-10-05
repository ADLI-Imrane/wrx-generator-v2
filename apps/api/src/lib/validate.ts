import type { z } from 'zod';
import { HttpError, zodFields } from './errors';

export function parse<S extends z.ZodType>(schema: S, data: unknown): z.output<S> {
  const r = schema.safeParse(data);
  if (!r.success)
    throw new HttpError(422, 'validation_failed', 'Some fields need attention', zodFields(r.error));
  return r.data;
}

export async function body(req: { json: () => Promise<unknown> }) {
  try {
    return await req.json();
  } catch {
    throw new HttpError(400, 'invalid_json', 'Send a JSON body');
  }
}
