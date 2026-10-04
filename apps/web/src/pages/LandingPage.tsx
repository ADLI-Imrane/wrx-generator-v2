import { useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUpRight, ArrowRight, Plus } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DestinationWorkbench } from '../components/landing/DestinationWorkbench';
import '../styles/landing.css';

gsap.registerPlugin(ScrollTrigger);
const questions = [
  [
    'Que puis-je faire sans compte ?',
    'L’atelier ci-dessus crée un QR code direct pour votre URL. Vous pouvez le télécharger en SVG et l’utiliser immédiatement. Il n’est pas enregistré et sa destination ne peut pas être modifiée après impression.',
  ],
  [
    'Quelle différence avec un QR dynamique ?',
    'Un QR dynamique passe par un lien géré dans votre espace WRX. Vous pouvez y changer la destination sans réimprimer le code. Créez un compte pour gérer vos liens, vos QR codes et leurs statistiques.',
  ],
  [
    'Est-ce que les liens et les QR codes fonctionnent ensemble ?',
    'Oui. Un lien court se partage dans un message ou une publication ; un QR code fait le passage depuis un support physique. Retrouvez les deux dans le même espace.',
  ],
];

export function LandingPage() {
  const root = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const media = gsap.matchMedia();
    const context = gsap.context(() => {
      media.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from('.home-title > span', {
          y: 24,
          opacity: 0,
          stagger: 0.09,
          duration: 0.75,
          ease: 'power3.out',
        });
      });
      media.add(
        '(min-width: 900px) and (min-height: 650px) and (prefers-reduced-motion: no-preference)',
        () => {
          const rail = root.current?.querySelector<HTMLElement>('.journey-track');
          const viewport = root.current?.querySelector<HTMLElement>('.journey-viewport');
          if (!rail || !viewport) return;
          const distance = () => rail.scrollWidth - viewport.clientWidth;
          gsap.to(rail, {
            x: () => -distance(),
            ease: 'none',
            scrollTrigger: {
              id: 'wrx-journey',
              trigger: '.journey',
              start: 'top top',
              end: () => `+=${distance()}`,
              pin: true,
              scrub: 0.5,
              invalidateOnRefresh: true,
            },
          });
        }
      );
    }, root);
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

  return (
    <main className="wrx-home" ref={root}>
      <a href="#atelier" className="home-skip">
        Aller à l’atelier QR
      </a>
      <header className="home-nav">
        <a href="#top" className="home-logo" aria-label="WRX Generator accueil">
          wrx<span>↗</span>
        </a>
        <nav aria-label="Navigation principale">
          <a href="#atelier">L’atelier</a>
          <a href="#experience">Le principe</a>
          <a href="#questions">Les réponses</a>
        </nav>
        <Link className="home-login" to="/login">
          Mon espace <ArrowUpRight size={16} />
        </Link>
      </header>
      <section className="home-intro" id="top">
        <div className="intro-label">
          <span className="registration-mark" aria-hidden="true" /> LIENS COURTS. QR CODES.
          NOUVELLES DIRECTIONS.
        </div>
        <div className="intro-composition">
          <h1 className="home-title">
            <span>Chaque scan,</span>
            <span>
              une <i>suite.</i>
              <ArrowUpRight aria-hidden="true" />
            </span>
          </h1>
          <div className="intro-copy">
            <p>
              Une carte, une affiche, un message. <br />
              Donnez à chaque point de contact <br />
              une destination qui compte.
            </p>
            <a href="#atelier">
              Commencez par votre lien <ArrowDown size={17} />
            </a>
          </div>
        </div>
      </section>
      <DestinationWorkbench />
      <div className="home-bridge">
        <span>LE BON FORMAT, AU BON ENDROIT.</span>
        <p>
          À scanner dans la vraie vie.
          <br />
          <i>À partager partout ailleurs.</i>
        </p>
        <span>
          01 — 03 <ArrowDown size={18} />
        </span>
      </div>
      <section id="experience" className="journey" aria-label="Un lien, du support au résultat">
        <div className="journey-top">
          <span>UN LIEN. TOUT UN PARCOURS.</span>
          <a href="#workspace">
            Passer le parcours <ArrowUpRight size={15} />
          </a>
        </div>
        <div className="journey-viewport">
          <div className="journey-track">
            <article className="journey-panel panel-paper">
              <div className="journey-copy">
                <span className="home-eyebrow">01 / LE POINT DE DÉPART</span>
                <h2>
                  Le monde n’a
                  <br />
                  pas de bouton.
                  <br />
                  <i>Ajoutez-en un.</i>
                </h2>
                <p>
                  Sur un menu, un colis ou une affiche, un QR code donne une suite à ce que l’on a
                  sous les yeux.
                </p>
                <span className="journey-bottom-label">
                  SUPPORT PHYSIQUE → DESTINATION DIGITALE
                </span>
              </div>
              <div className="paper-scene" aria-label="Exemple d’affiche avec emplacement QR">
                <div className="paper-poster">
                  <span>LES RENDEZ-VOUS DU QUARTIER</span>
                  <strong>
                    ON SE
                    <br />
                    RETROUVE
                    <br />
                    <i>ICI.</i>
                  </strong>
                  <div className="poster-route">
                    <span className="finder-mark" aria-hidden="true">
                      ↗
                    </span>
                    <p>
                      Votre QR ici.
                      <br />
                      <b>La suite sur votre écran.</b>
                    </p>
                  </div>
                </div>
                <span className="scene-note">CONCEPT D’AFFICHE / WRX</span>
              </div>
            </article>
            <article className="journey-panel panel-route">
              <div className="journey-copy">
                <span className="home-eyebrow">02 / LA DESTINATION</span>
                <h2>
                  Vos plans changent.
                  <br />
                  Votre QR ?<br />
                  <i>Il reste.</i>
                </h2>
                <p>
                  Avec un QR dynamique créé dans votre espace, changez la destination. Les supports
                  déjà imprimés continuent de fonctionner.
                </p>
                <Link to="/register" className="home-text-link">
                  Créer un QR dynamique <ArrowUpRight size={18} />
                </Link>
              </div>
              <div className="route-scene">
                <span className="route-label">LE PRINCIPE DU QR DYNAMIQUE</span>
                <div className="route-source">
                  <span className="finder-mark" aria-hidden="true">
                    ↗
                  </span>
                  <span>
                    Votre QR imprimé<b>Le point d’entrée reste le même.</b>
                  </span>
                </div>
                <div className="route-path" aria-hidden="true">
                  <span />
                  <ArrowDown />
                </div>
                <div className="route-destination old">
                  <span>01</span>
                  <s>La collection printemps</s>
                  <span>ARCHIVÉE</span>
                </div>
                <div className="route-destination current">
                  <span>02</span>
                  <b>La collection été</b>
                  <ArrowUpRight />
                </div>
                <p>
                  Une modification dans WRX.
                  <br />
                  Aucune réimpression.
                </p>
              </div>
            </article>
            <article className="journey-panel panel-signal">
              <div className="journey-copy">
                <span className="home-eyebrow">03 / LE RETOUR</span>
                <h2>
                  Partagez.
                  <br />
                  Observez.
                  <br />
                  <i>Ajustez.</i>
                </h2>
                <p>
                  Retrouvez les clics et les scans de vos campagnes. Comparez les résultats pour
                  décider de la suite.
                </p>
                <Link className="home-text-link" to="/register">
                  Retrouver mes campagnes <ArrowUpRight size={18} />
                </Link>
              </div>
              <div className="signal-sheet">
                <div>
                  <span>LECTURE DE CAMPAGNE</span>
                  <span>ILLUSTRATION</span>
                </div>
                <h3>
                  Qu’est-ce qui
                  <br />
                  fait venir les gens ?
                </h3>
                <div
                  className="signal-bars"
                  aria-label="Graphique illustratif, sans données réelles"
                >
                  {[28, 44, 36, 62, 51, 76, 58, 85, 69, 95].map((height, index) => (
                    <span key={index} style={{ height: `${height}%` }} />
                  ))}
                </div>
                <div className="signal-axis">
                  <span>LE PREMIER PARTAGE</span>
                  <ArrowRight size={18} />
                  <span>LA SUITE</span>
                </div>
                <p>
                  Clics des liens <span>+</span> Scans des QR <span>→</span> Une vue d’ensemble
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>
      <section className="workspace-section" id="workspace">
        <div>
          <span className="home-eyebrow">LE QUOTIDIEN, SIMPLIFIÉ.</span>
          <h2>
            Votre prochain lien.
            <br />
            Et tous ceux
            <br />
            <i>d’après.</i>
          </h2>
          <Link className="home-button" to="/register">
            Créer mon espace WRX <ArrowUpRight size={18} />
          </Link>
        </div>
        <div className="workspace-list">
          {[
            [
              '01',
              'Raccourcir.',
              'Des liens courts et personnalisés, faciles à reconnaître et à partager.',
            ],
            [
              '02',
              'Personnaliser.',
              'Des QR codes qui trouvent leur place sur vos supports et dans votre identité.',
            ],
            [
              '03',
              'Garder la main.',
              'Vos destinations, vos campagnes et leurs statistiques dans un même espace.',
            ],
          ].map(([number, title, copy]) => (
            <div key={number}>
              <span>{number}</span>
              <div>
                <h3>{title}</h3>
                <p>{copy}</p>
              </div>
              <ArrowUpRight size={20} />
            </div>
          ))}
        </div>
      </section>
      <section className="home-faq" id="questions">
        <span className="home-eyebrow">AVANT DE VOUS LANCER.</span>
        <div>
          {questions.map(([question, answer]) => (
            <details key={question}>
              <summary>
                {question}
                <Plus size={19} />
              </summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>
      <footer className="home-footer">
        <div>
          <span className="home-eyebrow">UNE ADRESSE. DES POSSIBILITÉS.</span>
          <a href="#atelier">
            À vous
            <br />
            de faire <i>le lien.</i>
            <ArrowUpRight />
          </a>
        </div>
        <div className="home-footer-bottom">
          <span className="home-logo">
            wrx<span>↗</span>
          </span>
          <span>© {new Date().getFullYear()} WRX GENERATOR</span>
          <a href="#top">Retour en haut ↑</a>
        </div>
      </footer>
    </main>
  );
}
