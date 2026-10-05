import { useEffect, useMemo, useState } from 'react';
import { geoNaturalEarth1, geoPath } from 'd3-geo';
import type { Breakdown } from '@wrx/shared';
import { useT } from '@/lib/i18n';
import { countryName, nf } from '@/lib/format';
import { NUMERIC_TO_ALPHA2 } from '@/lib/iso';

type Geo = { type: 'Feature'; id: string; geometry: unknown; properties: { name: string } };

/** Choropleth of clicks per country. Topology loads lazily, so the dashboard paints before the map. */
export function WorldMap({ data }: { data: Breakdown[] }) {
  const { lang, t } = useT();
  const [features, setFeatures] = useState<Geo[] | null>(null);
  const [hover, setHover] = useState<{ cc: string; v: number } | null>(null);
  useEffect(() => {
    Promise.all([import('topojson-client'), import('world-atlas/countries-110m.json')]).then(
      ([topo, world]) => {
        const w = (world as { default?: unknown }).default ?? world;
        const fc = topo.feature(
          w as never,
          (w as { objects: { countries: never } }).objects.countries,
        ) as unknown as { features: Geo[] };
        setFeatures(fc.features.filter((f) => f.properties.name !== 'Antarctica'));
      },
    );
  }, []);
  const values = useMemo(() => new Map(data.map((d) => [d.key, d.value])), [data]);
  const max = Math.max(1, ...data.map((d) => d.value));
  const path = useMemo(
    () => geoPath(geoNaturalEarth1().fitSize([800, 400], { type: 'Sphere' } as never)),
    [],
  );

  return (
    <div className="relative">
      <svg viewBox="0 0 800 400" className="w-full" role="img" aria-label={t('Clicks by country')}>
        {features?.map((f) => {
          const cc = NUMERIC_TO_ALPHA2[f.id] ?? '';
          const v = values.get(cc) ?? 0;
          return (
            <path
              key={f.id}
              d={path(f as never) ?? ''}
              strokeWidth=".5"
              stroke="var(--surface)"
              fill={
                v
                  ? `color-mix(in oklab, var(--accent) ${18 + Math.round(Math.sqrt(v / max) * 82)}%, var(--raised))`
                  : 'var(--raised)'
              }
              onMouseEnter={() => setHover({ cc, v })}
              onMouseLeave={() => setHover(null)}
              className="transition-[fill] duration-300"
            />
          );
        })}
      </svg>
      {hover?.cc && (
        <div className="pointer-events-none absolute left-3 top-3 rounded-lg border border-line bg-surface px-3 py-1.5 text-[12.5px] shadow-[var(--shadow-lift)]">
          <span className="font-medium">{countryName(hover.cc, lang)}</span>{' '}
          <span className="tabular text-muted">· {t('{n} clicks', { n: nf(hover.v, lang) })}</span>
        </div>
      )}
    </div>
  );
}
