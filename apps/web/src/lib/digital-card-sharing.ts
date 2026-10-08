import type { DigitalCardRecord, PublicDigitalCard } from '@wrx/shared';
import { publicDigitalCardUrl } from './digital-card-vcard';

export interface DigitalCardSharingTarget {
  /** Stable absolute public-card address; the QR encodes this URL verbatim. */
  url: string;
  qrPayload: string;
  title: string;
  text: string;
}

export interface DigitalCardShareRuntime {
  share?: (data: ShareData) => Promise<void>;
  clipboard?: { writeText: (text: string) => Promise<void> };
}

export type DigitalCardShareResult = 'shared' | 'copied' | 'unavailable' | 'cancelled';

function browserShareRuntime(): DigitalCardShareRuntime | null {
  if (typeof navigator === 'undefined') return null;
  return {
    share: typeof navigator.share === 'function' ? navigator.share.bind(navigator) : undefined,
    clipboard: navigator.clipboard,
  };
}

/** Drafts and non-browser contexts never receive an owner-share target. */
export function getDigitalCardSharingTarget(
  card: DigitalCardRecord,
  origin?: string
): DigitalCardSharingTarget | null {
  if (card.status !== 'published') return null;
  return createDigitalCardSharingTarget(
    card.slug,
    card.document.identity.fullName || card.title,
    origin
  );
}

/** Public cards have already passed the published-only public API boundary. */
export function getPublicDigitalCardSharingTarget(
  card: PublicDigitalCard,
  origin?: string
): DigitalCardSharingTarget | null {
  return createDigitalCardSharingTarget(card.slug, card.identity.fullName, origin);
}

function createDigitalCardSharingTarget(
  slug: string,
  title: string,
  origin?: string
): DigitalCardSharingTarget | null {
  const currentOrigin = origin ?? (typeof window !== 'undefined' ? window.location.origin : undefined);
  if (!currentOrigin) return null;

  const url = publicDigitalCardUrl(slug, currentOrigin);
  return {
    url,
    qrPayload: url,
    title,
    text: 'Carte numérique',
  };
}

export function isNativeDigitalCardShareAvailable(
  runtime: DigitalCardShareRuntime | null = browserShareRuntime()
): boolean {
  return typeof runtime?.share === 'function';
}

export async function copyDigitalCardLink(
  url: string,
  runtime: DigitalCardShareRuntime | null = browserShareRuntime()
): Promise<boolean> {
  if (typeof runtime?.clipboard?.writeText !== 'function') return false;
  try {
    await runtime.clipboard.writeText(url);
    return true;
  } catch {
    return false;
  }
}

/** Native share is attempted first; cancellation stays cancellation, other failures copy. */
export async function shareDigitalCard(
  target: DigitalCardSharingTarget,
  runtime: DigitalCardShareRuntime | null = browserShareRuntime()
): Promise<DigitalCardShareResult> {
  if (typeof runtime?.share === 'function') {
    try {
      await runtime.share({ title: target.title, text: target.text, url: target.url });
      return 'shared';
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return 'cancelled';
    }
  }

  return (await copyDigitalCardLink(target.url, runtime)) ? 'copied' : 'unavailable';
}
