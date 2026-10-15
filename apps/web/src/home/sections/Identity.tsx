import type { CSSProperties } from 'react';
import type { HomeCopy } from '../content';
import { Eyebrow, Qr } from '../ui/primitives';

const CARD_URL = 'https://wrx.example/c/votre-carte';

function BusinessCard({ copy }: { copy: HomeCopy }) {
  const i = copy.identity;
  return (
    <div className="h-bcard" aria-hidden="true">
      <span className="h-bcard__mark">W</span>
      <span className="h-bcard__who">
        <strong>{i.name}</strong>
        <span>
          {i.role} · {i.company}
        </span>
      </span>
      <span className="h-bcard__contact">
        <span>{i.email}</span>
        <span>{i.phone}</span>
        <span>{i.website}</span>
      </span>
      <Qr className="h-bcard__qr" value={CARD_URL} size={76} />
    </div>
  );
}

function DigitalCard({ copy }: { copy: HomeCopy }) {
  const i = copy.identity;
  return (
    <div className="h-dcard" aria-hidden="true">
      <span className="h-dcard__cover" />
      <span className="h-dcard__avatar">
        <svg viewBox="0 0 24 24">
          <circle cx="12" cy="9" r="4" />
          <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
        </svg>
      </span>
      <strong className="h-dcard__name">{i.name}</strong>
      <span className="h-dcard__role">
        {i.role} · {i.company}
      </span>
      <span className="h-dcard__actions">
        <span className="h-btn h-btn--primary h-btn--sm">{i.saveContact} · .vcf</span>
        <span className="h-btn h-btn--ghost h-btn--sm">{i.share}</span>
      </span>
      <span className="h-dcard__rows">
        <span>{i.email}</span>
        <span>{i.phone}</span>
        <span>{i.website}</span>
      </span>
    </div>
  );
}

function SignatureMail({ copy }: { copy: HomeCopy }) {
  const i = copy.identity;
  return (
    <div className="h-mail" aria-hidden="true">
      <span className="h-mail__head">
        <span>{i.mailTo}</span>
        <span>{i.mailSubject}</span>
      </span>
      <p className="h-mail__body">{i.mailBody}</p>
      <span className="h-sig">
        <span className="h-sig__mark">W</span>
        <span className="h-sig__text">
          <strong>{i.name}</strong>
          <span>
            {i.role} · {i.company}
          </span>
          <span className="h-sig__link">{i.email}</span>
        </span>
      </span>
      <span className="h-mail__foot">
        <span className="h-btn h-btn--ink h-btn--sm">{i.copySignature}</span>
        <span className="h-ui__mono">{i.clients}</span>
      </span>
    </div>
  );
}

export function Identity({ copy }: { copy: HomeCopy }) {
  const i = copy.identity;
  const visuals = [BusinessCard, DigitalCard, SignatureMail];
  return (
    <section className="h-identity h-section" aria-labelledby="identity-title">
      <div className="h-wrap h-identity__grid">
        <div className="h-identity__copy">
          <Eyebrow>{i.eyebrow}</Eyebrow>
          <h2 id="identity-title" className="h-title" data-split>
            {i.title}
          </h2>
          <p className="h-body" data-reveal>
            {i.body}
          </p>
          <p className="h-note" data-reveal>
            {i.note}
          </p>
        </div>
        <ol className="h-stack">
          {i.cards.map((card, index) => {
            const Visual = visuals[index]!;
            return (
              <li
                key={card.kicker}
                className="h-stack__item"
                style={{ '--i': index } as CSSProperties}
              >
                <article className="h-stack__card" aria-labelledby={`stack-${index}`}>
                  <header className="h-stack__head">
                    <span className="h-ui__label">
                      {String(index + 1).padStart(2, '0')} · {card.kicker}
                    </span>
                    <h3 id={`stack-${index}`} className="h-stack__title">
                      {card.title}
                    </h3>
                    <p className="h-stack__detail">{card.detail}</p>
                  </header>
                  <div className="h-stack__visual">
                    <Visual copy={copy} />
                  </div>
                </article>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
