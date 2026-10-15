import type { HomeCopy } from '../content';
import { demo } from '../content';
import { Eyebrow, Fig, Qr, SampleTag } from '../ui/primitives';
import { pct } from '../lib';

function Toggle({ on = true }: { on?: boolean }) {
  return <span className={`h-toggle${on ? 'is-on' : ''}`} aria-hidden="true" />;
}

function CreateUi({ copy }: { copy: HomeCopy }) {
  const c = copy.mechanism.create;
  const after = copy.lang === 'fr' ? demo.after : demo.afterEn;
  return (
    <div className="h-ui h-form">
      <span className="h-ui__label">{c.destination}</span>
      <span className="h-field h-field--light">https://{after}</span>
      <span className="h-ui__row h-form__toggle">
        <span>{c.customSlug}</span>
        <Toggle />
      </span>
      <span className="h-ui__label">{c.slug}</span>
      <span className="h-field h-field--light h-field--split">
        <span className="h-field__prefix">wrx.example/r/</span>
        <span className="h-field__strong">
          {demo.slug}
          <i className="h-caret h-caret--ink" aria-hidden="true" />
        </span>
      </span>
      <span className="h-btn h-btn--primary h-btn--sm h-form__submit">{c.submit}</span>
    </div>
  );
}

function ShareUi({ copy }: { copy: HomeCopy }) {
  const s = copy.mechanism.share;
  return (
    <div className="h-ui h-share">
      <span className="h-seg">
        <span>{s.direct}</span>
        <span className="is-on">{s.managed}</span>
      </span>
      <div className="h-share__body">
        <Qr value={demo.managedQr} size={148} fg="#1e63d6" />
        <div className="h-share__opts">
          <span className="h-ui__label">{s.ink}</span>
          <span className="h-swatches" aria-hidden="true">
            <i style={{ background: '#0e1726' }} />
            <i className="is-on" style={{ background: '#1e63d6' }} />
            <i style={{ background: '#020a1e' }} />
          </span>
          <span className="h-ui__label">{s.size}</span>
          <span className="h-range" aria-hidden="true">
            <i />
          </span>
          <span className="h-ui__mono">300 px</span>
        </div>
      </div>
      <span className="h-ui__label">{s.export}</span>
      <span className="h-share__formats">
        <span>PNG</span>
        <span>SVG</span>
        <span>PDF</span>
      </span>
    </div>
  );
}

function SecureUi({ copy }: { copy: HomeCopy }) {
  const s = copy.mechanism.secure;
  return (
    <div className="h-ui h-secure">
      <span className="h-secure__row">
        <span>
          {s.password}
          <small>••••••••••</small>
        </span>
        <Toggle />
      </span>
      <span className="h-secure__row">
        <span>
          {s.expiry}
          <small>{s.expiryValue}</small>
        </span>
        <Toggle />
      </span>
      <span className="h-secure__row">
        <span>
          {s.active}
          <small>{demo.link}</small>
        </span>
        <Toggle />
      </span>
      <p className="h-secure__note">{s.note}</p>
    </div>
  );
}

function TrackUi({ copy }: { copy: HomeCopy }) {
  const t = copy.mechanism.track;
  const devices: [string, number][] = [
    [t.mobile, 64],
    [t.desktop, 29],
    [t.tablet, 7],
  ];
  return (
    <div className="h-ui h-track">
      <span className="h-ui__row">
        <SampleTag>{copy.sample}</SampleTag>
      </span>
      <span className="h-track__kpis">
        <span>
          <small>{t.clicks}</small>
          <strong>248</strong>
        </span>
        <span>
          <small>{t.scans}</small>
          <strong>131</strong>
        </span>
      </span>
      <span className="h-ui__label">{t.devices}</span>
      <span className="h-bars">
        {devices.map(([name, value]) => (
          <span key={name} className="h-bars__row">
            <span>{name}</span>
            <span className="h-bars__track">
              <i style={{ transform: `scaleX(${value / 100})` }} />
            </span>
            <span className="h-ui__mono">{pct(copy.lang, value)}</span>
          </span>
        ))}
      </span>
      <span className="h-ui__label">{t.sources}</span>
      <span className="h-chips">
        <span>{t.direct}</span>
        <span>Instagram</span>
        <span>Google</span>
        <span>LinkedIn</span>
      </span>
    </div>
  );
}

export function Mechanism({ copy }: { copy: HomeCopy }) {
  const m = copy.mechanism;
  const uis = [CreateUi, ShareUi, SecureUi, TrackUi];
  return (
    <section
      id="mecanisme"
      className="h-mech h-scene"
      aria-labelledby="mech-title"
      data-scene="mech"
    >
      <div className="h-scene__pin h-mech__pin">
        <div className="h-wrap h-mech__head">
          <div>
            <Eyebrow>{m.eyebrow}</Eyebrow>
            <h2 id="mech-title" className="h-title" data-split>
              {m.title}
            </h2>
          </div>
          <div className="h-mech__side">
            <p className="h-body" data-reveal>
              {m.body}
            </p>
            <ol className="h-tabs" aria-label={m.eyebrow}>
              {m.panels.map((panel, index) => (
                <li key={panel.tab}>
                  <a className="h-tabs__tab" href={`#etape-${index + 1}`} data-mech-tab={index}>
                    <span className="h-tabs__n">{String(index + 1).padStart(2, '0')}</span>
                    {panel.tab}
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </div>
        <div className="h-mech__viewport">
          <div className="h-mech__track" data-mech-track>
            {m.panels.map((panel, index) => {
              const Ui = uis[index]!;
              return (
                <article
                  key={panel.tab}
                  id={`etape-${index + 1}`}
                  className="h-panel"
                  aria-labelledby={`etape-${index + 1}-title`}
                  data-mech-panel={index}
                >
                  <div className="h-panel__text">
                    <span className="h-panel__n" aria-hidden="true">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <h3 id={`etape-${index + 1}-title`} className="h-panel__title">
                      <span className="h-visually-hidden">
                        {String(index + 1).padStart(2, '0')} {panel.tab} —{' '}
                      </span>
                      {panel.title}
                    </h3>
                    <p className="h-body">{panel.body}</p>
                  </div>
                  <figure className="h-panel__ui" aria-label={panel.fig}>
                    <Ui copy={copy} />
                    <figcaption>
                      <Fig>{panel.fig}</Fig>
                    </figcaption>
                  </figure>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
