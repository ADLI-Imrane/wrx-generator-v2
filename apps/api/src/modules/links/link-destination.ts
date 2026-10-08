import { BadRequestException } from '@nestjs/common';

const HTTP_PROTOCOLS = new Set(['http:', 'https:']);

/** Parse and normalize a web destination, rejecting schemes a redirect must never execute. */
export function normalizeLinkDestination(value: string): string {
  let destination: URL;
  try {
    destination = new URL(value.trim());
  } catch {
    throw new BadRequestException('Destination must be a valid HTTP or HTTPS URL');
  }

  if (!HTTP_PROTOCOLS.has(destination.protocol) || !destination.hostname || destination.username || destination.password) {
    throw new BadRequestException('Destination must be a valid HTTP or HTTPS URL');
  }

  if (isWrxRedirectLoop(destination)) {
    throw new BadRequestException('A WRX redirect URL cannot be used as its own destination');
  }

  return destination.toString();
}

/** Resolve-time validation also protects against old or manually corrupted rows. */
export function isSafeLinkDestination(value: string): boolean {
  try {
    return normalizeLinkDestination(value) === new URL(value.trim()).toString();
  } catch {
    return false;
  }
}

function isWrxRedirectLoop(destination: URL): boolean {
  const redirectPath = /^\/(?:api\/)?r(?:\/|$)/i.test(destination.pathname);
  if (!redirectPath) return false;

  const configuredOrigins = [process.env['SHORT_URL_DOMAIN'], process.env['API_URL']]
    .filter((value): value is string => Boolean(value))
    .flatMap((value) => {
      try {
        return [new URL(value).origin];
      } catch {
        return [];
      }
    });

  return configuredOrigins.includes(destination.origin);
}
