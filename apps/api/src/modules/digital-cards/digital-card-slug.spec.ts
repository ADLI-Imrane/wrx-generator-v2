import { DigitalCardSlugGenerator } from './digital-card-slug';

describe('DigitalCardSlugGenerator', () => {
  it('generates URL-safe nonsequential 128-bit identifiers', () => {
    const generator = new DigitalCardSlugGenerator();
    const values = Array.from({ length: 100 }, () => generator.generate());

    expect(values.every((slug) => /^[a-f0-9]{32}$/.test(slug))).toBe(true);
    expect(new Set(values).size).toBe(values.length);
  });
});
