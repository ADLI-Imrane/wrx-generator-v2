import { useId, useMemo, useState } from 'react';
import { m } from 'motion/react';
import type { HomeCopy } from '../content';
import { Eyebrow, SampleTag } from '../ui/primitives';
import { pct, sampleSeries } from '../lib';
import { Counter } from '../motion/Counter';
import { ChartReveal } from '../motion/ChartReveal';

const PERIODS = [7, 30, 90] as const;

function path(values: number[], max: number, w: number, h: number) {
  const step = w / Math.max(values.length - 1, 1);
  return values
    .map(
      (v, i) => `${i === 0 ? 'M' : 'L'}${(i * step).toFixed(1)} ${(h - (v / max) * h).toFixed(1)}`
    )
    .join(' ');
}

export function Signal({ copy }: { copy: HomeCopy }) {
  const s = copy.signal;
  const ids = useId();
  const [period, setPeriod] = useState(1);
  const days = PERIODS[period]!;
  const data = useMemo(() => sampleSeries(days), [days]);
  const totalClicks = data.clicks.reduce((a, b) => a + b, 0);
  const totalScans = data.scans.reduce((a, b) => a + b, 0);
  const max = Math.max(...data.clicks, ...data.scans) * 1.15;
  const W = 640;
  const H = 200;
  const clickPath = path(data.clicks, max, W, H);
  const scanPath = path(data.scans, max, W, H);
  const devices: [string, number][] = [
    [copy.mechanism.track.mobile, 64],
    [copy.mechanism.track.desktop, 29],
    [copy.mechanism.track.tablet, 7],
  ];
  const browsers: [string, number][] = [
    ['Chrome', 48],
    ['Safari', 37],
    ['Firefox', 9],
    ['Edge', 6],
  ];
  const sources: [string, number][] = [
    [s.direct, 41],
    ['Instagram', 27],
    ['Google', 19],
    ['LinkedIn', 13],
  ];

  return (
    <section className="h-signal h-section" aria-labelledby="signal-title">
      <div className="h-wrap">
        <div className="h-signal__head">
          <div>
            <Eyebrow>{s.eyebrow}</Eyebrow>
            <h2 id="signal-title" className="h-title" data-split>
              {s.title}
            </h2>
          </div>
          <div>
            <p className="h-body" data-reveal>
              {s.body}
            </p>
            <p className="h-note" data-reveal>
              {s.note}
            </p>
          </div>
        </div>
        <div className="h-ui h-dash h-spot" data-reveal data-spot>
          <div className="h-dash__top">
            <div className="h-dash__kpis">
              <span className="h-kpi">
                <small>
                  <i className="h-key h-key--clicks" aria-hidden="true" />
                  {s.clicks}
                </small>
                <Counter value={totalClicks} lang={copy.lang} />
              </span>
              <span className="h-kpi">
                <small>
                  <i className="h-key h-key--scans" aria-hidden="true" />
                  {s.scans}
                </small>
                <Counter value={totalScans} lang={copy.lang} />
              </span>
              <SampleTag>{copy.sample}</SampleTag>
            </div>
            <div className="h-period" role="group" aria-label={s.periodLabel}>
              {s.periods.map((label, index) => (
                <button
                  key={label}
                  type="button"
                  className="h-period__btn"
                  aria-pressed={period === index}
                  onClick={() => setPeriod(index)}
                >
                  {period === index ? (
                    <m.span
                      className="h-period__pill"
                      layoutId={`${ids}-pill`}
                      transition={{ type: 'tween', ease: [0.22, 1, 0.36, 1], duration: 0.45 }}
                    />
                  ) : null}
                  <span className="h-period__label">{label}</span>
                </button>
              ))}
            </div>
          </div>
          <ChartReveal className="h-chart">
            <svg
              viewBox={`0 0 ${W} ${H}`}
              preserveAspectRatio="none"
              role="img"
              aria-label={s.chartLabel}
            >
              {[0.25, 0.5, 0.75].map((y) => (
                <line key={y} x1="0" x2={W} y1={H * y} y2={H * y} className="h-chart__grid" />
              ))}
              <path d={`${clickPath} L${W} ${H} L0 ${H} Z`} className="h-chart__area" />
              <path d={clickPath} className="h-chart__line h-chart__line--clicks" />
              <path d={scanPath} className="h-chart__line h-chart__line--scans" />
            </svg>
          </ChartReveal>
          <div className="h-dash__grid">
            {(
              [
                [s.devices, devices],
                [s.browsers, browsers],
                [s.sources, sources],
              ] as const
            ).map(([title, rows]) => (
              <div key={title} className="h-dash__block">
                <span className="h-ui__label">{title}</span>
                <span className="h-bars">
                  {rows.map(([name, value]) => (
                    <span key={name} className="h-bars__row">
                      <span>{name}</span>
                      <span className="h-bars__track">
                        <i style={{ transform: `scaleX(${value / 100})` }} />
                      </span>
                      <span className="h-ui__mono">{pct(copy.lang, value)}</span>
                    </span>
                  ))}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
