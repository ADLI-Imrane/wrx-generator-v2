import { cx } from './ui';

/** The mark is three finder-pattern squares and one data module: a QR code reduced to its signature. */
export function Logo({ className, mono }: { className?: string; mono?: boolean }) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-2 font-display text-[19px] font-bold tracking-tight',
        className,
      )}
    >
      <svg viewBox="0 0 32 32" className="size-7" aria-hidden>
        <rect width="32" height="32" rx="8" className={mono ? 'fill-current' : 'fill-ink dark:fill-accent'} />
        <rect x="6" y="6" width="8" height="8" rx="2" fill="#FFB703" />
        <rect x="18" y="6" width="8" height="8" rx="2" className="fill-white dark:fill-ink" />
        <rect x="6" y="18" width="8" height="8" rx="2" className="fill-white dark:fill-ink" />
        <rect x="18" y="18" width="3.5" height="3.5" rx="1" fill="#FFB703" />
        <rect x="22.5" y="22.5" width="3.5" height="3.5" rx="1" fill="#FFB703" />
      </svg>
      WRX
    </span>
  );
}
