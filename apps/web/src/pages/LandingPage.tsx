import { useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUpRight, ArrowRight, Check, Copy, Plus } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import '../styles/landing.css';
import '../styles/connection-studio.css';
import { ConnectionStage } from '../components/landing/ConnectionStage';
import { CampaignGallery } from '../components/landing/CampaignGallery';

gsap.registerPlugin(ScrollTrigger);

const palettes = [
  { name: 'Acid', paper: '#e4ff54', ink: '#202217' },
  { name: 'Lavande', paper: '#c9b9ff', ink: '#352453' },
  { name: 'Corail', paper: '#ffad91', ink: '#54291f' },
];

function ScanTicket({ paper = '#e4ff54', ink = '#202217', hero = false }) {
  return (
    <div
      className={`scan-ticket ${hero ? 'hero-ticket' : ''}`}
      style={{ background: paper, color: ink }}
    >
      <div className="ticket-top">
        <b>WRX®</b>
        <span>OFFLINE → ONLINE</span>
      </div>
      <div className="ticket-code">
        <QRCodeSVG
          value="https://github.com/ADLI-Imrane/wrx-generator-v2"
          size={220}
          fgColor={ink}
          bgColor={paper}
          marginSize={2}
          level="M"
        />
      </div>
      <div className="ticket-title">
        GOOD THINGS
        <br />
        START HERE. <ArrowUpRight />
      </div>
      <div className="ticket-tear" />
      <div className="ticket-bottom">
        <span>SCAN TO CONNECT</span>
        <span>001—WRX</span>
      </div>
    </div>
  );
}

export function LandingPage() {
  const root = useRef<HTMLElement>(null);
  const [paletteIndex, setPaletteIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const palette = palettes[paletteIndex] ?? palettes[0]!;

  useLayoutEffect(() => {
    const media = gsap.matchMedia();
    const context = gsap.context(() => {
      media.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from('.campaign-heading h2', {
          y: 80,
          opacity: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: { trigger: '.campaign-heading', start: 'top 85%' },
        });
        gsap.fromTo(
          '.connection-manifesto p span',
          { opacity: 0.18 },
          {
            opacity: 1,
            stagger: 0.12,
            ease: 'none',
            scrollTrigger: {
              trigger: '.connection-manifesto',
              start: 'top 75%',
              end: 'bottom 65%',
              scrub: 0.5,
            },
          }
        );
      });
      media.add(
        '(min-width: 900px) and (min-height: 600px) and (prefers-reduced-motion: no-preference)',
        () => {
          const track = root.current?.querySelector<HTMLElement>('.journey-track');
          const viewport = root.current?.querySelector<HTMLElement>('.journey-viewport');
          if (!track || !viewport) return;
          const travel = () => track.scrollWidth - viewport.clientWidth;
          const timeline = gsap.timeline({
            scrollTrigger: {
              id: 'wrx-journey',
              trigger: '.journey',
              start: 'top top',
              end: () => `+=${travel()}`,
              pin: true,
              scrub: 0.65,
              invalidateOnRefresh: true,
              anticipatePin: 1,
            },
          });
          timeline.to(track, { x: () => -travel(), ease: 'none' }, 0);
          timeline.to('.journey-progress span', { scaleX: 1, ease: 'none' }, 0);
        }
      );
    }, root);
    // Refresh after font metrics settle; context cleanup also removes pin spacers on navigation.
    let mounted = true;
    void document.fonts.ready.then(() => {
      if (mounted) ScrollTrigger.refresh();
    });
    return () => {
      mounted = false;
      media.revert();
      context.revert();
    };
  }, []);

  const copyDemo = async () => {
    try {
      await navigator.clipboard.writeText('https://github.com/ADLI-Imrane/wrx-generator-v2');
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <main ref={root} className="wrx-site">
      <a className="wrx-skip" href="#experience">
        Aller à la démo
      </a>
      <header className="wrx-nav">
        <a className="wrx-wordmark" href="#top" aria-label="WRX Generator accueil">
          wrx<span>®</span>
        </a>
        <nav aria-label="Navigation principale">
          <a href="#campaigns">Le studio ↘</a>
          <a href="#experience">
            Le produit <span>↘</span>
          </a>
          <a href="#possibilities">Les possibilités</a>
        </nav>
        <Link className="nav-login" to="/login">
          Mon espace <ArrowUpRight size={17} />
        </Link>
      </header>

      <ConnectionStage />
      <CampaignGallery />
      <section className="connection-manifesto" aria-label="Notre idée">
        <span className="section-label">PETIT FORMAT. GRANDES POSSIBILITÉS.</span>
        <p>
          {'Entre votre idée et leur prochain déclic, il ne devrait y avoir qu’un scan.'
            .split(' ')
            .map((word, index) => (
              <span key={index}>{word} </span>
            ))}
        </p>
        <span className="manifesto-signature">THAT’S THE WRX EFFECT. ↗</span>
      </section>

      <div className="wrx-ticker" aria-hidden="true">
        <div>
          {Array.from({ length: 4 }, (_, i) => (
            <span key={i}>
              LESS FRICTION <b>✳</b> MORE CONNECTION <b>↗</b>{' '}
            </span>
          ))}
        </div>
      </div>

      <section
        id="experience"
        className="journey"
        aria-label="Du lien au scan : démonstration interactive"
      >
        <div className="journey-header">
          <span>LE PRODUIT, EN MOUVEMENT</span>
          <span className="journey-hint">
            SCROLLEZ POUR EXPLORER <ArrowRight size={16} />
          </span>
          <a href="#possibilities">Passer la démo ↗</a>
        </div>
        <div className="journey-viewport">
          <div className="journey-track">
            <article className="journey-panel panel-link">
              <div className="panel-copy">
                <span className="section-label">01 / SIMPLIFIER</span>
                <h2>
                  Moins long.
                  <br />
                  <i>Plus fort.</i>
                </h2>
                <p>
                  Votre prochaine campagne mérite mieux qu’une URL à rallonge. Faites court. Faites
                  mémorable.
                </p>
                <span className="panel-footnote">UN LIEN. UNE DESTINATION. ZÉRO DÉTOUR.</span>
              </div>
              <div className="link-composition">
                <span className="composition-label">LINK LAB / DÉMONSTRATION</span>
                <div className="long-url">
                  https://votre-marque.com/collection/été?campagne=2026
                </div>
                <div className="connector-line">
                  <ArrowDown />
                </div>
                <div className="short-url">
                  <span>
                    wrx.ma/<b>hello</b>
                  </span>
                  <button
                    onClick={() => void copyDemo()}
                    aria-label="Copier le lien de démonstration"
                  >
                    {copied ? <Check /> : <Copy />}
                  </button>
                </div>
                <span className="copy-caption">
                  {copied ? 'Lien du projet copié !' : 'Un format court. Une impression durable.'}
                </span>
                <span className="link-spark" aria-hidden="true">
                  ✳
                </span>
              </div>
            </article>
            <article className="journey-panel panel-brand">
              <div className="panel-copy">
                <span className="section-label">02 / SIGNER</span>
                <h2>
                  Votre code.
                  <br />
                  <i>Vos codes.</i>
                </h2>
                <p>
                  Sur une affiche, un packaging ou une carte. Votre identité continue au-delà du
                  premier scan.
                </p>
                <div className="palette-picker" aria-label="Couleur du QR de démonstration">
                  {palettes.map((item, index) => (
                    <button
                      key={item.name}
                      onClick={() => setPaletteIndex(index)}
                      aria-label={`Palette ${item.name}`}
                      aria-pressed={index === paletteIndex}
                      style={{ background: item.paper }}
                    >
                      {index === paletteIndex && <Check size={18} />}
                    </button>
                  ))}
                  <span>{palette.name} / Essayez une couleur</span>
                </div>
              </div>
              <div className="brand-composition">
                <span className="brand-outline" aria-hidden="true">
                  MAKE
                  <br />
                  IT YOURS.
                </span>
                <ScanTicket paper={palette.paper} ink={palette.ink} />
              </div>
            </article>
            <article className="journey-panel panel-impact">
              <div className="panel-copy">
                <span className="section-label">03 / COMPRENDRE</span>
                <h2>
                  Un scan.
                  <br />
                  <i>Et après ?</i>
                </h2>
                <p>
                  Suivez les clics et les scans. Repérez ce qui fonctionne et donnez une nouvelle
                  direction à votre campagne.
                </p>
                <Link className="wrx-button" to="/register">
                  Passer à l’action <ArrowUpRight size={20} />
                </Link>
              </div>
              <div className="impact-composition">
                <div className="impact-heading">
                  <span>SUMMER DROP ↗</span>
                  <span>APERÇU DÉMO</span>
                </div>
                <span className="impact-metric">
                  2,847<span> scans</span>
                </span>
                <div className="impact-chart" aria-label="Exemple de graphique de scans">
                  {[24, 34, 28, 47, 39, 58, 51, 72, 60, 81, 73, 98].map((height, i) => (
                    <div key={i} style={{ height: `${height}%` }} />
                  ))}
                </div>
                <div className="impact-axis">
                  <span>LUN</span>
                  <span>DIM</span>
                </div>
                <div className="impact-summary">
                  <span>Chaque interaction compte.</span>
                  <ArrowUpRight size={34} />
                </div>
              </div>
            </article>
          </div>
        </div>
        <div className="journey-progress" aria-hidden="true">
          <span />
        </div>
      </section>

      <section id="possibilities" className="possibilities">
        <div className="section-heading">
          <span className="section-label">LE MONDE EST VOTRE SUPPORT.</span>
          <h2>
            De petites portes.
            <br />
            <i>Partout.</i>
          </h2>
          <p>
            Vos idées ne vivent pas que sur un écran.
            <br />
            Créez le passage entre les deux mondes.
          </p>
        </div>
        <div className="use-case-grid">
          <article className="use-case case-coffee">
            <div className="case-art">
              <div className="coffee-lid" />
              <div className="coffee-cup">
                <span>
                  DAILY
                  <br />
                  <b>DOSE.</b>
                </span>
                <QRCodeSVG value="https://example.com/menu" size={64} bgColor="transparent" />
              </div>
              <span className="case-float">UN CAFÉ. UNE CONNEXION.</span>
            </div>
            <div className="case-caption">
              <h3>À chaque comptoir.</h3>
              <span>
                MENUS & COMMERCES <ArrowUpRight size={18} />
              </span>
            </div>
          </article>
          <article className="use-case case-poster">
            <div className="case-art">
              <div className="event-poster">
                <span>AFTER HOURS®</span>
                <b>
                  SEE
                  <br />
                  YOU
                  <br />
                  <i>THERE.</i>
                </b>
                <div>
                  <span>
                    FRIDAY
                    <br />
                    23:00 — LATE
                  </span>
                  <QRCodeSVG value="https://example.com/event" size={52} bgColor="transparent" />
                </div>
              </div>
            </div>
            <div className="case-caption">
              <h3>À chaque rendez-vous.</h3>
              <span>
                ÉVÉNEMENTS & CULTURE <ArrowUpRight size={18} />
              </span>
            </div>
          </article>
          <article className="use-case case-package">
            <div className="case-art">
              <div className="package-box">
                <span className="package-brand">
                  a little
                  <br />
                  <i>more.</i>
                </span>
                <div className="package-label">
                  <QRCodeSVG
                    value="https://example.com/collection"
                    size={70}
                    bgColor="transparent"
                  />
                  <span>
                    OPEN A<br />
                    NEW WORLD ↗
                  </span>
                </div>
              </div>
            </div>
            <div className="case-caption">
              <h3>À chaque découverte.</h3>
              <span>
                MARQUES & PACKAGING <ArrowUpRight size={18} />
              </span>
            </div>
          </article>
        </div>
      </section>

      <section className="wrx-faq">
        <div>
          <span className="section-label">BON À SAVOIR</span>
          <h2>
            Simple.
            <br />
            <i>Vraiment.</i>
          </h2>
        </div>
        <div className="faq-list">
          {[
            [
              'Puis-je modifier la destination de mon QR code ?',
              'Oui. Un QR code dynamique pointe vers une destination que vous pouvez modifier depuis votre espace, sans avoir à réimprimer votre support.',
            ],
            [
              'Comment suivre les résultats ?',
              'Retrouvez les clics de vos liens et les scans de vos QR codes dans votre tableau de bord pour comparer vos campagnes.',
            ],
            [
              'Par où commencer ?',
              'Créez votre compte, ajoutez votre première destination, puis partagez votre lien court ou téléchargez votre QR code.',
            ],
          ].map(([question, answer]) => (
            <details key={question}>
              <summary>
                {question}
                <Plus size={20} />
              </summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="wrx-footer">
        <div className="footer-top">
          <span className="section-label">À VOUS DE JOUER.</span>
          <Link to="/register">
            Make the
            <br />
            <i>connection.</i>
            <ArrowUpRight />
          </Link>
        </div>
        <div className="footer-bottom">
          <a className="wrx-wordmark" href="#top">
            wrx<span>®</span>
          </a>
          <span>© {new Date().getFullYear()} WRX GENERATOR</span>
          <a href="#top">
            Retour en haut <ArrowUpRight size={17} />
          </a>
        </div>
      </footer>
    </main>
  );
}
