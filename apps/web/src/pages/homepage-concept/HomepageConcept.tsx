import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, MoveUpRight, Plus, ShieldCheck } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { BrandLogo } from "../../components/BrandLogo";
import { BusinessCardArtwork } from "../../components/BusinessCardPreview";
import { conceptCard, conceptTools } from "./conceptData";
import { useConceptMotion } from "./useConceptMotion";
import "./homepage-concept.css";

function SignalChart() {
  const line =
    "M0 167L32 161L64 169L96 132L128 140L160 130L192 146L224 89L256 101L288 65L320 83L352 47L384 61L416 28L448 49L480 21L512 39L552 10";

  return (
    <svg
      className="hc-chart"
      viewBox="0 0 560 190"
      role="img"
      aria-label="Courbe illustrative de clics, sans données de compte"
    >
      {[35, 85, 135, 185].map((y) => (
        <path
          key={y}
          d={`M0 ${y}H560`}
          stroke="currentColor"
          strokeOpacity=".12"
        />
      ))}
      <path
        className="hc-chart-line"
        d={line}
        fill="none"
        stroke="#568aff"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <circle
        className="hc-chart-observer"
        cx="0"
        cy="167"
        r="4"
        fill="#a9c2ff"
        aria-hidden="true"
      />
      <circle
        className="hc-chart-latest"
        cx="552"
        cy="10"
        r="5"
        fill="#568aff"
      />
    </svg>
  );
}

export default function HomepageConcept() {
  const root = useRef<HTMLDivElement>(null);
  const [quiet, setQuiet] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [side, setSide] = useState<"front" | "back">("front");
  const [activeTool, setActiveTool] = useState(0);
  useConceptMotion(root, quiet);
  const selected = conceptTools[activeTool] ?? conceptTools[0];

  return (
    <div ref={root} className={`hp-concept${quiet ? " hc-quiet" : ""}`}>
      <a className="hc-skip" href="#hc-tools">
        Aller aux outils
      </a>
      <header className="hc-header">
        <Link
          to="/"
          className="hc-brand"
          aria-label="WRX Generator — accueil"
        >
          <BrandLogo />
          <span>
            WRX<span className="hc-brand-sub">GENERATOR</span>
          </span>
        </Link>
        <nav aria-label="Navigation principale">
          <a href="#hc-tools">
            Les outils <span>05</span>
          </a>
          <Link to="/login">
            Connexion <ArrowUpRight size={14} />
          </Link>
        </nav>
        <Link to="/register" className="hc-button hc-button-small">
          Ouvrir mon espace <ArrowUpRight size={17} />
        </Link>
      </header>

      <main>
        <div className="hc-cinematic">
          <section className="hc-stage" aria-labelledby="hc-title">
            <div className="hc-stage-top">
              <span>
                <i /> UTILITÉ NUMÉRIQUE. PRÉCISION WRX.
              </span>
              <button
                type="button"
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: "instant" });
                  setQuiet(!quiet);
                }}
                aria-pressed={quiet}
              >
                {quiet ? "Activer le mouvement" : "Réduire le mouvement"}
              </button>
            </div>
            <div className="hc-hero-copy">
              <p className="hc-mono">CRÉER / PARTAGER / SÉCURISER / MESURER</p>
              <h1 id="hc-title">
                DU SENS.
                <br />
                <span>DU SIGNAL.</span>
              </h1>
              <div className="hc-hero-intro">
                <p>
                  Vos idées méritent de circuler.
                  <br />
                  Donnez-leur les bons formats.
                </p>
              </div>
            </div>

            <div className="hc-scene-copy">
              <p className="hc-mono">01 / METTRE L’INFORMATION EN MOUVEMENT</p>
              <h2>
                Une intention.
                <br />
                <span>Plusieurs formats.</span>
              </h2>
              <p>
                Une carte pour se présenter. Un lien pour partager.
                <br />
                Un QR pour ouvrir le passage.
              </p>
            </div>
            <div className="hc-orbit">
              <div className="hc-press-plane" aria-hidden="true">
                <div className="hc-plane-float">
                  <span>W / RX</span>
                  <div className="hc-plane-rules" />
                </div>
              </div>
              <div className="hc-card-object">
                <div className="hc-card-float">
                  <div className="hc-object-meta">
                    <span>01 / IDENTITÉ</span>
                    <div
                      className="hc-card-switch"
                      role="group"
                      aria-label="Face de la carte illustrative"
                    >
                      <button
                        type="button"
                        aria-pressed={side === "front"}
                        onClick={() => setSide("front")}
                      >
                        Recto
                      </button>
                      <button
                        type="button"
                        aria-pressed={side === "back"}
                        onClick={() => setSide("back")}
                      >
                        Verso
                      </button>
                    </div>
                  </div>
                  <div className="hc-real-card">
                    <BusinessCardArtwork document={conceptCard} side={side} />
                  </div>
                  <p className="hc-art-caption">
                    Votre identité. Prête à imprimer.
                  </p>
                </div>
              </div>
              <div className="hc-qr-object">
                <div className="hc-qr-float">
                  <span className="hc-mono">03 / ENCODAGE</span>
                  <QRCodeSVG
                    value="https://example.com"
                    size={150}
                    level="M"
                    marginSize={2}
                    bgColor="transparent"
                    fgColor="#151a20"
                  />
                  <span className="hc-qr-corner" aria-hidden="true">
                    ↗
                  </span>
                  <p className="hc-art-caption">Un point d’entrée physique.</p>
                </div>
              </div>
              <div className="hc-link-object">
                <div className="hc-link-float">
                  <span className="hc-mono">02 / ADRESSE COURTE</span>
                  <div>
                    <span>
                      wrx.li<span>/bonjour</span>
                    </span>
                    <ArrowUpRight size={25} />
                  </div>
                  <p className="hc-art-caption">
                    Moins de caractères. Même destination.
                  </p>
                </div>
              </div>
            </div>
            <div className="hc-wordmark" aria-hidden="true">
              WRX
            </div>
            <div className="hc-hero-foot">
              <span>LE NUMÉRIQUE, BIEN OUTILLÉ.</span>
              <p>
                Pour les indépendants,
                <br />
                les équipes et les idées qui avancent.
              </p>
              <span>DÉFILER POUR EXPLORER ↓</span>
            </div>
            <div className="hc-stage-bottom">
              <span>COMPOSITIONS ILLUSTRATIVES / OUTILS DISTINCTS</span>
              <div className="hc-progress">
                <span className="hc-progress-fill" />
              </div>
              <span>WRX — 001</span>
            </div>
          </section>

          <section className="hc-manifesto" aria-label="Notre approche">
            <div className="hc-mono">LA FORME SERT L’USAGE.</div>
            <p>
              Moins de friction.
              <br />
              Plus de <span>portée.</span>
              <MoveUpRight aria-hidden="true" />
            </p>
            <div className="hc-manifesto-note">
              Cinq outils précis dans un même espace.
              <br />
              De ce que vous créez à ce que vous mesurez.
            </div>
          </section>

          <section
            className="hc-control-scene"
            aria-labelledby="hc-control-title"
          >
            <div className="hc-section-label">
              <span className="hc-mono">02 / GARDER LA MAIN</span>
              <Plus size={18} aria-hidden="true" />
            </div>
            <div className="hc-control-heading">
              <h2 id="hc-control-title">
                La puissance
                <br />
                est dans le <span>contrôle.</span>
              </h2>
              <p>
                Créer n’est qu’un début.
                <br />
                Choisissez la robustesse de vos mots de passe.
                <br />
                Comprenez l’activité de vos liens et QR suivis.
              </p>
            </div>
          </section>
          <svg
            className="hc-route-bridge"
            viewBox="0 0 1000 1000"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path d="M 735 735 C 660 700 545 670 365 665" />
            <circle cx="735" cy="735" r="7" />
          </svg>
        </div>

        <section className="hc-control" aria-label="Mots de passe et analytics">
          <div className="hc-control-pair">
            <article className="hc-security">
              <div className="hc-control-kicker">
                <ShieldCheck size={20} />
                <span className="hc-mono">
                  MOTS DE PASSE / GÉNÉRATION LOCALE
                </span>
              </div>
              <div
                className="hc-password"
                aria-label={
                  revealed
                    ? "Exemple de mot de passe, ne pas utiliser"
                    : "Exemple masqué"
                }
              >
                <span aria-hidden="true">
                  {(revealed ? "m7#Q!r9@K2$vP8&x" : "••••••••••••••••")
                    .split("")
                    .map((character, index) => (
                      <span
                        className="hc-password-char"
                        key={index}
                        style={{ animationDelay: `${index * 85}ms` }}
                      >
                        {character}
                      </span>
                    ))}
                </span>
              </div>
              <div className="hc-password-spec">
                <span>16 CARACTÈRES</span>
                <span>EXEMPLE · NE PAS UTILISER</span>
              </div>
              <button
                type="button"
                className="hc-text-button"
                aria-pressed={revealed}
                onClick={() => setRevealed(!revealed)}
              >
                {revealed ? "Masquer l’exemple" : "Révéler l’exemple"}{" "}
                <Plus size={16} />
              </button>
              <p>
                Des mots de passe créés sur votre appareil.
                <br />À utiliser là où vous en avez besoin.
              </p>
            </article>
            <article className="hc-signals">
              <div className="hc-control-kicker">
                <span className="hc-signal-dot" />
                <span className="hc-mono">ANALYTICS / LIRE L’ACTIVITÉ</span>
              </div>
              <SignalChart />
              <div className="hc-chart-axis">
                <span>CLICS & SCANS SUIVIS</span>
                <span>DONNÉES ILLUSTRATIVES</span>
              </div>
              <p>
                Derrière chaque clic, un signal.
                <br />
                Visualisez l’activité réellement enregistrée.
              </p>
            </article>
          </div>
        </section>

        <section
          id="hc-tools"
          className="hc-tools"
          aria-labelledby="hc-tools-title"
        >
          <div className="hc-section-label">
            <span className="hc-mono">03 / VOTRE BOÎTE À OUTILS</span>
            <span className="hc-mono">CINQ POINTS DE DÉPART.</span>
          </div>
          <div className="hc-tools-layout">
            <div className="hc-tool-summary">
              <h2 id="hc-tools-title">
                À chaque idée,
                <br />
                son outil.
              </h2>
              <div className={`hc-tool-spec hc-accent-${selected.accent}`}>
                <span className="hc-tool-number">
                  0{activeTool + 1}
                  <span> / 05</span>
                </span>
                <span className="hc-mono">{selected.code}</span>
                <p>{selected.detail}</p>
              </div>
              <p className="hc-tool-note">
                Chaque outil a son rôle.
                <br />À vous de choisir le prochain geste.
              </p>
            </div>
            <div className="hc-tool-list">
              {conceptTools.map((tool, index) => (
                <Link
                  key={tool.path}
                  to={tool.path}
                  onMouseEnter={() => setActiveTool(index)}
                  onFocus={() => setActiveTool(index)}
                  className={`hc-tool-row${activeTool === index ? " is-active" : ""}`}
                >
                  <span className="hc-mono">0{index + 1}</span>
                  <div>
                    <span className="hc-tool-verb">{tool.verb}</span>
                    <h3>{tool.name}</h3>
                    <p>{tool.detail}</p>
                  </div>
                  <ArrowUpRight aria-hidden="true" />
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="hc-final" aria-labelledby="hc-final-title">
          <span className="hc-mono">VOTRE PROCHAIN SIGNAL COMMENCE ICI.</span>
          <div>
            <h2 id="hc-final-title">
              À vous
              <br />
              d’émettre.
            </h2>
            <div className="hc-final-copy">
              <p>
                Créez votre espace. Choisissez un outil.
                <br />
                Donnez une forme utile à votre information.
              </p>
              <Link to="/register" className="hc-button">
                Créer mon compte <ArrowUpRight size={18} />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <footer className="hc-footer">
        <Link to="/" className="hc-brand" aria-label="WRX Generator — accueil">
          <BrandLogo />
          <span>WRX GENERATOR</span>
        </Link>
        <span>CRÉER. PARTAGER. SÉCURISER. MESURER.</span>
      </footer>
    </div>
  );
}
