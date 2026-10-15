import { useId, useRef, useState } from 'react';
import type { FormEvent, PointerEvent } from 'react';
import type { HomeCopy } from '../content';
import { Eyebrow, Qr } from '../ui/primitives';
import { normaliseDestination } from '../lib';

const EXAMPLE = 'https://example.com';
const INKS = ['#0e1726', '#1e63d6', '#020a1e'] as const;

export function TryIt({ copy }: { copy: HomeCopy }) {
  const t = copy.tryIt;
  const ids = useId();
  const [draft, setDraft] = useState('');
  const [destination, setDestination] = useState(EXAMPLE);
  const [ink, setInk] = useState(0);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const qrRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const generate = (event: FormEvent) => {
    event.preventDefault();
    const next = normaliseDestination(draft);
    if (!next) {
      setError(t.invalid);
      setStatus('');
      return;
    }
    setDestination(next);
    setError('');
    setStatus(t.ready);
  };

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(destination);
      setStatus(t.copied);
    } catch {
      setStatus(t.copyFailed);
    }
  };

  const download = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    const blob = new Blob([new XMLSerializer().serializeToString(clone)], {
      type: 'image/svg+xml;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'wrx-qr.svg';
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus(t.downloaded);
  };

  const spotlight = (event: PointerEvent<HTMLDivElement>) => {
    const panel = panelRef.current;
    if (!panel || event.pointerType !== 'mouse') return;
    const box = panel.getBoundingClientRect();
    panel.style.setProperty('--x', `${event.clientX - box.left}px`);
    panel.style.setProperty('--y', `${event.clientY - box.top}px`);
  };

  return (
    <section id="essai" className="h-try h-section" aria-labelledby="try-title">
      <div className="h-wrap h-try__grid">
        <div className="h-try__copy">
          <Eyebrow>{t.eyebrow}</Eyebrow>
          <h2 id="try-title" className="h-title" data-split>
            {t.title}
          </h2>
          <p className="h-body" data-reveal>
            {t.body}
          </p>
          <p className="h-note" data-reveal>
            {t.note}
          </p>
        </div>
        <div className="h-try__panel h-spot" ref={panelRef} onPointerMove={spotlight} data-reveal>
          <form className="h-try__form" onSubmit={generate} noValidate>
            <label className="h-ui__label" htmlFor={`${ids}-url`}>
              {t.label}
            </label>
            <div className="h-try__row">
              <input
                id={`${ids}-url`}
                className="h-input"
                type="url"
                inputMode="url"
                autoComplete="url"
                spellCheck={false}
                placeholder={t.placeholder}
                value={draft}
                maxLength={512}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? `${ids}-error` : undefined}
                onChange={(event) => setDraft(event.target.value)}
              />
              <button className="h-btn h-btn--ink" type="submit">
                {t.generate}
              </button>
            </div>
            {error ? (
              <p id={`${ids}-error`} className="h-try__error" role="alert">
                {error}
              </p>
            ) : null}
          </form>
          <div className="h-try__result">
            <div className="h-try__qr" ref={qrRef}>
              <Qr
                value={destination}
                size={208}
                fg={INKS[ink]}
                label={`${t.qrAlt} ${destination}`}
              />
            </div>
            <div className="h-try__side">
              <fieldset className="h-try__inks">
                <legend className="h-ui__label">{t.ink}</legend>
                {t.inks.map((name, index) => (
                  <button
                    key={name}
                    type="button"
                    className="h-swatch"
                    aria-pressed={ink === index}
                    onClick={() => setInk(index)}
                  >
                    <i style={{ background: INKS[index] }} aria-hidden="true" />
                    {name}
                  </button>
                ))}
              </fieldset>
              <span className="h-ui__label">{t.encoded}</span>
              <code className="h-try__encoded">{destination}</code>
              <span className="h-try__actions">
                <button className="h-btn h-btn--ghost h-btn--sm" type="button" onClick={download}>
                  {t.download}
                </button>
                <button
                  className="h-btn h-btn--ghost h-btn--sm"
                  type="button"
                  onClick={copyAddress}
                >
                  {t.copy}
                </button>
              </span>
            </div>
          </div>
          <p className="h-try__status" role="status" aria-live="polite">
            {status}
          </p>
        </div>
      </div>
    </section>
  );
}
