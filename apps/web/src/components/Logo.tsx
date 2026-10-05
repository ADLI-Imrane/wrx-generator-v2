import { cx } from './ui';

/** The mark: three finder squares of a QR code and one accent module — a code reduced to its signature. */
export function Logo({ className, mono }: { className?: string; mono?: boolean }) {
  return (
    <span className={cx('inline-flex items-center gap-2 text-[16px] font-semibold tracking-[-0.04em]', className)}>
      <svg viewBox="0 0 24 24" className="size-[22px]" aria-hidden>
        <rect width="24" height="24" rx="6" className="fill-fg" />
        <rect x="4.5" y="4.5" width="6" height="6" rx="1.6" className="fill-bg" />
        <rect x="13.5" y="4.5" width="6" height="6" rx="1.6" className="fill-bg" />
        <rect x="4.5" y="13.5" width="6" height="6" rx="1.6" className="fill-bg" />
        <rect x="14.25" y="14.25" width="4.5" height="4.5" rx="2.25" className={mono ? 'fill-bg' : 'fill-accent'} />
      </svg>
      wrx
    </span>
  );
}
