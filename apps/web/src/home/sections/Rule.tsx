import type { HomeCopy } from '../content';
import { demo } from '../content';
import { Eyebrow, Fig, Qr } from '../ui/primitives';

export function Rule({ copy }: { copy: HomeCopy }) {
  const t = copy.rule;
  const before = copy.lang === 'fr' ? demo.before : demo.beforeEn;
  const after = copy.lang === 'fr' ? demo.after : demo.afterEn;
  return (
    <section className="h-rule h-scene h-dark" aria-labelledby="rule-title" data-scene="rule">
      <div className="h-scene__pin">
        <div className="h-rule__media" aria-hidden="true">
          <video
            className="h-rule__video"
            data-loop-video
            muted
            loop
            playsInline
            preload="none"
            poster="/media/home/night-glass-1280.webp"
          >
            <source src="/media/home/night-loop.webm" type="video/webm" />
            <source src="/media/home/night-loop.mp4" type="video/mp4" />
          </video>
        </div>
        <div className="h-wrap h-rule__grid">
          <div className="h-rule__copy">
            <Eyebrow>{t.eyebrow}</Eyebrow>
            <h2 id="rule-title" className="h-title" data-split>
              <span>{t.title[0]}</span> <span className="h-accent">{t.title[1]}</span>
            </h2>
            <p className="h-body" data-reveal>
              {t.body}
            </p>
            <ol className="h-steps">
              {t.steps.map((step, index) => (
                <li key={step} className="h-steps__item" data-rule-step={index}>
                  <span className="h-steps__n">{String(index + 1).padStart(2, '0')}</span>
                  <span className="h-steps__text">{step}</span>
                </li>
              ))}
            </ol>
          </div>
          <figure className="h-rule__stage" aria-label={t.fig}>
            <div className="h-ui h-ui--dark h-edit" data-rule-form>
              <p className="h-edit__title">{t.editTitle}</p>
              <span className="h-ui__label">{t.destinationField}</span>
              <span className="h-field">
                <span className="h-field__value h-field__value--old" data-rule-old>
                  https://{before}
                </span>
                <span className="h-field__value h-field__value--new" data-rule-new>
                  https://{after}
                  <i className="h-caret" aria-hidden="true" />
                </span>
              </span>
              <span className="h-edit__actions">
                <span className="h-btn h-btn--onDark h-btn--sm" data-rule-save>
                  {t.save}
                </span>
                <span className="h-edit__saved" data-rule-saved>
                  {t.saved}
                </span>
              </span>
            </div>
            <div className="h-ui h-ui--dark h-plate h-plate--dark" data-rule-qr>
              <Qr value={demo.managedQr} size={128} />
              <span className="h-plate__label">{t.qrLabel}</span>
              <span className="h-plate__state">{t.qrState}</span>
            </div>
            <div className="h-route" data-rule-route>
              <span className="h-route__node">{t.route[0]}</span>
              <span className="h-route__wire" aria-hidden="true" />
              <span className="h-route__node">
                {t.route[1]}
                <small>{demo.link}</small>
              </span>
              <span className="h-route__wire" aria-hidden="true" />
              <span className="h-route__node h-route__node--dest">
                {t.route[2]}
                <span className="h-route__swap">
                  <small className="h-route__old" data-rule-route-old>
                    {before}
                  </small>
                  <small className="h-route__new" data-rule-route-new>
                    {after}
                  </small>
                </span>
              </span>
            </div>
            <figcaption>
              <Fig>{t.fig}</Fig>
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
