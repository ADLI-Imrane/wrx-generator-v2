type ClipboardPort = Pick<Clipboard, 'writeText'> & Partial<Pick<Clipboard, 'write'>>;
type ClipboardItemConstructor = new (items: Record<string, Blob>) => ClipboardItem;

interface ClipboardRuntime {
  clipboard?: ClipboardPort;
  ClipboardItem?: ClipboardItemConstructor;
  Blob?: typeof Blob;
  document?: Document;
}

function runtime(): ClipboardRuntime {
  return {
    clipboard: typeof navigator === 'undefined' ? undefined : navigator.clipboard,
    ClipboardItem: typeof window === 'undefined' ? undefined : window.ClipboardItem,
    Blob: typeof window === 'undefined' ? undefined : window.Blob,
    document: typeof window === 'undefined' ? undefined : window.document,
  };
}

async function copyText(value: string, platform: ClipboardRuntime): Promise<void> {
  if (platform.clipboard?.writeText) {
    try {
      await platform.clipboard.writeText(value);
      return;
    } catch {
      // Use the legacy browser selection fallback when clipboard permissions deny writeText.
    }
  }
  const doc = platform.document;
  if (!doc?.body || !doc.execCommand) throw new Error('Clipboard is unavailable');
  const textarea = doc.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  doc.body.appendChild(textarea);
  textarea.select();
  const copied = doc.execCommand('copy');
  textarea.remove();
  if (!copied) throw new Error('Clipboard is unavailable');
}

export type SignatureCopyMode = 'rich' | 'plain';

export async function copyEmailSignature(html: string, plainText: string, platform = runtime()): Promise<SignatureCopyMode> {
  if (platform.clipboard?.write && platform.ClipboardItem && platform.Blob) {
    try {
      const item = new platform.ClipboardItem({
        'text/html': new platform.Blob([html], { type: 'text/html' }),
        'text/plain': new platform.Blob([plainText], { type: 'text/plain' }),
      });
      await platform.clipboard.write([item]);
      return 'rich';
    } catch {
      // If rich clipboard write is unavailable/denied, report the plain-text result honestly.
    }
  }
  await copyText(plainText, platform);
  return 'plain';
}

export async function copyEmailSignatureHtml(html: string, platform = runtime()): Promise<void> {
  await copyText(html, platform);
}
