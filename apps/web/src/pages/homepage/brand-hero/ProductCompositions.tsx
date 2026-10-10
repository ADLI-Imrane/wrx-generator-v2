import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowUpRight,
  ArrowDown,
  Copy,
  Download,
  Share2,
  Check,
} from "lucide-react";
import { useCompositionMotion } from "./useCompositionMotion";
import { sampleEvents } from "./demoRecords";

export const DEMO_LINK = "https://wrx.example/r/azur";
export const MANAGED_INGRESS = "https://wrx.example/q/azur-demo";
export const CARD_URL = "https://wrx.example/c/nora-kane";
const destinations = [
  "atelier-azur.example/portfolio",
  "atelier-azur.example/contact",
];
const identity = {
  name: "Nora Kane",
  role: "Direction créative",
  company: "Atelier Azur",
  email: "nora@atelier-azur.example",
};
const vcard = [
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

function Label({ children }: { children: React.ReactNode }) {
  return <span className="pc-label">{children}</span>;
}
function QrProof({
  value,
  label,
  size = 176,
}: {
  value: string;
  label: string;
  size?: number;
}) {
  return (
    <div className="pc-qr" role="img" aria-label={label} data-payload={value}>
      <QRCodeSVG
        value={value}
        size={size}
        level="M"
        marginSize={4}
        bgColor="#F0EEE8"
        fgColor="#111315"
      />
    </div>
  );
}

export function RoutingComposition() {
  const [destination, setDestination] = useState(0);
  const [managed, setManaged] = useState(true);
  return (
    <section
      className="bh-boundary pc-routing"
      aria-labelledby="pc-routing-title"
    >
      <div className="bh-route-address">
        <h2 id="bh-route-title">VOTRE LIEN WRX</h2>
        <p>wrx.example/r/azur</p>
        <span>Adresse de démonstration</span>
      </div>
      <div className="pc-routing-intro">
        <Label>01 / METTRE EN CIRCULATION</Label>
        <h2 id="pc-routing-title">
          Changez la destination.
          <br />
          <span>Gardez l’adresse.</span>
        </h2>
      </div>
      <div className="pc-destination-instrument">
        <div
          className="pc-destination-choices"
          aria-label="Destination de démonstration"
        >
          {["Portfolio", "Prendre contact"].map((title, index) => (
            <button
              key={title}
              type="button"
              aria-pressed={destination === index}
              onClick={() => setDestination(index)}
            >
              <span>0{index + 1}</span>
              {title}
              <ArrowUpRight size={18} aria-hidden="true" />
            </button>
          ))}
        </div>
        <div className="pc-destination-track" data-destination={destination}>
          <svg
            viewBox="0 0 1000 130"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d={
                destination === 0
                  ? "M 0 12 H 420 Q 450 12 450 42 V 72 H 1000"
                  : "M 0 12 H 570 Q 600 12 600 42 V 100 H 1000"
              }
            />
          </svg>
          <div className="pc-destination-end" aria-live="polite">
            <Label>DESTINATION ACTUELLE</Label>
            <p>{destinations[destination]}</p>
            <span>Exemple interactif · aucune donnée de compte modifiée</span>
          </div>
        </div>
      </div>
      <div className="pc-encoding">
        <div className="pc-encoding-proof">
          <QrProof
            value={
              managed
                ? MANAGED_INGRESS
                : "https://atelier-azur.example/portfolio"
            }
            label={
              managed
                ? "QR géré de démonstration, entrée WRX stable"
                : "QR direct, contenu portfolio encodé directement"
            }
          />
          <Label>{managed ? "ENTRÉE WRX STABLE" : "CONTENU ENCODÉ"}</Label>
          <code>
            {managed
              ? "wrx.example/q/azur-demo"
              : "atelier-azur.example/portfolio"}
          </code>
        </div>
        <div className="pc-encoding-copy">
          <div className="pc-mode" aria-label="Type de QR">
            <button
              type="button"
              aria-pressed={managed}
              onClick={() => setManaged(true)}
            >
              QR géré
            </button>
            <button
              type="button"
              aria-pressed={!managed}
              onClick={() => setManaged(false)}
            >
              QR direct
            </button>
          </div>
          <h3>
            {managed ? (
              <>
                Même QR.
                <br />
                Nouvelle destination.
              </>
            ) : (
              <>
                Le contenu.
                <br />
                Dans le QR.
              </>
            )}
          </h3>
          <p>
            {managed
              ? "Ce QR passe par une entrée WRX stable, reliée à votre lien."
              : "Ici, le contenu est dans le QR. Un autre contenu demande un autre QR."}
          </p>
          <p className="pc-small">
            {managed
              ? "Changez la destination au-dessus : ce QR et votre Lien WRX restent identiques."
              : "Cet exemple direct encode le portfolio. Le sélecteur du Lien WRX ne modifie pas ce contenu."}
          </p>
        </div>
      </div>
    </section>
  );
}

export function IdentityComposition() {
  const root = useRef<HTMLElement>(null);
  const signatureRef = useRef<HTMLDivElement>(null);
  const [feedback, setFeedback] = useState("");
  const [signatureFeedback, setSignatureFeedback] = useState("");
  useCompositionMotion(root, "identity");
  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Nora Kane — identité de démonstration",
          url: CARD_URL,
        });
        setFeedback("Partage effectué.");
      } else {
        await navigator.clipboard.writeText(CARD_URL);
        setFeedback("Adresse de démonstration copiée.");
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      try {
        await navigator.clipboard.writeText(CARD_URL);
        setFeedback("Partage indisponible. Adresse de démonstration copiée.");
      } catch {
        setFeedback("Partage indisponible. Adresse : " + CARD_URL);
      }
    }
  };
  const saveContact = () => {
    const url = URL.createObjectURL(
      new Blob([vcard], { type: "text/vcard;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "nora-kane-demonstration.vcf";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setFeedback("Contact de démonstration téléchargé.");
  };
  const copySignature = async () => {
    try {
      const html = signatureRef.current?.innerHTML ?? "";
      const text = `${identity.name}\n${identity.role} · ${identity.company}\n${identity.email}\natelier-azur.example`;
      if (navigator.clipboard?.write && typeof ClipboardItem !== "undefined")
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/html": new Blob([html], { type: "text/html" }),
            "text/plain": new Blob([text], { type: "text/plain" }),
          }),
        ]);
      else await navigator.clipboard.writeText(text);
      setSignatureFeedback("Signature de démonstration copiée.");
    } catch {
      setSignatureFeedback("Copie indisponible dans ce navigateur.");
    }
  };
  return (
    <section
      className="pc-identity"
      ref={root}
      aria-labelledby="pc-identity-title"
    >
      <div className="pc-paper-entry">
        <Label>02 / UN AUTRE USAGE · QR STATIQUE</Label>
        <h2 id="pc-identity-title">
          Une identité.
          <br />
          <span>Des points de rencontre.</span>
        </h2>
        <div className="pc-source">
          <span className="pc-monogram">AA</span>
          <p>
            Profil / Identité de marque
            <br />
            <strong>Nora Kane · Atelier Azur</strong>
            <small>
              Identité de démonstration · des copies, pas une synchronisation
              permanente.
            </small>
          </p>
        </div>
      </div>
      <div className="pc-identity-pair">
        <div className="pc-physical">
          <div className="pc-paper-card">
            <div className="pc-card-top">
              <span>
                ATELIER
                <br />
                AZUR<span className="pc-card-dot">.</span>
              </span>
              <Label>DESIGN & DIRECTION</Label>
            </div>
            <div className="pc-card-bottom">
              <div>
                <h3>{identity.name}</h3>
                <p>{identity.role}</p>
                <span>
                  {identity.email}
                  <br />
                  atelier-azur.example
                </span>
              </div>
              <QrProof
                value={CARD_URL}
                label="QR statique vers la carte publiée de démonstration"
                size={104}
              />
            </div>
          </div>
          <p className="pc-static-note">
            Ce QR statique ouvre la carte publiée.
          </p>
        </div>
        <div className="pc-public-card">
          <div className="pc-public-address">
            <span />
            wrx.example/c/nora-kane
          </div>
          <div className="pc-public-inner">
            <Label>CARTE PUBLIÉE · DÉMONSTRATION</Label>
            <div className="pc-avatar">NK</div>
            <h3>Nora Kane</h3>
            <p>
              Direction créative
              <br />
              <strong>Atelier Azur</strong>
            </p>
            <div className="pc-contact-value">
              <span>E-MAIL</span>
              {identity.email}
            </div>
            <div className="pc-contact-value">
              <span>SITE WEB</span>atelier-azur.example
            </div>
            <div className="pc-public-actions">
              <button type="button" onClick={share}>
                <Share2 size={16} aria-hidden="true" />
                Partager
              </button>
              <button type="button" onClick={saveContact}>
                <Download size={16} aria-hidden="true" />
                Enregistrer le contact
              </button>
            </div>
            <p className="pc-feedback" role="status">
              {feedback}
            </p>
          </div>
        </div>
      </div>
      <div className="pc-signature">
        <div className="pc-signature-copy">
          <Label>UNE COPIE / UN NOUVEAU SUPPORT</Label>
          <h2>
            La même identité.
            <br />
            <span>Un autre support.</span>
          </h2>
          <p>Une copie, modifiable indépendamment.</p>
        </div>
        <div className="pc-email">
          <div className="pc-email-header">
            <Label>NOUVEAU MESSAGE</Label>
            <span>À : votre prochain contact</span>
            <span>Objet : Faisons connaissance</span>
          </div>
          <div className="pc-email-body">
            <p>
              Bonjour,
              <br />
              <br />
              Au plaisir de construire la suite ensemble.
            </p>
            <div ref={signatureRef}>
              <table
                cellPadding="0"
                cellSpacing="0"
                style={{
                  borderCollapse: "collapse",
                  fontFamily: "Arial, sans-serif",
                  color: "#202327",
                }}
              >
                <tbody>
                  <tr>
                    <td
                      style={{
                        borderLeft: "3px solid #507fff",
                        paddingLeft: "16px",
                      }}
                    >
                      <strong style={{ fontSize: "20px" }}>Nora Kane</strong>
                      <br />
                      <span style={{ fontSize: "13px", lineHeight: "1.8" }}>
                        Direction créative · Atelier Azur
                      </span>
                      <br />
                      <a
                        href="mailto:nora@atelier-azur.example"
                        style={{
                          color: "#202327",
                          fontSize: "13px",
                          textDecoration: "none",
                        }}
                      >
                        nora@atelier-azur.example
                      </a>
                      <br />
                      <a
                        href="https://atelier-azur.example"
                        style={{ color: "#315ac2", fontSize: "13px" }}
                      >
                        atelier-azur.example
                      </a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div className="pc-email-footer">
            <button type="button" onClick={copySignature}>
              <Copy size={16} aria-hidden="true" />
              Copier la signature
            </button>
            <span>À installer dans les réglages de votre messagerie.</span>
          </div>
          <p className="pc-feedback" role="status">
            {signatureFeedback}
          </p>
        </div>
      </div>
    </section>
  );
}

const tools = [
  [
    "Liens",
    "Une adresse stable. Une destination que vous pilotez.",
    "wrx.example/r/azur",
  ],
  [
    "QR codes",
    "Direct ou relié explicitement à un Lien WRX.",
    "CONTENU / ENTRÉE GÉRÉE",
  ],
  [
    "Cartes de visite",
    "Votre identité, prête pour un support physique.",
    "FORMAT IMPRIMÉ",
  ],
  [
    "Cartes numériques",
    "Publier, partager, enregistrer le contact.",
    "wrx.example/c/nora-kane",
  ],
  [
    "Signatures e-mail",
    "Créer une signature et la copier dans votre messagerie.",
    "COPIER → INSTALLER",
  ],
  [
    "Mots de passe",
    "Un générateur indépendant pour vos besoins de sécurité.",
    "•••• •••• •••• ••••",
  ],
  [
    "Analytics",
    "Lire les clics sur les liens et les scans de QR gérés.",
    `${sampleEvents.filter((event) => event.type === "click").length} CLICS / ${sampleEvents.filter((event) => event.type === "scan").length} SCANS`,
  ],
  [
    "Profil / Identité de marque",
    "Une source réutilisable dans vos créations.",
    "NORA KANE / ATELIER AZUR",
  ],
];

export function ActivityWorkspace() {
  const root = useRef<HTMLElement>(null);
  const [event, setEvent] = useState<(typeof sampleEvents)[number]>(
    sampleEvents[0],
  );
  const [tool, setTool] = useState(6);
  useCompositionMotion(root, "activity");
  return (
    <section
      className="pc-activity-workspace"
      ref={root}
      aria-labelledby="pc-activity-title"
    >
      <div className="pc-return-source">
        <Label>RETOUR AU LIEN / PAS AUX CARTES NI AUX SIGNATURES</Label>
        <code>wrx.example/r/azur</code>
        <ArrowDown size={22} aria-hidden="true" />
      </div>
      <div className="pc-activity-heading">
        <div>
          <Label>03 / LIRE L’ACTIVITÉ</Label>
          <h2 id="pc-activity-title">Voir les passages.</h2>
        </div>
        <p>
          Les clics sur vos liens.
          <br />
          Les scans de vos QR gérés.
        </p>
      </div>
      <div className="pc-records">
        <div className="pc-record-caption">
          <Label>DONNÉES DE DÉMONSTRATION</Label>
          <span>08 OCT. 2026 · 09:00 — 11:00</span>
        </div>
        {(["click", "scan"] as const).map((type) => (
          <div className="pc-lane" key={type}>
            <div className="pc-lane-name">
              {type === "click" ? "CLICS SUR LE LIEN" : "SCANS DU QR GÉRÉ"}
              <strong>
                {sampleEvents.filter((item) => item.type === type).length}
              </strong>
            </div>
            <div className="pc-lane-track">
              <div className="pc-trace-reader" />
              {sampleEvents
                .filter((item) => item.type === type)
                .map((item) => (
                  <button
                    type="button"
                    className="pc-event"
                    style={{ left: `${(item.minute / 120) * 100}%` }}
                    key={item.time}
                    aria-label={`${type === "click" ? "Clic" : "Scan QR géré"} à ${item.time}`}
                    aria-pressed={event === item}
                    onClick={() => setEvent(item)}
                  >
                    <span />
                  </button>
                ))}
            </div>
          </div>
        ))}
        <div className="pc-time-axis">
          <span>09:00</span>
          <span>10:00</span>
          <span>11:00</span>
        </div>
        <div className="pc-event-detail" aria-live="polite">
          <span>{event.time}</span>
          <strong>
            {event.type === "click"
              ? "Clic sur le Lien WRX"
              : "Scan à l’entrée du QR géré"}
          </strong>
          <span>Exemple enregistré · aucune identification de personne</span>
        </div>
      </div>
      <div className="pc-workspace">
        <div className="pc-workspace-line" />
        <div className="pc-workspace-chrome">
          <strong>WRX / STUDIO</strong>
          <span>Un aperçu de votre espace</span>
          <span>
            <Check size={14} aria-hidden="true" /> Clair · Sombre · Système
          </span>
        </div>
        <div className="pc-workspace-heading">
          <Label>04 / UN ENDROIT POUR FAIRE</Label>
          <h2>
            Votre espace.
            <br />
            <span>Vos outils.</span>
          </h2>
        </div>
        <div className="pc-tool-layout">
          <div className="pc-tool-index" aria-label="Aperçu des outils WRX">
            {tools.map(([name], index) => (
              <button
                key={name}
                type="button"
                aria-pressed={tool === index}
                onClick={() => setTool(index)}
              >
                <span>0{index + 1}</span>
                {name}
                <ArrowUpRight size={17} aria-hidden="true" />
              </button>
            ))}
          </div>
          <div className="pc-tool-preview" aria-live="polite">
            <Label>APERÇU / {tools[tool]![0]}</Label>
            <div className="pc-preview-symbol" aria-hidden="true">
              {tool === 1 ? (
                <QrProof
                  value={MANAGED_INGRESS}
                  label="QR d’exemple"
                  size={150}
                />
              ) : tool === 5 ? (
                "Aa / 09 / #"
              ) : tool === 6 ? (
                "4 / 3"
              ) : (
                "↗"
              )}
            </div>
            <h3>{tools[tool]![0]}</h3>
            <p>{tools[tool]![1]}</p>
            <code>{tools[tool]![2]}</code>
            <small>
              Latérale, Dock ou Lanceur.
              <br />
              Votre navigation, votre accent, votre apparence.
            </small>
          </div>
        </div>
      </div>
    </section>
  );
}

export function FinalInvitation() {
  return (
    <footer className="pc-final">
      <Label>WRX / METTRE LE NUMÉRIQUE EN CIRCULATION</Label>
      <h2>
        Créez quelque chose
        <br />
        qui circule<span>.</span>
      </h2>
      <div>
        <Link className="bh-cta" to="/register">
          Créer mon espace WRX <ArrowUpRight size={18} aria-hidden="true" />
        </Link>
        <Link className="pc-login" to="/login">
          Se connecter <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      </div>
      <p>Créer. Partager. Sécuriser. Suivre.</p>
    </footer>
  );
}
