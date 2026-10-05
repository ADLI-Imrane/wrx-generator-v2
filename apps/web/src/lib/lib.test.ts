import { describe, expect, it } from 'vitest';
import { parseCsv } from './csv';
import { delta, flag, hostOf } from './format';
import { fr } from './fr';

describe('parseCsv', () => {
  it('handles quotes, commas inside quotes, CRLF and semicolons', () => {
    const rows = parseCsv('url,title\r\n"https://a.test/?x=1,2","Say ""hi"""\r\nhttps://b.test;B\n');
    expect(rows).toEqual([
      { url: 'https://a.test/?x=1,2', title: 'Say "hi"' },
      { url: 'https://b.test', title: 'B' },
    ]);
  });
  it('returns nothing without a header', () => expect(parseCsv('')).toEqual([]));
});

describe('format helpers', () => {
  it('computes period-over-period change', () => {
    expect(delta(150, 100)).toBe(50);
    expect(delta(5, 0)).toBe(100);
    expect(delta(0, 0)).toBe(0);
  });
  it('renders country flags and hosts', () => {
    expect(flag('MA')).toBe('🇲🇦');
    expect(flag(null)).toBe('🌐');
    expect(hostOf('https://www.example.com/a')).toBe('example.com');
  });
});

describe('french dictionary', () => {
  it('keeps every {placeholder} of the English source', () => {
    for (const [en, tr] of Object.entries(fr)) {
      const ph = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join();
      expect(ph(tr), en).toBe(ph(en));
    }
  });
});
