import { useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import type { PointerEvent } from 'react';

const campaigns = [
  {
    name: 'After hours.',
    category: 'CULTURE / BILLETTERIE',
    style: 'night',
    headline: ['STAY', 'FOR THE', 'FEELING.'],
    url: 'https://example.com/event',
    caption: 'De l’affiche au premier rang.',
  },
  {
    name: 'Daily ritual.',
    category: 'CAFÉ / MENU DIGITAL',
    style: 'ritual',
    headline: ['GOOD', 'COFFEE.', 'GREAT DAY.'],
    url: 'https://example.com/menu',
    caption: 'Du comptoir à votre prochain favori.',
  },
  {
    name: 'Outside club.',
    category: 'COMMUNAUTÉ / INSCRIPTIONS',
    style: 'outside',
    headline: ['LESS', 'SCROLL.', 'MORE SOUL.'],
    url: 'https://example.com/community',
    caption: 'Du premier scan à la prochaine rencontre.',
  },
  {
    name: 'Objects of desire.',
    category: 'MARQUE / COLLECTION',
    style: 'objects',
    headline: ['A LITTLE', 'THING.', 'A BIG FEEL.'],
    url: 'https://example.com/collection',
    caption: 'Du packaging à l’univers de votre marque.',
  },
];

export function CampaignGallery() {
  const rail = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: number; x: number; scroll: number } | null>(null);
  const [active, setActive] = useState(0);
  const beginDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      id: event.pointerId,
      x: event.clientX,
      scroll: event.currentTarget.scrollLeft,
    };
    event.currentTarget.classList.add('is-dragging');
  };
  const moveDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    event.currentTarget.scrollLeft = drag.current.scroll + drag.current.x - event.clientX;
  };
  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (drag.current && event.currentTarget.hasPointerCapture(drag.current.id))
      event.currentTarget.releasePointerCapture(drag.current.id);
    drag.current = null;
    event.currentTarget.classList.remove('is-dragging');
  };
  const go = (direction: number) => {
    const element = rail.current;
    if (!element) return;
    const card = element.querySelector<HTMLElement>('.campaign-card');
    element.scrollBy({
      left: direction * ((card?.offsetWidth ?? 400) + 24),
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'instant'
        : 'smooth',
    });
  };
  return (
    <section
      className="campaign-gallery"
      id="campaigns"
      aria-label="Galerie de campagnes interactives"
    >
      <div className="campaign-heading">
        <span className="section-label">DES IDÉES QUI SORTENT DE L’ÉCRAN.</span>
        <h2>
          Made to
          <br />
          <i>connect.</i>
          <sup>(04)</sup>
        </h2>
        <div>
          <p>
            Un QR ne fait pas que diriger.
            <br />
            Il ouvre la suite de l’histoire.
          </p>
          <span className="drag-instruction">GLISSEZ POUR EXPLORER ↔</span>
        </div>
      </div>
      <div
        ref={rail}
        className="campaign-rail"
        tabIndex={0}
        role="region"
        aria-label="Campagnes : faites glisser ou utilisez les flèches"
        onPointerDown={beginDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onLostPointerCapture={() => {
          drag.current = null;
          rail.current?.classList.remove('is-dragging');
        }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
            event.preventDefault();
            go(event.key === 'ArrowRight' ? 1 : -1);
          }
        }}
        onScroll={() => {
          const el = rail.current;
          if (el) {
            const travel = Math.max(1, el.scrollWidth - el.clientWidth);
            setActive(Math.min(3, Math.max(0, Math.round((el.scrollLeft / travel) * 3))));
          }
        }}
      >
        {campaigns.map((campaign, index) => (
          <article key={campaign.name} className={`campaign-card campaign-${campaign.style}`}>
            <div className="campaign-art">
              <div className="campaign-orb" aria-hidden="true" />
              <div className="campaign-poster">
                <span className="campaign-poster-top">
                  {campaign.name.toUpperCase()} <ArrowUpRight size={18} />
                </span>
                <strong>
                  {campaign.headline.map((line) => (
                    <span key={line}>{line}</span>
                  ))}
                </strong>
                <div className="campaign-poster-bottom">
                  <span>
                    SCAN FOR
                    <br />
                    WHAT'S NEXT. ↗<br />
                    <small>CONCEPT / WRX</small>
                  </span>
                  <QRCodeSVG
                    value={campaign.url}
                    size={84}
                    bgColor="transparent"
                    fgColor={campaign.style === 'objects' ? '#e3e5d0' : '#20221d'}
                  />
                </div>
              </div>
              <span className="campaign-index">00{index + 1} / CONNECTION STUDIES</span>
            </div>
            <div className="campaign-caption">
              <div>
                <h3>{campaign.name}</h3>
                <p>{campaign.caption}</p>
              </div>
              <span>{campaign.category}</span>
            </div>
          </article>
        ))}
      </div>
      <div className="campaign-controls">
        <span aria-live="polite">
          0{active + 1} <span>/ 04 — CONCEPTS DE CAMPAGNES</span>
        </span>
        <div>
          <button onClick={() => go(-1)} aria-label="Campagne précédente">
            <ArrowLeft size={20} />
          </button>
          <button onClick={() => go(1)} aria-label="Campagne suivante">
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </section>
  );
}
