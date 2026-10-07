import { toPng } from 'html-to-image';
import { BUSINESS_CARD_MANAGED_QR_NOTICE } from './businessCardPreview.data';

/** Standard US business-card trim size, rendered at CSS's 96 px/in baseline. */
export const BUSINESS_CARD_PRINT_SPEC = Object.freeze({
  widthInches: 3.5,
  heightInches: 2,
  widthMm: 88.9,
  heightMm: 50.8,
  cssWidth: 336,
  cssHeight: 192,
  dpi: 300,
  pngWidth: 1050,
  pngHeight: 600,
});

export function businessCardFilename(title: string, side: 'front' | 'back'): string {
  const safeTitle = title.normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
    .slice(0, 64) || 'wrx-business-card';
  return `${safeTitle}-${side === 'front' ? 'recto' : 'verso'}.png`;
}

export async function prepareBusinessCardArtwork(node: HTMLElement): Promise<void> {
  if (node.dataset['qrState'] === 'unsupported') throw new Error(BUSINESS_CARD_MANAGED_QR_NOTICE);
  if ('fonts' in document) await document.fonts.ready;
  if (node.dataset['assetsState'] === 'loading') {
    await new Promise<void>((resolve, reject) => {
      const observer = new MutationObserver(() => {
        const state = node.dataset['assetsState'];
        if (state === 'ready' || state === 'error') {
          observer.disconnect();
          window.clearTimeout(timeout);
          if (state === 'ready') resolve();
          else reject(new Error('Les images privées de la carte ne sont pas accessibles. Rechargez-les depuis Paramètres → Profil.'));
        }
      });
      const timeout = window.setTimeout(() => {
        observer.disconnect();
        reject(new Error('Le chargement des images de la carte a expiré. Réessayez.'));
      }, 15_000);
      observer.observe(node, { attributes: true, attributeFilter: ['data-assets-state'] });
    });
  }
  if (node.dataset['assetsState'] === 'error') throw new Error('Les images privées de la carte ne sont pas accessibles. Rechargez-les depuis Paramètres → Profil.');
  const images = Array.from(node.querySelectorAll('img'));
  await Promise.all(images.map(async (image) => {
    if (!image.complete) {
      await new Promise<void>((resolve, reject) => {
        image.addEventListener('load', () => resolve(), { once: true });
        image.addEventListener('error', () => reject(new Error('Une image de la carte n’a pas pu être chargée.')), { once: true });
      });
    }
    if (image.naturalWidth === 0) throw new Error('Une image privée de la carte n’est plus accessible. Rechargez-la depuis Paramètres → Profil.');
    if (typeof image.decode === 'function') await image.decode();
  }));
}

export async function downloadBusinessCardPng(node: HTMLElement, title: string, side: 'front' | 'back'): Promise<void> {
  await prepareBusinessCardArtwork(node);
  const dataUrl = await toPng(node, {
    width: BUSINESS_CARD_PRINT_SPEC.cssWidth,
    height: BUSINESS_CARD_PRINT_SPEC.cssHeight,
    pixelRatio: BUSINESS_CARD_PRINT_SPEC.dpi / 96,
    backgroundColor: '#fffef9',
    cacheBust: true,
  });
  const link = document.createElement('a');
  link.download = businessCardFilename(title, side);
  link.href = dataUrl;
  link.click();
}
