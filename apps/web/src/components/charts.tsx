import { useId, useMemo, useState } from 'react';
import type { Breakdown } from '@wrx/shared';
import { useT } from '@/lib/i18n';
import { nf } from '@/lib/format';
import { cx } from './ui';

/** Area chart for clicks over time, with QR scans stacked as a second band. Hand-rolled SVG, no chart library. */
export function AreaChart({
  series,
  hourly,
}: {
  series: { t: string; clicks: number; qr: number }[];
  hourly?: boolean;
}) {
  const { lang, t } = useT();
  const id = useId();
  const [hover, setHover] = useState<number | null>(null);
  const W = 720,
    H = 220,
    P = { l: 36, r: 8, t: 12, b: 26 };
  const max = Math.max(4, ...series.map((s) => s.clicks));
  const nice = Math.ceil(max / 4) * 4;
  const x = (i: number) => P.l + (i * (W - P.l - P.r)) / Math.max(1, series.length - 1);
  const y = (v: number) => H - P.b - (v / nice) * (H - P.t - P.b);
  const line = (k: 'clicks' | 'qr') =>
    series.map((s, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(s[k]).toFixed(1)}`).join('');
  const area = (k: 'clicks' | 'qr') => `${line(k)}L${x(series.length - 1)},${H - P.b}L${x(0)},${H - P.b}Z`;
  const label = (iso: string) =>
    hourly ? iso.slice(11, 16) : new Date(iso).toLocaleDateString(lang, { day: 'numeric', month: 'short' });
  const ticks = useMemo(() => {
    const n = Math.min(6, series.length);
    return Array.from({ length: n }, (_, i) => Math.round((i * (series.length - 1)) / Math.max(1, n - 1)));
  }, [series.length]);
  const h = hover !== null ? series[hover] : null;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label={t('Clicks over time')}
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const px = ((e.clientX - r.left) / r.width) * W;
          setHover(
            Math.max(
              0,
              Math.min(series.length - 1, Math.round(((px - P.l) / (W - P.l - P.r)) * (series.length - 1))),
            ),
          );
        }}
      >
        <defs>
          <linearGradient id={`${id}a`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="var(--accent)" stopOpacity=".28" />
            <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3, 4].map((i) => (
          <g key={i}>
            <line
              x1={P.l}
              x2={W - P.r}
              y1={y((nice / 4) * i)}
              y2={y((nice / 4) * i)}
              stroke="var(--line)"
              strokeDasharray={i ? '3 4' : undefined}
            />
            <text
              x={P.l - 8}
              y={y((nice / 4) * i) + 4}
              textAnchor="end"
              className="fill-faint text-[9px] tabular"
            >
              {nf((nice / 4) * i, lang)}
            </text>
          </g>
        ))}
        <path d={area('clicks')} fill={`url(#${id}a)`} />
        <path
          d={line('clicks')}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        <path
          d={line('qr')}
          fill="none"
          stroke="var(--muted)"
          strokeWidth="2"
          strokeDasharray="5 4"
          strokeLinejoin="round"
        />
        {ticks.map((i) => (
          <text key={i} x={x(i)} y={H - 6} textAnchor="middle" className="fill-faint text-[9px]">
            {series[i] && label(series[i].t)}
          </text>
        ))}
        {h && hover !== null && (
          <g>
            <line
              x1={x(hover)}
              x2={x(hover)}
              y1={P.t}
              y2={H - P.b}
              stroke="var(--faint)"
              strokeDasharray="2 3"
            />
            <circle
              cx={x(hover)}
              cy={y(h.clicks)}
              r="4.5"
              fill="var(--surface)"
              stroke="var(--accent)"
              strokeWidth="2.2"
            />
          </g>
        )}
      </svg>
      {h && hover !== null && (
        <div
          className="pointer-events-none absolute top-0 rounded-lg border border-line bg-surface px-3 py-2 text-[12.5px] shadow-[var(--shadow-lift)]"
          style={{ left: `clamp(0px, calc(${(x(hover) / W) * 100}% - 70px), calc(100% - 140px))` }}
        >
          <div className="font-medium">{label(h.t)}</div>
          <div className="tabular text-muted">
            {t('{n} clicks', { n: nf(h.clicks, lang) })} · {t('{n} scans', { n: nf(h.qr, lang) })}
          </div>
        </div>
      )}
      <div className="mt-2 flex gap-4 text-[12.5px] text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded bg-accent" />
          {t('All clicks')}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded border-t-2 border-dashed border-muted" />
          {t('QR scans')}
        </span>
      </div>
    </div>
  );
}

/** Ranked horizontal bars — the workhorse of every breakdown. */
export function BarList({
  items,
  total,
  format = (k) => k,
  empty,
  max = 6,
}: {
  items: Breakdown[];
  total?: number;
  format?: (key: string) => React.ReactNode;
  empty?: string;
  max?: number;
}) {
  const { lang, t } = useT();
  const sum = total ?? items.reduce((s, i) => s + i.value, 0);
  const top = items[0]?.value ?? 1;
  if (!items.length)
    return <p className="py-6 text-center text-[13px] text-faint">{empty ?? t('No data yet')}</p>;
  return (
    <ul className="grid gap-1.5">
      {items.slice(0, max).map((i) => (
        <li
          key={i.key}
          className="relative flex h-9 items-center justify-between gap-3 overflow-hidden rounded-lg px-3 text-[13.5px]"
        >
          <span
            className="absolute inset-y-0 left-0 rounded-lg bg-accent-soft transition-[width] duration-500"
            style={{ width: `${(i.value / top) * 100}%` }}
            aria-hidden
          />
          <span className="relative truncate">{format(i.key)}</span>
          <span className="relative tabular text-muted">
            {nf(i.value, lang)}{' '}
            <span className="text-faint">· {Math.round((i.value / Math.max(1, sum)) * 100)}%</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

export function Stat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: React.ReactNode;
  tone?: 'up' | 'down';
}) {
  return (
    <div className="card grid gap-1 p-4">
      <span className="text-[13px] text-muted">{label}</span>
      <span className="text-[28px] font-semibold tracking-[-0.035em] leading-none tabular">{value}</span>
      {sub && (
        <span
          className={cx(
            'text-[12.5px]',
            tone === 'up' ? 'text-mint' : tone === 'down' ? 'text-coral' : 'text-faint',
          )}
        >
          {sub}
        </span>
      )}
    </div>
  );
}
