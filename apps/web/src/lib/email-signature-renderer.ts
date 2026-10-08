import type { EmailSignaturePresentation, EmailSignaturePresentationItem } from './email-signature-presentation';

const FONT = 'Arial, Helvetica, sans-serif';

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!);
}

function text(value: string): string {
  return escapeHtml(value);
}

function link(item: EmailSignaturePresentationItem, color: string): string {
  const content = text(item.text);
  const href = safeHref(item.href);
  return href
    ? `<a href="${escapeHtml(href)}" style="color:${color};text-decoration:underline;">${content}</a>`
    : content;
}

function safeHref(value?: string): string | undefined {
  if (!value) return undefined;
  if (/^mailto:[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/i.test(value)) return value;
  if (/^tel:\+?[\d]{5,32}$/i.test(value)) return value;
  try {
    const url = new URL(value);
    if (url.protocol === 'https:' && url.hostname && !url.username && !url.password) return url.toString();
  } catch { /* unsafe destination is rendered as text */ }
  return undefined;
}

function safeColor(value: string): string {
  return /^#[0-9a-f]{6}$/i.test(value) ? value : '#235EE7';
}

function safeImageSrc(value: string): string | undefined {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password && !url.search && !url.hash
      && /^\/storage\/v1\/object\/public\/email-signature-assets\/v1\/[a-f\d]{64}\.(?:png|jpg)$/i.test(url.pathname)
      ? url.toString()
      : undefined;
  } catch { return undefined; }
}

function imageCell(image: EmailSignaturePresentation['avatar']): string {
  if (!image) return '';
  const src = safeImageSrc(image.src);
  if (!src) return '';
  const width = image.width === 56 ? 56 : 120;
  const height = image.height === 56 ? 56 : 48;
  return `<td valign="top" style="padding:0 12px 0 0;"><img src="${escapeHtml(src)}" width="${width}" height="${height}" alt="${escapeHtml(image.alt)}" border="0" style="display:block;border:0;width:${width}px;height:${height}px;"></td>`;
}

function identityMarkup(presentation: EmailSignaturePresentation): string {
  const { identity, accentColor } = presentation;
  const safeAccent = safeColor(accentColor);
  const avatar = presentation.avatar && safeImageSrc(presentation.avatar.src) ? presentation.avatar : null;
  const companyLogo = presentation.companyLogo && safeImageSrc(presentation.companyLogo.src) ? presentation.companyLogo : null;
  const identityLines = [
    identity.fullName ? `<strong style="font-size:16px;line-height:20px;color:#182222;font-weight:bold;">${text(identity.fullName)}</strong>` : '',
    identity.jobTitle ? `<span style="font-size:13px;line-height:18px;color:#56625f;">${text(identity.jobTitle)}</span>` : '',
    identity.company ? `<span style="font-size:13px;line-height:18px;color:${safeAccent};font-weight:bold;">${text(identity.company)}</span>` : '',
  ].filter(Boolean).join('<br>');
  const logo = companyLogo
    ? `<td valign="top" align="right" style="padding:0 0 0 12px;"><img src="${escapeHtml(safeImageSrc(companyLogo.src)!)}" width="120" height="48" alt="${escapeHtml(companyLogo.alt)}" border="0" style="display:block;border:0;width:120px;height:48px;"></td>`
    : '';
  return `<table role="presentation" border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse;"><tr>${imageCell(avatar)}<td valign="top" style="font-family:${FONT};">${identityLines}</td>${logo}</tr></table>`;
}

function itemMarkup(item: EmailSignaturePresentationItem, accentColor: string, compact = false): string {
  const separator = compact ? `<span style="color:#9aa4a1;padding:0 6px;">|</span>` : '';
  return `<span style="font-family:${FONT};font-size:12px;line-height:18px;color:#4e5b58;">${text(item.label)}: ${link(item, accentColor)}</span>${separator}`;
}

function contactItems(presentation: EmailSignaturePresentation): EmailSignaturePresentationItem[] {
  return [...presentation.contact, ...presentation.socials];
}

function signal(presentation: EmailSignaturePresentation): string {
  const accentColor = safeColor(presentation.accentColor);
  const items = contactItems(presentation);
  const details = items.map((item) => `<tr><td style="padding:2px 0;font-family:${FONT};font-size:12px;line-height:18px;color:#4e5b58;">${text(item.label)}: ${link(item, accentColor)}</td></tr>`).join('');
  return `<table role="presentation" border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-left:3px solid ${accentColor};"><tr><td style="padding:0 0 0 12px;">${identityMarkup(presentation)}${details ? `<table role="presentation" border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-top:10px;border-top:1px solid #e1e6e4;"><tr><td height="8" style="height:8px;font-size:1px;line-height:8px;">&nbsp;</td></tr>${details}</table>` : ''}</td></tr></table>`;
}

function compact(presentation: EmailSignaturePresentation): string {
  const accentColor = safeColor(presentation.accentColor);
  const details = contactItems(presentation).map((item) => itemMarkup(item, accentColor, true)).join('');
  return `<table role="presentation" border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-top:2px solid ${accentColor};"><tr><td style="padding:8px 0 0;">${identityMarkup(presentation)}${details ? `<table role="presentation" border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-top:6px;"><tr><td style="font-family:${FONT};">${details}</td></tr></table>` : ''}</td></tr></table>`;
}

function inline(presentation: EmailSignaturePresentation): string {
  const accentColor = safeColor(presentation.accentColor);
  const items = contactItems(presentation);
  const details = items.map((item) => `<tr><td style="padding:0 0 4px;font-family:${FONT};font-size:12px;line-height:17px;color:#4e5b58;">${text(item.label)}: ${link(item, accentColor)}</td></tr>`).join('');
  return `<table role="presentation" border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse;"><tr><td valign="top" style="padding:0 14px 0 0;">${identityMarkup(presentation)}</td>${details ? `<td valign="top" style="padding:0 0 0 14px;border-left:2px solid ${accentColor};"><table role="presentation" border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">${details}</table></td>` : ''}</tr></table>`;
}

/** Deterministic standalone email fragment: inline styles and presentation tables only. */
export function renderEmailSignatureHtml(presentation: EmailSignaturePresentation): string {
  switch (presentation.templateId) {
    case 'signal': return signal(presentation);
    case 'compact': return compact(presentation);
    case 'inline': return inline(presentation);
  }
}

export function renderEmailSignaturePlainText(presentation: EmailSignaturePresentation): string {
  const lines = [
    presentation.identity.fullName,
    presentation.identity.jobTitle,
    presentation.identity.company,
    ...contactItems(presentation).map((item) => `${item.label}: ${item.text}`),
  ].filter((line): line is string => Boolean(line));
  return lines.join('\n');
}
