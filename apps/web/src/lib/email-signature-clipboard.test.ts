import { describe, expect, it, vi } from 'vitest';
import { copyEmailSignature, copyEmailSignatureHtml } from './email-signature-clipboard';

describe('Email Signature clipboard helpers', () => {
  it('copies rich HTML and plain text together when supported', async () => {
    const write = vi.fn().mockResolvedValue(undefined);
    const clipboard = { write, writeText: vi.fn() } as unknown as Clipboard;
    class FakeClipboardItem { constructor(readonly values: Record<string, Blob>) {} }
    class FakeBlob { constructor(readonly parts: BlobPart[], readonly options?: BlobPropertyBag) {} }
    const mode = await copyEmailSignature('<table>signature</table>', 'signature', {
      clipboard,
      ClipboardItem: FakeClipboardItem as unknown as typeof ClipboardItem,
      Blob: FakeBlob as unknown as typeof Blob,
    });
    expect(mode).toBe('rich');
    expect(write).toHaveBeenCalledTimes(1);
    const item = write.mock.calls[0]![0][0] as unknown as FakeClipboardItem;
    expect((item.values['text/html'] as unknown as FakeBlob).parts).toEqual(['<table>signature</table>']);
    expect((item.values['text/plain'] as unknown as FakeBlob).parts).toEqual(['signature']);
  });

  it('falls back to plain text when rich clipboard support is unavailable', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const mode = await copyEmailSignature('<b>signature</b>', 'signature', { clipboard: { writeText } as unknown as Clipboard });
    expect(mode).toBe('plain');
    expect(writeText).toHaveBeenCalledWith('signature');
  });

  it('surfaces a clipboard failure when neither writeText nor the DOM fallback is available', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('permission denied'));
    await expect(copyEmailSignature('<b>signature</b>', 'signature', { clipboard: { writeText } as unknown as Clipboard })).rejects.toThrow('Clipboard is unavailable');
  });

  it('copies only the generated HTML source for the secondary action', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    await copyEmailSignatureHtml('<table>standalone</table>', { clipboard: { writeText } as unknown as Clipboard });
    expect(writeText).toHaveBeenCalledWith('<table>standalone</table>');
  });
});
