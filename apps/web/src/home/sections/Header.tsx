import type { HomeCopy } from '../content';
import { homePaths } from '../content';
import { WrxMark } from '../ui/primitives';

export function Header({ copy }: { copy: HomeCopy }) {
  const other = copy.lang === 'fr' ? 'en' : 'fr';
  return (
    <header className="h-header" data-header>
      <a className="h-skip" href="#contenu">
        {copy.nav.skip}
      </a>
      <div className="h-header__bar">
        <a className="h-brand" href={homePaths[copy.lang]} aria-label={copy.nav.home}>
          <WrxMark className="h-brand__mark" />
          <span className="h-brand__word">WRX</span>
        </a>
        <nav className="h-nav" aria-label={copy.nav.label}>
          <a className="h-nav__link h-hide-md" href="#mecanisme">
            {copy.nav.howItWorks}
          </a>
          <a className="h-nav__link h-hide-md" href="#essai">
            {copy.nav.tryIt}
          </a>
          <a
            className="h-nav__link h-nav__lang"
            href={homePaths[other]}
            hrefLang={other}
            lang={other}
            aria-label={copy.nav.switchLabel}
          >
            {copy.nav.switchTo}
          </a>
          <a className="h-nav__link h-hide-xs" href="/login">
            {copy.nav.login}
          </a>
          <a className="h-btn h-btn--primary h-btn--sm" href="/register">
            <span className="h-hide-sm">{copy.nav.cta}</span>
            <span className="h-show-sm">{copy.nav.ctaShort}</span>
          </a>
        </nav>
      </div>
    </header>
  );
}
