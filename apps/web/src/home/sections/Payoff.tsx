import { useState } from 'react';
import type { ReactNode } from 'react';
import type { HomeCopy } from '../content';
import { Eyebrow } from '../ui/primitives';
import { proofLogos, proofQuotes } from '../proof';

const glyphs: ReactNode[] = [
  <path
    key="l"
    d="M9 15l6-6M7.5 11.5 5 14a3.5 3.5 0 0 0 5 5l2.5-2.5M16.5 12.5 19 10a3.5 3.5 0 0 0-5-5l-2.5 2.5"
  />,
  <path
    key="q"
    d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 18h2v2h-2zM14 18h2M18 14h2"
  />,
  <path key="a" d="M4 19h16M7 16V11M12 16V6M17 16v-3" />,
  <path key="b" d="M3 6h18v12H3zM7 10h6M7 13h4M16 10h2v4h-2z" />,
  <path key="d" d="M7 3h10v18H7zM10 7a2 2 0 1 0 4 0 2 2 0 1 0-4 0M9.5 12.5h5M11 18h2" />,
  <path key="s" d="M3 6h18v12H3zM3 7l9 6 9-6" />,
  <path key="p" d="M6 11h12v9H6zM9 11V8a3 3 0 0 1 6 0v3M12 14.5v2" />,
  <path key="w" d="M4 5h16v14H4zM9 5v14M12 9h5M12 12h5" />,
];

function ProofSlot({ copy }: { copy: HomeCopy }) {
  const [paused, setPaused] = useState(false);
  if (proofLogos.length === 0 && proofQuotes.length === 0) return null;
  return (
    <div className="h-proof" data-reveal>
      {proofLogos.length > 0 ? (
        <button
          type="button"
          className="h-btn h-btn--ghost h-btn--sm h-marquee__toggle"
          aria-pressed={paused}
          onClick={() => setPaused(!paused)}
        >
          {paused ? copy.payoff.play : copy.payoff.pause}
        </button>
      ) : null}
      {proofLogos.length > 0 ? (
        <div className="h-marquee" data-paused={paused || undefined}>
          <ul className="h-marquee__track">
            {proofLogos.map((logo) => (
              <li key={logo.name}>
                <img
                  src={logo.src}
                  alt={logo.name}
                  width={logo.width}
                  height={logo.height}
                  loading="lazy"
                />
              </li>
            ))}
          </ul>
          <ul className="h-marquee__track" aria-hidden="true">
            {proofLogos.map((logo) => (
              <li key={logo.name}>
                <img src={logo.src} alt="" width={logo.width} height={logo.height} loading="lazy" />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {proofQuotes.map((item) => (
        <figure key={item.name} className="h-quote">
          <blockquote>{item.quote[copy.lang]}</blockquote>
          <figcaption>
            {item.name} · {item.role[copy.lang]}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

export function Payoff({ copy }: { copy: HomeCopy }) {
  const p = copy.payoff;
  return (
    <section className="h-payoff h-section" aria-labelledby="payoff-title">
      <div className="h-wrap">
        <div className="h-payoff__head">
          <div>
            <Eyebrow>{p.eyebrow}</Eyebrow>
            <h2 id="payoff-title" className="h-title" data-split>
              {p.title}
            </h2>
          </div>
          <p className="h-body" data-reveal>
            {p.body}
          </p>
        </div>
        <ul className="h-bento" data-spot-group>
          {p.tiles.map((tile, index) => (
            <li key={tile.title} className="h-bento__tile h-spot" data-reveal data-stagger>
              <svg className="h-bento__glyph" viewBox="0 0 24 24" aria-hidden="true">
                {glyphs[index]}
              </svg>
              <h3 className="h-bento__title">{tile.title}</h3>
              <p className="h-bento__body">{tile.body}</p>
            </li>
          ))}
        </ul>
        <ProofSlot copy={copy} />
      </div>
    </section>
  );
}
