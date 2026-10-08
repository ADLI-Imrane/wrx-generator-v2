import type { PublicDigitalCard } from '@wrx/shared';

function escapeVCardText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\r\n|\r|\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function foldLine(line: string): string {
  const chunks: string[] = [];
  let chunk = '';
  let octets = 0;
  for (const character of line) {
    const size = new TextEncoder().encode(character).length;
    if (octets + size > 75) {
      chunks.push(chunk);
      chunk = ` ${character}`;
      octets = size + 1;
    } else {
      chunk += character;
      octets += size;
    }
  }
  chunks.push(chunk);
  return chunks.join('\r\n');
}

function nameParts(fullName: string): { given: string; family: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length < 2) return { given: '', family: parts[0] ?? '' };
  return { given: parts.slice(0, -1).join(' '), family: parts.at(-1) ?? '' };
}

/** Creates a vCard 3.0 only from the server-redacted public projection. */
export function createPublicDigitalCardVCard(card: PublicDigitalCard): string {
  const { fullName, jobTitle, company } = card.identity;
  const { given, family } = nameParts(fullName);
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${escapeVCardText(family)};${escapeVCardText(given)};;;`,
    `FN:${escapeVCardText(fullName)}`,
  ];

  if (jobTitle) lines.push(`TITLE:${escapeVCardText(jobTitle)}`);
  if (company) lines.push(`ORG:${escapeVCardText(company)}`);
  if (card.contact.email) lines.push(`EMAIL;TYPE=INTERNET:${card.contact.email}`);
  if (card.contact.phone) lines.push(`TEL;TYPE=CELL:${escapeVCardText(card.contact.phone)}`);
  if (card.contact.website) lines.push(`URL:${card.contact.website}`);
  if (card.contact.address) {
    lines.push(`ADR;TYPE=WORK:;;${escapeVCardText(card.contact.address)};;;;`);
  }

  const socialTypes = {
    linkedin: 'linkedin',
    github: 'github',
    instagram: 'instagram',
    x: 'x',
  } as const;
  for (const [platform, type] of Object.entries(socialTypes)) {
    const url = card.socialLinks[platform as keyof typeof socialTypes];
    if (url) lines.push(`X-SOCIALPROFILE;TYPE=${type}:${url}`);
  }

  lines.push('END:VCARD');
  return `${lines.map(foldLine).join('\r\n')}\r\n`;
}

export function publicDigitalCardUrl(slug: string, origin = window.location.origin): string {
  return new URL(`/c/${encodeURIComponent(slug)}`, origin).toString();
}
