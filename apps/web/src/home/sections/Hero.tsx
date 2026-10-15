import type { HomeCopy } from '../content';
import { demo } from '../content';
import { Arrow, Fig, Qr } from '../ui/primitives';

export function LinkCard({ copy, destination }: { copy: HomeCopy; destination: string }) {
  return (
    <div className="h-ui h-linkcard">
      <div className="h-ui__row">
        <span className="h-ui__label">{copy.hero.linkLabel}</span>
        <span className="h-pill h-pill--ok">
          <span className="h-dot" aria-hidden="true" />
          {copy.hero.active}
        </span>
      </div>
      <p className="h-linkcard__url">{demo.link}</p>
      <div className="h-ui__rule" />
      <div className="h-ui__row">
        <span className="h-ui__label">{copy.hero.destinationLabel}</span>
        <span className="h-ui__ghost">{copy.hero.edit}</span>
      </div>
      <p className="h-linkcard__dest">{destination}</p>
    </div>
  );
}

export function Hero({ copy }: { copy: HomeCopy }) {
  const after = copy.lang === 'fr' ? demo.after : demo.afterEn;
  return (
    <section className="h-hero" aria-labelledby="hero-title">
      <div className="h-hero__art" aria-hidden="true">
        <picture className="h-hero__glass">
          <source
            media="(max-width: 767px)"
            type="image/avif"
            srcSet="/media/home/hero-glass-square-720.avif 720w, /media/home/hero-glass-square-1080.avif 1080w"
            sizes="100vw"
            width={1080}
            height={1080}
          />
          <source
            media="(max-width: 767px)"
            type="image/webp"
            srcSet="/media/home/hero-glass-square-720.webp 720w, /media/home/hero-glass-square-1080.webp 1080w"
            sizes="100vw"
            width={1080}
            height={1080}
          />
          <source
            type="image/avif"
            srcSet="/media/home/hero-glass-1280.avif 1280w, /media/home/hero-glass-2048.avif 2048w"
            sizes="72vw"
          />
          <source
            type="image/webp"
            srcSet="/media/home/hero-glass-1280.webp 1280w, /media/home/hero-glass-2048.webp 2048w"
            sizes="72vw"
          />
          <img
            src="/media/home/hero-glass-1280.webp"
            width={2048}
            height={1158}
            alt=""
            decoding="async"
            {...({ fetchpriority: 'high' } as Record<string, string>)}
          />
        </picture>
      </div>
      <div className="h-wrap h-hero__grid">
        <div className="h-hero__copy">
          <p className="h-eyebrow h-eyebrow--plain">{copy.hero.eyebrow}</p>
          <h1 id="hero-title" className="h-display">
            <span>{copy.hero.title[0]}</span>
            <span className="h-accent">{copy.hero.title[1]}</span>
          </h1>
          <p className="h-lede">{copy.hero.body}</p>
          <div className="h-hero__actions">
            <a className="h-textlink h-textlink--lg" href="#mecanisme">
              {copy.hero.secondary}
              <Arrow className="h-arrow--down" />
            </a>
          </div>
        </div>
        <figure className="h-hero__stage" aria-label={copy.hero.fig}>
          <div className="h-hero__card" data-settle="1">
            <LinkCard copy={copy} destination={after} />
          </div>
          <div className="h-hero__plate" data-settle="2">
            <div className="h-ui h-plate">
              <Qr value={demo.managedQr} size={132} />
              <span className="h-plate__label">{copy.hero.managed}</span>
            </div>
          </div>
          <div className="h-hero__toast" data-settle="3">
            <span className="h-ui h-toast">
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="m3.5 8.5 3 3 6-7" fill="none" stroke="currentColor" strokeWidth="1.8" />
              </svg>
              {copy.hero.toast}
            </span>
          </div>
          <figcaption>
            <Fig>{copy.hero.fig}</Fig>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
