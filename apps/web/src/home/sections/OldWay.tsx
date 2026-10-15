import type { HomeCopy } from '../content';
import { demo } from '../content';
import { Eyebrow, Fig, Picture, Qr } from '../ui/primitives';

export function OldWay({ copy }: { copy: HomeCopy }) {
  const t = copy.oldWay;
  const before = copy.lang === 'fr' ? demo.before : demo.beforeEn;
  return (
    <section className="h-old h-scene" aria-labelledby="old-title" data-scene="old">
      <div className="h-scene__pin">
        <div className="h-wrap h-old__grid">
          <div className="h-old__copy">
            <Eyebrow>{t.eyebrow}</Eyebrow>
            <h2 id="old-title" className="h-title" data-split>
              {t.title}
            </h2>
            <p className="h-body" data-reveal>
              {t.body}
            </p>
          </div>
          <figure className="h-old__stage" aria-label={t.fig}>
            <div className="h-old__photo" data-old-photo>
              <Picture
                name="flyers"
                widths={[1280, 2048]}
                sizes="(min-width: 768px) 56vw, 100vw"
                width={2048}
                height={1170}
              />
              <span className="h-old__qr" data-old-qr>
                <Qr value={`https://${before}`} size={120} bg="#fbfaf7" />
              </span>
            </div>
            <ol className="h-old__states">
              <li className="h-old__state h-old__state--before" data-old-before>
                <span className="h-ui__label">{t.before}</span>
                <div className="h-ui h-phone">
                  <span className="h-phone__bar">{before}</span>
                  <span className="h-phone__page" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                  </span>
                </div>
              </li>
              <li className="h-old__state h-old__state--after" data-old-after>
                <span className="h-ui__label">{t.after}</span>
                <div className="h-ui h-phone h-phone--dead">
                  <span className="h-phone__bar">
                    <s>{before}</s>
                  </span>
                  <span className="h-phone__error">
                    <strong data-old-stamp>{t.notFound}</strong>
                    <span>{t.notFoundBody}</span>
                  </span>
                </div>
                <p className="h-old__meta">
                  <span>
                    {t.scans}
                    {copy.lang === 'fr' ? ' : ' : ': '}
                    <em>{t.scansUnknown}</em>
                  </span>
                  <span>{t.reprint}</span>
                </p>
              </li>
            </ol>
            <figcaption>
              <Fig>{t.fig}</Fig>
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
