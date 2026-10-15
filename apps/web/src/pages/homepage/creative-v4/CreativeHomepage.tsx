import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  ArrowRight,
  Copy,
  Download,
  Check,
  Link2,
  QrCode,
  CreditCard,
  Contact,
  Mail,
  KeyRound,
  Activity,
  Fingerprint,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { BrandLogo } from "../../../components/BrandLogo";
import {
  createBrandConstruction,
  type BrandConstruction,
} from "../brand-hero/createBrandConstruction";
import { sampleEvents } from "../brand-hero/demoRecords";
import { createCreativeMotion } from "./createCreativeMotion";
import "./creative-homepage.css";

export const STABLE_LINK = "https://wrx.example/r/azur";
export const MANAGED_QR = "https://wrx.example/q/azur-demo";
export const STATIC_CARD = "https://wrx.example/c/nora-kane";
const destinations = [
  "https://atelier-azur.example/portfolio",
  "https://atelier-azur.example/contact",
];
const tools = [
  {
    name: "Liens",
    icon: Link2,
    copy: "Une adresse courte. Une destination que vous pilotez.",
  },
  {
    name: "QR codes",
    icon: QrCode,
    copy: "Du contenu direct ou une entrée gérée par un Lien WRX.",
  },
  {
    name: "Cartes de visite",
    icon: CreditCard,
    copy: "Une identité composée pour le papier, exportable et imprimable.",
  },
  {
    name: "Cartes digitales",
    icon: Contact,
    copy: "Une carte publiée, prête à partager. Un contact prêt à enregistrer.",
  },
  {
    name: "Signatures",
    icon: Mail,
    copy: "Votre identité dans vos emails. Une copie indépendante à installer.",
  },
  {
    name: "Mots de passe",
    icon: KeyRound,
    copy: "Un générateur indépendant pour composer des mots de passe.",
  },
  {
    name: "Analytics",
    icon: Activity,
    copy: "Les clics de vos liens et les scans de vos QR gérés.",
  },
  {
    name: "Profil & identité",
    icon: Fingerprint,
    copy: "Une base de marque réutilisable dans vos créations, sans synchronisation implicite.",
  },
];

function Proof({ value, label }: { value: string; label: string }) {
  return (
    <div
      className="v4-proof"
      role="img"
      aria-label={label}
      data-payload={value}
    >
      <QRCodeSVG
        aria-hidden="true"
        value={value}
        size={180}
        marginSize={4}
        level="M"
        bgColor="#f0eee8"
        fgColor="#111315"
      />
    </div>
  );
}
function CTA({
  children = "Créer mon espace WRX",
}: {
  children?: React.ReactNode;
}) {
  return (
    <Link className="v4-cta" to="/register">
      <span data-magnetic>
        {children}
        <ArrowUpRight size={20} aria-hidden="true" />
      </span>
    </Link>
  );
}

export function RoutingInstrument() {
  const [destination, setDestination] = useState(0);
  const [managed, setManaged] = useState(true);
  return (
    <article
      className="v4-routing"
      data-mode={managed ? "managed" : "direct"}
      data-destination={destination}
      data-stop="routing"
      aria-labelledby="v4-routing-title"
    >
      <div className="v4-meta">01 / ROUTER · EXEMPLE INTERACTIF</div>
      <h2 id="v4-routing-title">
        La destination bouge.
        <br />
        <em>Le lien reste.</em>
      </h2>
      <div className="v4-route-bed" data-destination={destination}>
        <span className="v4-route-word" aria-hidden="true">
          ROUTE.
        </span>
        <div className="v4-routing-rail" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
        <div className="v4-link">
          <span className="v4-index" />
          <small>VOTRE LIEN WRX</small>
          <code>{STABLE_LINK.replace("https://", "")}</code>
        </div>
        <svg
          viewBox="0 0 1000 400"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            className="v4-route-channel"
            d="M70 200 H430 Q480 200 480 150 V90 Q480 60 520 60 H910 M480 150 V310 Q480 340 520 340 H910"
          />
          <path
            className="v4-route-selected"
            key={destination}
            pathLength="1"
            d={
              destination
                ? "M70 200 H430 Q480 200 480 250 V310 Q480 340 520 340 H910"
                : "M70 200 H430 Q480 200 480 150 V90 Q480 60 520 60 H910"
            }
          />
        </svg>
        <div className="v4-endpoint" aria-live="polite">
          <small>DESTINATION {destination ? "B" : "A"} / EXEMPLE</small>
          <strong>{destination ? "Parlons-en." : "Les projets."}</strong>
          <code>{destinations[destination]?.replace("https://", "")}</code>
          <ArrowUpRight size={45} aria-hidden="true" />
        </div>
      </div>
      <div className="v4-switch" aria-label="Destination de démonstration">
        {["Portfolio", "Prendre contact"].map((name, i) => (
          <button
            key={name}
            aria-pressed={destination === i}
            onClick={() => setDestination(i)}
          >
            {name}
            <ArrowUpRight size={15} aria-hidden="true" />
          </button>
        ))}
      </div>
      <div className="v4-encoding">
        <div className="v4-encoding-plate">
          <span className="v4-plate-index" aria-hidden="true">
            ↗
          </span>
          <Proof
            value={managed ? MANAGED_QR : destinations[destination]!}
            label={
              managed
                ? "QR géré : entrée WRX stable de démonstration"
                : "QR direct : destination encodée"
            }
          />
          <code>
            {managed ? "wrx.example/q/azur-demo" : "atelier-azur.example"}
          </code>
          <span className="v4-plate-caption">
            {managed ? "QR GÉRÉ / ENTRÉE STABLE" : "QR DIRECT / CONTENU ENCODÉ"}
          </span>
        </div>
        <div>
          <div className="v4-switch" aria-label="Mode de QR">
            <button aria-pressed={managed} onClick={() => setManaged(true)}>
              QR géré
            </button>
            <button aria-pressed={!managed} onClick={() => setManaged(false)}>
              QR direct
            </button>
          </div>
          <h3>
            {managed
              ? "Même QR. Nouvelle destination."
              : "Le contenu est dans le QR."}
          </h3>
          <p>
            {managed
              ? "Entrée QR stable → Lien WRX → destination actuelle."
              : "Changer le contenu demande un nouveau QR."}
          </p>
          <span className="v4-amber">
            {managed ? "ENTRÉE WRX STABLE" : "ENCODAGE DIRECT"}
          </span>
        </div>
      </div>
    </article>
  );
}

export function IdentityInstrument() {
  const [opened, setOpened] = useState(false);
  const [copied, setCopied] = useState("");
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(STATIC_CARD);
      setCopied("Lien copié");
    } catch {
      setCopied("Copie indisponible");
    }
  };
  const save = () => {
    const text = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      "FN:Nora Kane",
      "N:Kane;Nora;;;",
      "ORG:Atelier Azur",
      "TITLE:Direction créative",
      "EMAIL:nora@atelier-azur.example",
      "URL:https://atelier-azur.example",
      "END:VCARD",
    ].join("\r\n");
    const url = URL.createObjectURL(
      new Blob([text], { type: "text/vcard;charset=utf-8" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "nora-kane-demo.vcf";
    anchor.click();
    URL.revokeObjectURL(url);
  };
  return (
    <article
      className="v4-identity"
      data-stop="identity"
      data-open={opened}
      aria-labelledby="v4-identity-title"
    >
      <div className="v4-meta">02 / RENCONTRER · AUTRE USAGE, QR STATIQUE</div>
      <h2 id="v4-identity-title">
        Une poignée de main.
        <br />
        <em>Un contact qui reste.</em>
      </h2>
      <span className="v4-identity-word" aria-hidden="true">
        En main.
      </span>
      <div className="v4-physical-shell" data-depth>
        <div className="v4-card-lean">
          <div className="v4-business">
            <span className="v4-monogram">
              a<span>z</span>.
            </span>
            <span className="v4-business-company">
              ATELIER AZUR / DESIGN INDÉPENDANT
            </span>
            <div>
              <strong>Nora Kane</strong>
              <p>Direction créative</p>
              <span>nora@atelier-azur.example</span>
            </div>
            <button
              className="v4-card-qr"
              onClick={() => setOpened(!opened)}
              aria-pressed={opened}
              aria-controls="v4-public-preview"
              aria-label="Découvrir la carte digitale de démonstration"
            >
              <Proof
                value={STATIC_CARD}
                label="QR statique de la carte publiée de démonstration"
              />
              <span>OUVRIR LA CARTE ↗</span>
            </button>
          </div>
        </div>
      </div>
      <div className="v4-public-shell" id="v4-public-preview">
        <div className="v4-public-top">
          <span>CARTE PUBLIÉE / EXEMPLE</span>
          <span>↗</span>
        </div>
        <div className="v4-avatar">NK</div>
        <h3>Nora Kane</h3>
        <p>Direction créative · Atelier Azur</p>
        <a href="mailto:nora@atelier-azur.example">nora@atelier-azur.example</a>
        <div className="v4-public-actions">
          <button onClick={save}>
            <Download size={16} aria-hidden="true" />
            Enregistrer le contact
          </button>
          <button onClick={copy}>
            <Copy size={16} aria-hidden="true" />
            Copier le lien
          </button>
        </div>
        <span role="status">{copied}</span>
        <code>wrx.example/c/nora-kane</code>
      </div>
      <p className="v4-identity-note">
        Ce QR statique ouvre la carte publiée.
        <br />
        Il ne devient pas un QR géré.
      </p>
      <button
        className="v4-text-action"
        onClick={() => setOpened(!opened)}
        aria-pressed={opened}
        aria-controls="v4-public-preview"
      >
        {opened ? "Revenir au papier" : "Du papier à la carte digitale"}
        <ArrowRight size={20} aria-hidden="true" />
      </button>
    </article>
  );
}

export function SignatureInstrument() {
  const [layout, setLayout] = useState(false);
  const [status, setStatus] = useState("");
  const output = useRef<HTMLDivElement>(null);
  const copy = async () => {
    try {
      if (
        navigator.clipboard.write &&
        typeof ClipboardItem !== "undefined" &&
        output.current
      ) {
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/html": new Blob([output.current.innerHTML], {
              type: "text/html",
            }),
            "text/plain": new Blob([output.current.innerText], {
              type: "text/plain",
            }),
          }),
        ]);
      } else {
        await navigator.clipboard.writeText(
          "Nora Kane\nDirection créative · Atelier Azur\nnora@atelier-azur.example",
        );
      }
      setStatus("Signature copiée");
    } catch {
      setStatus("Copie indisponible dans ce navigateur");
    }
  };
  return (
    <section className="v4-signature" aria-labelledby="v4-signature-title">
      <div>
        <span className="v4-meta">03 / CORRESPONDRE</span>
        <h2 id="v4-signature-title">
          Laissez une
          <br />
          <em>bonne impression.</em>
        </h2>
        <p>
          Une copie de votre identité,
          <br />
          modifiable indépendamment.
        </p>
        <div className="v4-switch">
          <button aria-pressed={!layout} onClick={() => setLayout(false)}>
            Compacte
          </button>
          <button aria-pressed={layout} onClick={() => setLayout(true)}>
            Éditoriale
          </button>
        </div>
      </div>
      <div className="v4-identity-parts" aria-hidden="true">
        <span className="v4-part-mark">az.</span>
        <span className="v4-part-name">Nora Kane</span>
        <span className="v4-part-role">Direction créative</span>
        <span className="v4-part-company">Atelier Azur</span>
        <span className="v4-part-contact">nora@atelier-azur.example</span>
        <i />
      </div>
      <div className="v4-email" data-layout={layout}>
        <div className="v4-email-header">
          <span>NOUVEAU MESSAGE / EXEMPLE</span>
          <span>↗</span>
        </div>
        <p>
          Bonjour,
          <br />
          <br />
          Voici les premiers éléments du projet.
          <br />À très bientôt,
        </p>
        <div ref={output} className="v4-signature-output">
          <table
            cellPadding={0}
            cellSpacing={0}
            style={{ fontFamily: "Arial,sans-serif", color: "#202327" }}
          >
            <tbody>
              <tr>
                <td
                  style={{
                    paddingRight: layout ? 28 : 16,
                    borderRight: "2px solid #507fff",
                    fontSize: layout ? 45 : 28,
                    fontWeight: 700,
                  }}
                >
                  az.
                </td>
                <td style={{ paddingLeft: 20 }}>
                  <strong style={{ fontSize: 17 }}>Nora Kane</strong>
                  <br />
                  <span style={{ fontSize: 12 }}>
                    Direction créative · Atelier Azur
                  </span>
                  <br />
                  <a
                    href="mailto:nora@atelier-azur.example"
                    style={{ color: "#3459bd", fontSize: 12 }}
                  >
                    nora@atelier-azur.example
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="v4-email-footer">
          <button onClick={copy}>
            {status === "Signature copiée" ? (
              <Check size={16} aria-hidden="true" />
            ) : (
              <Copy size={16} aria-hidden="true" />
            )}
            Copier la signature
          </button>
          <span>À installer dans votre messagerie.</span>
        </div>
        <span role="status">{status}</span>
      </div>
    </section>
  );
}

export function ActivityInstrument() {
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(0);
  const events = sampleEvents.filter(
    (event) => filter === "all" || event.type === filter,
  );
  const event = events[selected] ?? events[0]!;
  return (
    <section className="v4-activity" aria-labelledby="v4-activity-title">
      <div className="v4-activity-heading">
        <span className="v4-meta">
          04 / OBSERVER · DONNÉES DE DÉMONSTRATION
        </span>
        <h2 id="v4-activity-title">
          Les passages
          <br />
          <em>laissent un signal.</em>
        </h2>
        <p>
          Les clics sur vos liens.
          <br />
          Les scans de vos QR gérés.
          <br />
          <small>Pas les vues des cartes ou des signatures.</small>
        </p>
      </div>
      <div className="v4-event-instrument">
        <div className="v4-switch" aria-label="Filtrer les événements">
          {[
            ["all", "Tous"],
            ["click", "Clics"],
            ["scan", "Scans"],
          ].map(([value, name]) => (
            <button
              key={value}
              aria-pressed={filter === value}
              onClick={() => {
                setFilter(value!);
                setSelected(0);
              }}
            >
              {name}
            </button>
          ))}
        </div>
        <div className="v4-event-count">
          <strong>{events.length.toString().padStart(2, "0")}</strong>
          <span>
            ÉVÉNEMENTS
            <br />
            DANS CET EXEMPLE
          </span>
        </div>
        <div className="v4-event-line">
          <span className="v4-activity-fill" />
          {events.map((item, index) => (
            <button
              key={item.time}
              style={{ left: `${(item.minute / 120) * 88 + 5}%` }}
              aria-label={`${item.type === "click" ? "Clic de lien" : "Scan de QR géré"} à ${item.time}`}
              aria-pressed={index === selected}
              onClick={() => setSelected(index)}
            >
              <span className={item.type === "scan" ? "scan" : ""} />
              <small>{item.time}</small>
            </button>
          ))}
        </div>
        <div className="v4-event-details" aria-live="polite">
          <span>{event.time} / 08 OCT. 2026</span>
          <strong>
            {event.type === "click"
              ? "Clic sur le Lien WRX"
              : "Scan du QR géré"}
          </strong>
          <code>{event.type === "click" ? STABLE_LINK : MANAGED_QR}</code>
        </div>
        <p>4 clics · 3 scans · une fenêtre illustrative de deux heures.</p>
      </div>
      <div className="v4-event-field" data-filter={filter} aria-hidden="true">
        <div className="v4-field-axis">
          <span>CLICS</span>
          <span>SCANS QR GÉRÉ</span>
        </div>
        {sampleEvents.map((item, index) => (
          <div
            key={item.time}
            className={`v4-event-strike ${item.type}`}
            style={{
              left: `${8 + index * 13}%`,
              top: `${item.type === "click" ? 18 : 51}%`,
            }}
          >
            <svg className="v4-arrival-path" viewBox="0 0 180 160">
              <path pathLength="1" d="M170 2 H100 Q21 2 21 80 V140" />
            </svg>
            <i className="v4-impact" />
            <i className="v4-strike-trail" />
            <span className="v4-strike-head">
              {item.type === "click" ? "↗" : "⊞"}
            </span>
            <div className="v4-strike-record">
              <small>{item.time}</small>
              <span>{item.type === "click" ? "CLIC" : "SCAN"}</span>
            </div>
          </div>
        ))}
        <span className="v4-field-caption">
          ACTIVITÉ ILLUSTRATIVE · CHAQUE PASSAGE LAISSE UN ENREGISTREMENT
        </span>
      </div>
    </section>
  );
}

function WorkspaceInstrument() {
  const [tool, setTool] = useState(0);
  const selected = tools[tool]!;
  const Icon = selected.icon;
  return (
    <section className="v4-workspace" aria-labelledby="v4-workspace-title">
      <div className="v4-meta">05 / VOTRE ENVIRONNEMENT</div>
      <h2 id="v4-workspace-title">
        Un espace.
        <br />
        <em>Votre manière de faire.</em>
      </h2>
      <div className="v4-workspace-assembly" aria-hidden="true">
        <div className="v4-assembly-bar">
          <strong>WRX</strong>
          <span>VOTRE ESPACE DE CRÉATION</span>
          <i />
        </div>
        <div className="v4-assembly-route">
          <Link2 size={25} />
          <code>wrx.example/r/azur</code>
          <i />
        </div>
        <div className="v4-assembly-card">
          <span>az.</span>
          <strong>Nora Kane</strong>
          <small>Direction créative</small>
        </div>
        <div className="v4-assembly-events">
          <Activity size={24} />
          <span>04 CLICS</span>
          <span>03 SCANS</span>
          <small>DÉMONSTRATION</small>
        </div>
        <div className="v4-assembly-rule" />
      </div>
      <div className="v4-tool-browser">
        <div className="v4-tools" aria-label="Outils WRX">
          {tools.map((item, index) => (
            <button
              key={item.name}
              onClick={() => setTool(index)}
              aria-pressed={index === tool}
            >
              <item.icon size={21} aria-hidden="true" />
              <span>{item.name}</span>
              <ArrowUpRight size={18} aria-hidden="true" />
            </button>
          ))}
        </div>
        <div className="v4-tool-preview" aria-live="polite">
          <Icon size={66} strokeWidth={1} aria-hidden="true" />
          <h3>{selected.name}</h3>
          <p>{selected.copy}</p>
          <span>
            LATÉRALE / DOCK / LANCEUR
            <br />5 ACCENTS · CLAIR / SOMBRE / SYSTÈME
          </span>
        </div>
      </div>
    </section>
  );
}

export default function CreativeHomepage() {
  const root = useRef<HTMLElement>(null);
  const object = useRef<HTMLDivElement>(null);
  const [motion, setMotion] = useState(true);
  useEffect(() => {
    const title = document.title;
    document.title = "WRX — Faites circuler vos idées.";
    let construction: BrandConstruction | undefined;
    try {
      if (object.current)
        construction = createBrandConstruction(object.current);
    } catch {
      if (object.current) object.current.dataset["fallback"] = "true";
    }
    const dispose = root.current
      ? createCreativeMotion(root.current, construction, motion)
      : undefined;
    return () => {
      dispose?.();
      construction?.dispose();
      document.title = title;
    };
  }, [motion]);
  return (
    <main className="v4-page" ref={root} data-motion={motion}>
      <a className="v4-skip" href="#v4-story">
        Aller aux outils
      </a>
      <header className="v4-header">
        <Link to="/" aria-label="WRX, accueil">
          <BrandLogo />
          <strong>WRX</strong>
        </Link>
        <nav aria-label="Navigation publique">
          <a href="#v4-story">Les outils</a>
          <Link to="/login">Se connecter ↗</Link>
        </nav>
        <button aria-pressed={!motion} onClick={() => setMotion(!motion)}>
          {motion ? "Réduire le mouvement" : "Activer le mouvement"}
        </button>
      </header>
      <section className="v4-hero" aria-labelledby="v4-title">
        <div className="v4-hero-field" aria-hidden="true">
          {Array.from({ length: 28 }, (_, index) => (
            <i
              key={index}
              style={{
                left: `${37 + (index % 7) * 9}%`,
                top: `${12 + Math.floor(index / 7) * 22}%`,
              }}
            />
          ))}
          <svg viewBox="0 0 1000 600" preserveAspectRatio="none">
            <path
              className="v4-hero-route"
              pathLength="1"
              d="M780 80 V280 Q780 380 630 380 H480 Q380 380 380 480 V600"
            />
          </svg>
        </div>
        <div
          className="v4-hero-object"
          ref={object}
          role="img"
          aria-label="Construction tridimensionnelle WRX en graphite"
        >
          <span className="v4-object-fallback">WRX</span>
        </div>
        <div className="v4-hero-copy">
          <span className="v4-meta">VOTRE BOÎTE À OUTILS DIGITALE</span>
          <h1 id="v4-title">
            Créez.
            <br />
            <em>Faites circuler.</em>
          </h1>
          <p>
            Du lien à la rencontre.
            <br />
            Des outils pour mettre vos idées en usage.
          </p>
          <CTA />
        </div>
        <div className="v4-hero-foot">
          <span>CRÉER / PARTAGER / SÉCURISER / OBSERVER</span>
          <a href="#v4-story">Entrez dans WRX ↓</a>
        </div>
      </section>
      <section className="v4-intro" id="v4-story">
        <span className="v4-meta">UNE CRÉATION N’EST QUE LE DÉBUT.</span>
        <p>
          Une adresse.
          <br />
          Un support.
          <br />
          <em>Quelqu’un à l’autre bout.</em>
        </p>
        <span>
          Liens, QR, cartes et signatures.
          <br />
          Des outils différents. Un même espace.
        </span>
        <div className="v4-approach" aria-hidden="true">
          <span>UNE DESTINATION / PLUSIEURS SUPPORTS</span>
          <svg viewBox="0 0 1000 32" preserveAspectRatio="none">
            <path
              className="v4-approach-path"
              pathLength="1"
              d="M0 16 H920 Q960 16 1000 4"
            />
            <circle cx="1000" cy="4" r="4" />
          </svg>
        </div>
      </section>
      <section className="v4-journey" aria-label="Du lien à la rencontre">
        <div className="v4-journey-stage">
          <div className="v4-depth-reference" aria-hidden="true">
            <span>AXE DE ROUTAGE</span>
            <i />
            <span>ORIGINE → SORTIE</span>
          </div>
          <div className="v4-journey-top">
            <span>LIEN → QR / PAPIER → DIGITAL</span>
            <div>
              <button data-journey-go="routing">Explorer le routage</button>
              <button data-journey-go="identity">Explorer les cartes</button>
            </div>
          </div>
          <div className="v4-entry-shell">
            <div className="v4-journey-track">
              <div className="v4-world-line" aria-hidden="true">
                <i className="v4-travelling-signal" />
              </div>
              <RoutingInstrument />
              <div className="v4-handoff" aria-hidden="true">
                <span>
                  PRENEZ
                  <br />
                  <em>CONTACT.</em>
                </span>
                <i />
              </div>
              <IdentityInstrument />
              <div className="v4-release-runway" aria-hidden="true">
                <span>LA MÊME IDENTITÉ / AUTRE SUPPORT</span>
                <div className="v4-release-mail">
                  <div className="v4-release-mail-header">
                    <span>03 / CORRESPONDRE</span>
                    <span>NOUVEAU MESSAGE · EXEMPLE</span>
                  </div>
                  <p>
                    Bonjour,
                    <br />
                    Voici les premiers éléments du projet.
                    <br />À très bientôt,
                  </p>
                  <div className="v4-release-signature">
                    <strong>az.</strong>
                    <span>
                      <b>Nora Kane</b>
                      <small>Direction créative · Atelier Azur</small>
                      <small>nora@atelier-azur.example</small>
                    </span>
                  </div>
                </div>
                <svg viewBox="0 0 1200 900" preserveAspectRatio="none">
                  <path
                    className="v4-release-path"
                    pathLength="1"
                    d="M0 635 H580 C700 635 760 635 820 680 C900 740 930 800 930 900"
                  />
                  <circle cx="930" cy="900" r="6" />
                </svg>
              </div>
            </div>
          </div>
          <div className="v4-progress" aria-hidden="true">
            <span />
          </div>
        </div>
      </section>
      <SignatureInstrument />
      <ActivityInstrument />
      <WorkspaceInstrument />
      <footer className="v4-final">
        <span className="v4-meta">À VOUS DE JOUER.</span>
        <h2>
          Créez quelque chose
          <br />
          <em>qui circule.</em>
        </h2>
        <CTA />
        <Link to="/login">Se connecter ↗</Link>
        <div>
          <strong>WRX</strong>
          <span>CRÉER. PARTAGER. SÉCURISER. OBSERVER.</span>
        </div>
      </footer>
    </main>
  );
}
