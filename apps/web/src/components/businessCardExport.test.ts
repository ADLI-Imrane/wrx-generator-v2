import { describe, expect, it } from 'vitest';
import { businessCardFilename, BUSINESS_CARD_PRINT_SPEC } from './businessCardExport';

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
});
