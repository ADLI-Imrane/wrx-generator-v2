import { useEffect, useRef } from 'react';
import type { QrDesign } from '@wrx/shared';
import { cx } from './ui';

type QRCodeStylingT = import('qr-code-styling').default;
let ctor: Promise<typeof import('qr-code-styling').default> | null = null;
const load = () => (ctor ??= import('qr-code-styling').then((m) => m.default));

function options(data: string, d: QrDesign, size: number) {
  const fill = d.gradient
    ? {
        gradient: {
          type: 'linear' as const,
          rotation: (d.gradient.rotation * Math.PI) / 180,
          colorStops: [
            { offset: 0, color: d.fg },
            { offset: 1, color: d.gradient.to },
          ],
        },
      }
    : { color: d.fg };
  return {
    width: size,
    height: size,
    type: 'svg' as const,
    data,
    margin: d.margin,
    image: d.logo ?? undefined,
    qrOptions: { errorCorrectionLevel: (d.logo ? 'H' : 'Q') as 'H' | 'Q' },
    imageOptions: { margin: 6, imageSize: 0.32, hideBackgroundDots: true, crossOrigin: 'anonymous' },
    dotsOptions: { type: d.dots, ...fill },
    cornersSquareOptions: { type: d.corners, ...fill },
    cornersDotOptions: { type: d.corners === 'square' ? ('square' as const) : ('dot' as const), ...fill },
    backgroundOptions: { color: d.bg },
  };
}

/** Live, framed QR preview. The frame is plain markup so it stays crisp at any size. */
export function QrPreview({
  data,
  design,
  size = 240,
  className,
}: {
  data: string;
  design: QrDesign;
  size?: number;
  className?: string;
}) {
  const host = useRef<HTMLDivElement>(null);
  const inst = useRef<QRCodeStylingT | null>(null);
  useEffect(() => {
    let alive = true;
    load().then((QR) => {
      if (!alive || !host.current) return;
      if (!inst.current) {
        inst.current = new QR(options(data, design, size));
        host.current.innerHTML = '';
        inst.current.append(host.current);
      } else inst.current.update(options(data, design, size));
    });
    return () => {
      alive = false;
    };
  }, [data, design, size]);
  return (
    <figure
      className={cx(
        'inline-grid justify-items-center overflow-hidden',
        design.frame !== 'none' && 'rounded-[18px] p-3 pb-0 shadow-[var(--shadow-lift)]',
        className,
      )}
      style={
        design.frame !== 'none'
          ? {
              background: design.frame === 'ticket' ? design.fg : design.bg,
              border: `2px solid ${design.fg}`,
            }
          : undefined
      }
    >
      <div
        ref={host}
        className="overflow-hidden rounded-lg [&_svg]:block"
        style={{ width: size, height: size, background: design.bg }}
        aria-label="QR code"
        role="img"
      />
      {design.frame !== 'none' && (
        <figcaption
          className="w-full py-2.5 text-center font-display text-[17px] font-semibold"
          style={{ color: design.frame === 'ticket' ? design.bg : design.fg }}
        >
          {design.frameText}
        </figcaption>
      )}
    </figure>
  );
}

/** Exports the QR (with its frame, if any) as PNG or SVG. */
export async function downloadQr(data: string, design: QrDesign, name: string, ext: 'png' | 'svg') {
  const QR = await load();
  const size = 1024;
  const qr = new QR({ ...options(data, design, size), type: ext === 'svg' ? 'svg' : 'canvas' });
  const file = name.replace(/[^\w-]+/g, '-').toLowerCase() || 'qr-code';
  if (ext === 'svg' || design.frame === 'none') return qr.download({ name: file, extension: ext });
  const blob = (await qr.getRawData('png')) as Blob;
  const img = await createImageBitmap(blob);
  const pad = 48,
    label = 150;
  const canvas = Object.assign(document.createElement('canvas'), {
    width: size + pad * 2,
    height: size + pad + label,
  });
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = design.frame === 'ticket' ? design.fg : design.bg;
  ctx.beginPath();
  ctx.roundRect(0, 0, canvas.width, canvas.height, 64);
  ctx.fill();
  ctx.drawImage(img, pad, pad);
  ctx.fillStyle = design.frame === 'ticket' ? design.bg : design.fg;
  ctx.font = '600 72px "Bricolage Grotesque Variable", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(design.frameText, canvas.width / 2, size + pad + 98);
  const a = Object.assign(document.createElement('a'), {
    href: canvas.toDataURL('image/png'),
    download: `${file}.png`,
  });
  a.click();
}
