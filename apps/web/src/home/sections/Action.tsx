import type { HomeCopy } from '../content';
import { homePaths } from '../content';
import { Arrow, Eyebrow, Picture } from '../ui/primitives';
import { Magnetic } from '../motion/Magnetic';

export function Action({ copy }: { copy: HomeCopy }) {
  const a = copy.action;
  const other = copy.lang === 'fr' ? 'en' : 'fr';
  return (
    <>
      <section className="h-action h-section" aria-labelledby="action-title">
        <div className="h-wrap h-action__grid">
          <div className="h-action__copy">
            <Eyebrow>{a.eyebrow}</Eyebrow>
            <h2 id="action-title" className="h-display h-display--action" data-split>
              {a.title}
            </h2>
            <p className="h-lede" data-reveal>
              {a.body}
            </p>
            <Magnetic>
              <a className="h-btn h-btn--primary h-btn--lg" href="/register">
                <span>{copy.nav.cta}</span>
                <Arrow />
              </a>
            </Magnetic>
          </div>
          <div className="h-action__art" aria-hidden="true" data-float>
            <Picture
              name="w-glass"
              widths={[640, 1024]}
              sizes="(min-width: 768px) 36vw, 70vw"
              width={1024}
              height={1016}
            />
          </div>
        </div>
      </section>
      <footer className="h-footer">
        <div className="h-wrap">
          <div className="h-footer__row">
            <span className="h-footer__tag">{a.footerTagline}</span>
            <nav className="h-footer__nav" aria-label="WRX">
              <a href="/login">{copy.nav.login}</a>
              <a href={homePaths[other]} hrefLang={other} lang={other}>
                {copy.nav.switchLabel}
              </a>
              <span>{a.rights}</span>
            </nav>
          </div>
          <p className="h-wordmark" aria-hidden="true">
            WRX
          </p>
        </div>
      </footer>
    </>
  );
}
