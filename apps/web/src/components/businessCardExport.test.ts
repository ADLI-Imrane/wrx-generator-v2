import { describe, expect, it, vi } from 'vitest';
import { toPng } from 'html-to-image';
import { businessCardFilename, BUSINESS_CARD_PRINT_SPEC, downloadBusinessCardPng, prepareBusinessCardArtwork } from './businessCardExport';

vi.mock('html-to-image', () => ({ toPng: vi.fn() }));

describe('business-card export', () => {
  it('uses standard 3.5 × 2 inch dimensions and 300 DPI PNG output', () => {
    expect(BUSINESS_CARD_PRINT_SPEC).toMatchObject({
      widthMm: 88.9,
      heightMm: 50.8,
      pngWidth: 1050,
      pngHeight: 600,
      dpi: 300,
    });
    expect(BUSINESS_CARD_PRINT_SPEC.pngWidth / BUSINESS_CARD_PRINT_SPEC.pngHeight).toBe(1.75);
  });

  it('creates safe localized filenames for each side', () => {
    expect(businessCardFilename('Équipe WRX / Maroc', 'front')).toBe('equipe-wrx-maroc-recto.png');
    expect(businessCardFilename('!!!', 'back')).toBe('wrx-business-card-verso.png');
  });

  it('blocks both PNG and print preparation for an unsupported QR surface', async () => {
    const artwork = document.createElement('div');
    artwork.dataset['qrState'] = 'unsupported';
    await expect(prepareBusinessCardArtwork(artwork)).rejects.toThrow(/QR géré, non pris en charge/);
  });

  it('exports the supplied artwork surface only at 300 DPI without a second renderer', async () => {
    const artwork = document.createElement('div');
    artwork.dataset['assetsState'] = 'ready';
    vi.mocked(toPng).mockResolvedValueOnce('data:image/png;base64,test');
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    try {
      await downloadBusinessCardPng(artwork, 'Carte QA', 'back');
      expect(toPng).toHaveBeenCalledWith(artwork, {
        width: 336, height: 192, pixelRatio: 300 / 96,
        backgroundColor: '#fffef9', cacheBust: true,
      });
      expect(click).toHaveBeenCalledOnce();
    } finally {
      click.mockRestore();
    }
  });

  it('rejects failed private images instead of exporting missing artwork', async () => {
    const artwork = document.createElement('div');
    artwork.dataset['assetsState'] = 'error';
    await expect(prepareBusinessCardArtwork(artwork)).rejects.toThrow(/images privées/);
  });
});
