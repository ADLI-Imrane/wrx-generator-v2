import type { ReactNode } from 'react';
import { QRCodeSVG } from 'qrcode.react';

export const INK = '#0e1726';
export const PAPER = '#f6f4ef';

/** Small uppercase mono label that sits on the thread. */
export function Eyebrow({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <p className="h-eyebrow" id={id}>
      <span className="h-knot" aria-hidden="true" />
      {children}
    </p>
  );
}

/** Linear-style figure caption under an interface piece. */
export function Fig({ children }: { children: ReactNode }) {
  return <p className="h-fig">{children}</p>;
}

export function SampleTag({ children }: { children: ReactNode }) {
  return <span className="h-sample">{children}</span>;
}

export function Qr({
  value,
  size = 160,
  fg = INK,
  bg = '#ffffff',
  label,
  className = '',
}: {
  value: string;
  size?: number;
  fg?: string;
  bg?: string;
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={`h-qr ${className}`.trim()}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      data-payload={value}
    >
      <QRCodeSVG
        aria-hidden="true"
        value={value}
        size={size}
        level="M"
        marginSize={2}
        fgColor={fg}
        bgColor={bg}
      />
    </span>
  );
}

interface PictureProps {
  name: string;
  widths: number[];
  sizes: string;
  width: number;
  height: number;
  alt?: string;
  priority?: boolean;
  className?: string;
}

/** Responsive AVIF/WebP picture for the generated media in /media/home. */
export function Picture({
  name,
  widths,
  sizes,
  width,
  height,
  alt = '',
  priority = false,
  className = '',
}: PictureProps) {
  const set = (ext: string) =>
    widths.map((w) => `/media/home/${name}-${w}.${ext} ${w}w`).join(', ');
  return (
    <picture className={className}>
      <source type="image/avif" srcSet={set('avif')} sizes={sizes} />
      <source type="image/webp" srcSet={set('webp')} sizes={sizes} />
      <img
        src={`/media/home/${name}-${widths[0]}.webp`}
        width={width}
        height={height}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        // React 18 only forwards the lowercase attribute.
        {...((priority ? { fetchpriority: 'high' } : {}) as Record<string, string>)}
      />
    </picture>
  );
}

export function Arrow({ className = '' }: { className?: string }) {
  return (
    <svg className={`h-arrow ${className}`.trim()} viewBox="0 0 16 16" aria-hidden="true">
      <path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function WrxMark({ className = '' }: { className?: string }) {
  return (
    <img
      className={className}
      src="/brand/wrx-logo.png"
      width={36}
      height={28}
      alt=""
      decoding="async"
    />
  );
}
