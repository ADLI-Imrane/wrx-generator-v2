import { BadRequestException } from '@nestjs/common';
import { isSafeLinkDestination, normalizeLinkDestination } from './link-destination';

describe('Link destination policy', () => {
  it.each(['http://example.com/path', 'https://example.com/path?q=1'])('accepts %s', (value) => {
    expect(normalizeLinkDestination(value)).toBe(new URL(value).toString());
    expect(isSafeLinkDestination(value)).toBe(true);
  });

  it.each(['javascript:alert(1)', 'data:text/html,hello', 'file:///etc/passwd', 'ftp://example.com/file'])('rejects unsafe scheme %s', (value) => {
    expect(() => normalizeLinkDestination(value)).toThrow(BadRequestException);
    expect(isSafeLinkDestination(value)).toBe(false);
  });

  it('rejects credentials embedded in a destination URL', () => {
    expect(() => normalizeLinkDestination('https://user:secret@example.com')).toThrow(BadRequestException);
  });

  it('rejects a redirect loop only on configured WRX routing origins', () => {
    const previous = process.env['SHORT_URL_DOMAIN'];
    process.env['SHORT_URL_DOMAIN'] = 'https://go.example.test';
    try {
      expect(() => normalizeLinkDestination('https://go.example.test/r/another')).toThrow(BadRequestException);
      expect(normalizeLinkDestination('https://go.example.test/about')).toBe('https://go.example.test/about');
      expect(normalizeLinkDestination('https://other.example.test/r/valid')).toBe('https://other.example.test/r/valid');
    } finally {
      if (previous === undefined) delete process.env['SHORT_URL_DOMAIN'];
      else process.env['SHORT_URL_DOMAIN'] = previous;
    }
  });
});
